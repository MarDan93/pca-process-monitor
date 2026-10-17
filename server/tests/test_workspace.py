"""Observable storage/approval/security contracts, using synthetic projects only."""
import base64
import sqlite3
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from fastapi.testclient import TestClient
from app.main import create_app
from app.schemas import ExecuteRequest
from app.store import DomainError, Store


class WorkspaceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / "workspace.db"
        self.app = create_app(self.path, testing=True)
        self.client = TestClient(self.app)
        self.headers = {"X-Workspace-Token": self.client.get('/api/session').json()['write_token']}
        self.store = self.app.state.store
        self.project = self.client.post('/api/projects', json={"name": "Flange"}, headers=self.headers).json()
        self.base = f'/api/projects/{self.project["id"]}'

    def tearDown(self):
        self.client.close()
        self.temp.cleanup()

    def post(self, suffix, body):
        return self.client.post(self.base + suffix, json=body, headers=self.headers)

    def preview(self, patch, revision=0):
        response = self.post('/operations/preview', {"base_revision": revision, "changes": patch, "source": {"kind": "manual"}})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def execute(self, preview, key='idempotency-key-123'):
        url = f'/operations/{preview["id"]}'
        approval = self.post(url + '/approve', {"digest": preview['digest']})
        self.assertEqual(approval.status_code, 200, approval.text)
        body = {**approval.json(), "idempotency_key": key}
        result = self.post(url + '/execute', body)
        self.assertEqual(result.status_code, 200, result.text)
        return result.json(), body

    def test_independent_generic_projects_missing_zero_and_restart(self):
        self.assertTrue(all(v is None for v in self.project['commercial'].values()))
        self.assertIsNone(self.project['asset'])
        second = self.client.post('/api/projects', json={"name": "Bracket"}, headers=self.headers).json()
        result, _ = self.execute(self.preview({"annual_volume": 0, "commercial_unit": "kit", "currency": "USD", "selling_price": 0.0}))
        self.assertEqual(result['revision'], 1)
        self.assertEqual(result['commercial']['annual_volume'], 0)
        self.assertEqual(Store(self.path).get(result['id']), result)
        self.assertIsNone(self.store.get(second['id'])['commercial']['annual_volume'])
        self.assertIsNone(self.store.get(second['id'])['commercial']['currency'])

    def test_preview_never_mutates_and_undo_appends_history(self):
        preview = self.preview({"annual_volume": 80000, "market": "Appliances"})
        self.assertEqual(self.store.get(self.project['id']), self.project)
        result, body = self.execute(preview)
        self.assertEqual(result['commercial']['annual_volume'], 80000)
        again = self.post(f'/operations/{preview["id"]}/execute', body)
        self.assertEqual(again.json(), result)
        undone = self.post(f'/operations/{preview["id"]}/undo', {"base_revision": 1, "idempotency_key": "undo-key-1234567"})
        self.assertEqual(undone.status_code, 200, undone.text)
        self.assertEqual(undone.json()['revision'], 2)
        self.assertEqual(undone.json()['commercial'], self.project['commercial'])
        self.assertEqual([r['revision'] for r in self.store.history(self.project['id'])], [2, 1, 0])
        self.assertEqual(self.post(f'/operations/{preview["id"]}/undo', {"base_revision": 1, "idempotency_key": "undo-key-1234567"}).json(), undone.json())

    def test_strict_unknown_fields_units_numbers_and_currency(self):
        for patch in ({"annual_volume": -1}, {"annual_volume": 1.5}, {"annual_volume": True}, {"annual_volume": "100"}, {"annual_volume": 9007199254740992}, {"currency": "BTC"}, {"units": "kg"}, {"commercial_unit": "pieces"}, {"market": "x" * 301}, {"unit_cost_target": 3.0}, {"program_years": 0}):
            with self.subTest(patch=patch):
                self.assertEqual(self.post('/operations/preview', {"base_revision": 0, "changes": patch, "source": {"kind": "manual"}}).status_code, 422)
        self.assertEqual(self.store.get(self.project['id'])['revision'], 0)
        self.execute(self.preview({"currency": "EUR", "selling_price": 3.0}))
        self.assertEqual(self.post('/operations/preview', {"base_revision": 1, "changes": {"currency": "USD"}, "source": {"kind": "manual"}}).status_code, 422)

    def test_approval_is_bound_to_exact_effects_and_token(self):
        one = self.preview({"annual_volume": 100})
        two = self.preview({"annual_volume": 200})
        self.assertEqual(self.post(f'/operations/{one["id"]}/approve', {"digest": two['digest']}).status_code, 409)
        approval = self.post(f'/operations/{one["id"]}/approve', {"digest": one['digest']}).json()
        self.assertEqual(self.post(f'/operations/{one["id"]}/approve', {"digest": one['digest']}).status_code, 409)
        self.assertEqual(self.post(f'/operations/{two["id"]}/execute', {**approval, "digest": two['digest'], "idempotency_key": "another-key-1234"}).status_code, 403)
        self.assertEqual(self.post(f'/operations/{one["id"]}/execute', {**approval, "idempotency_key": "another-key-1234", "changes": {"annual_volume": 900}}).status_code, 422)

    def test_expired_and_stale_approvals_do_not_write(self):
        preview = self.preview({"annual_volume": 100})
        self.store.clock = lambda: preview['expires_at'] + 1
        self.assertEqual(self.post(f'/operations/{preview["id"]}/approve', {"digest": preview['digest']}).status_code, 409)
        self.store.clock = lambda: preview['expires_at'] - 10
        stale = self.preview({"market": "Medical"})
        self.execute(preview)
        self.assertEqual(self.post(f'/operations/{stale["id"]}/approve', {"digest": stale['digest']}).status_code, 409)
        self.assertEqual(self.store.get(self.project['id'])['commercial']['market'], None)

    def test_replay_and_undo_cannot_overwrite_intervening_edit(self):
        first = self.preview({"annual_volume": 100})
        _, body = self.execute(first)
        self.assertEqual(self.post(f'/operations/{first["id"]}/execute', {**body, "idempotency_key": "different-key-123"}).status_code, 409)
        self.execute(self.preview({"market": "Medical"}, 1), 'second-operation-key')
        self.assertEqual(self.post(f'/operations/{first["id"]}/undo', {"base_revision": 2, "idempotency_key": "undo-after-edit"}).status_code, 409)
        self.assertEqual(self.store.get(self.project['id'])['commercial']['market'], 'Medical')

    def test_owner_project_origin_and_request_limits(self):
        with self.assertRaises(DomainError) as error:
            Store(self.path, principal='someone-else').get(self.project['id'])
        self.assertEqual(error.exception.status, 404)
        self.assertEqual(self.client.post('/api/projects', json={"name": "forged"}).status_code, 403)
        self.assertEqual(self.client.post('/api/projects', json={"name": "forged"}, headers={**self.headers, "Origin": "https://evil.invalid"}).status_code, 403)
        self.assertEqual(self.client.get('/api/projects', headers={"Host": "evil.invalid"}).status_code, 400)
        self.assertEqual(self.client.post('/api/projects', content=b'x' * 33000, headers={**self.headers, "Content-Type": "application/json"}).status_code, 413)
        other = self.client.post('/api/projects', json={"name": "Bracket"}, headers=self.headers).json()
        preview = self.preview({"annual_volume": 12})
        response = self.client.post(f'/api/projects/{other["id"]}/operations/{preview["id"]}/approve', json={"digest": preview['digest']}, headers=self.headers)
        self.assertEqual(response.status_code, 404)

    def test_original_asset_bytes_units_and_reopen(self):
        original = b'o bracket\nv 0 0 0\nv 4 0 0\nv 0 2 0\nf 1 2 3\n'
        result = self.post('/assets', {"base_revision": 0, "name": "bracket.obj", "units": "in", "content_base64": base64.b64encode(original).decode()})
        self.assertEqual(result.status_code, 201, result.text)
        project = result.json()
        manifest = project['asset']
        self.assertEqual(manifest['source_units'], 'in')
        reopened = Store(self.path)
        self.assertEqual(reopened.get(project['id'])['asset'], manifest)
        self.assertEqual(reopened.asset(project['id'], manifest['id']), original)
        self.assertEqual(self.client.get(self.base + '/assets/' + manifest['id']).content, original)
        self.assertEqual(self.post('/assets', {"base_revision": 1, "name": "part.step", "units": "mm", "content_base64": base64.b64encode(original).decode()}).status_code, 422)

    def test_concurrent_writers_allow_one_revision(self):
        one = self.preview({"annual_volume": 100})
        two = self.preview({"annual_volume": 200})
        requests = []
        for preview in (one, two):
            approval = self.store.approve(self.project['id'], preview['id'], preview['digest'])
            requests.append((preview['id'], ExecuteRequest(**approval, idempotency_key='concurrent-write-key')))
        def apply(item):
            try:
                return self.store.execute(self.project['id'], item[0], item[1])['revision']
            except DomainError as error:
                return error.status
        with ThreadPoolExecutor(max_workers=2) as pool:
            self.assertEqual(sorted(pool.map(apply, requests)), [1, 409])
        self.assertEqual(len(self.store.history(self.project['id'])), 2)

    def test_failed_revision_insert_rolls_back_state_and_consumption(self):
        preview = self.preview({"annual_volume": 100})
        approval = self.store.approve(self.project['id'], preview['id'], preview['digest'])
        request = ExecuteRequest(**approval, idempotency_key='rollback-retry-key')
        with self.store.connection(True) as db:
            db.execute("CREATE TRIGGER fail_revision BEFORE INSERT ON revisions WHEN NEW.revision>0 BEGIN SELECT RAISE(ABORT, 'injected storage failure'); END")
        with self.assertRaises(sqlite3.IntegrityError):
            self.store.execute(self.project['id'], preview['id'], request)
        self.assertEqual(self.store.get(self.project['id']), self.project)
        with self.store.connection(True) as db:
            db.execute('DROP TRIGGER fail_revision')
        self.assertEqual(self.store.execute(self.project['id'], preview['id'], request)['revision'], 1)

    def test_ai_identity_required_and_retained(self):
        body = {"base_revision": 0, "changes": {"market": "Electronics"}, "source": {"kind": "ai"}}
        self.assertEqual(self.post('/operations/preview', body).status_code, 422)
        body['source'] |= {"request": "Set market to Electronics", "model": "synthetic-test-model", "model_revision": "fixture-v1"}
        preview = self.post('/operations/preview', body).json()
        self.execute(preview)
        source = self.store.history(self.project['id'])[0]['source']
        self.assertEqual(source['request'], body['source']['request'])
        self.assertEqual(source['model_revision'], 'fixture-v1')

    def test_decimal_amounts_are_exact_and_currency_is_explicit(self):
        result, _ = self.execute(self.preview({"currency": "EUR", "unit_cost_target": "0.123456", "selling_price": "123456789012.345678"}))
        self.assertEqual(result['commercial']['unit_cost_target'], '0.123456')
        self.assertEqual(result['commercial']['selling_price'], '123456789012.345678')
        rejected = self.post('/operations/preview', {"base_revision": 1, "changes": {"unit_cost_target": "0.1234567"}, "source": {"kind": "manual"}})
        self.assertEqual(rejected.status_code, 422)


if __name__ == '__main__':
    unittest.main()
