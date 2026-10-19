"""Protected hosted mode with synthetic credentials and server-persisted data."""
import base64
import dataclasses
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient
from app.auth import COOKIE
from app.main import create_app
from app.settings import Settings


class HostedTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.settings = Settings(mode='hosted', public_origin='https://workspace.example', username='owner',
                                 password='synthetic-password-for-tests', auth_secret='synthetic-session-secret-32-characters',
                                 database=str(Path(self.temp.name) / 'projects.sqlite3'))
        self.app = create_app(settings=self.settings, testing=True)
        self.client = TestClient(self.app, base_url=self.settings.public_origin)
        self.origin = {'Origin': self.settings.public_origin}

    def tearDown(self):
        self.client.close()
        self.temp.cleanup()

    def login(self, client=None):
        client = client or self.client
        response = client.post('/api/auth/login', json={'username': 'owner', 'password': self.settings.password}, headers=self.origin)
        self.assertEqual(response.status_code, 200, response.text)
        return response

    def headers(self, client=None):
        client = client or self.client
        return self.origin | {'X-Workspace-Token': client.get('/api/session').json()['write_token']}

    def test_hosted_settings_fail_closed(self):
        for changed in ({'password': ''}, {'auth_secret': 'short'}, {'database': ''}, {'database': 'relative.db'}, {'public_origin': 'http://workspace.example'}, {'public_origin': 'https://workspace.example/path'}, {'mode': 'public'}, {'username': 'untrusted/user'}):
            with self.subTest(changed=list(changed)):
                with self.assertRaises(ValueError):
                    dataclasses.replace(self.settings, **changed).validate()

    def test_no_project_asset_or_token_disclosure_before_sign_in(self):
        self.assertEqual(self.client.get('/api/health').status_code, 200)
        self.assertFalse(self.client.get('/api/auth/status').json()['authenticated'])
        for path in ['/api/projects', '/api/session', '/api/projects/any/revisions', '/api/projects/any/assets/any']:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 401)
                self.assertEqual(response.headers['cache-control'], 'no-store')
        self.assertEqual(self.client.get('/api/projects', headers={'Host': 'foreign.example'}).status_code, 401)

    def test_credentials_cookie_csrf_origin_and_logout_revocation(self):
        wrong = self.client.post('/api/auth/login', json={'username': 'owner', 'password': 'wrong'}, headers=self.origin)
        self.assertEqual(wrong.status_code, 401)
        self.assertNotIn('wrong', wrong.text)
        response = self.login()
        cookie = response.headers['set-cookie']
        for flag in ('Secure', 'HttpOnly', 'SameSite=strict', 'Path=/'):
            self.assertIn(flag, cookie)
        self.assertNotIn('Domain=', cookie)
        stolen = self.client.cookies.get(COOKIE)
        headers = self.headers()
        self.assertEqual(self.client.post('/api/projects', json={'name': 'Flange'}, headers=self.origin).status_code, 403)
        self.assertEqual(self.client.post('/api/projects', json={'name': 'Flange'}, headers=headers | {'Origin': 'https://foreign.example'}).status_code, 403)
        self.assertEqual(self.client.post('/api/projects', json={'name': 'Flange'}, headers={k: v for k, v in headers.items() if k != 'Origin'}).status_code, 403)
        project = self.client.post('/api/projects', json={'name': 'Flange'}, headers=headers)
        self.assertEqual(project.status_code, 201, project.text)
        self.assertEqual(self.client.post('/api/auth/logout', json={}, headers=headers).status_code, 200)
        self.client.cookies.set(COOKIE, stolen, domain='workspace.example', path='/')
        self.assertEqual(self.client.get('/api/projects').status_code, 401)

    def test_hosted_origin_diagnostics_never_relax_login_protection(self):
        status = self.client.get('/api/auth/status').json()
        self.assertEqual(status['public_origin'], self.settings.public_origin)
        for origin in ('http://localhost:8000', 'https://other-8000.app.github.dev', None):
            response = self.client.post('/api/auth/login', json={'username': 'owner', 'password': self.settings.password}, headers={'Origin': origin} if origin else {})
            self.assertEqual(response.status_code, 403)
            self.assertEqual(response.json()['code'], 'workspace_origin_mismatch')
            self.assertEqual(response.json()['received_origin'], origin)
            self.assertNotIn(self.settings.password, response.text)
            self.assertNotIn('set-cookie', response.headers)
        self.login()

    def test_codespaces_rewritten_origin_requires_bound_host_and_browser_metadata(self):
        settings = dataclasses.replace(self.settings, codespaces_proxy=True, codespace_name='synthetic-codespace', public_origin='https://synthetic-codespace-8000.app.github.dev')
        with TestClient(create_app(settings=settings, testing=True), base_url=settings.public_origin) as client:
            headers = {'Origin': 'http://localhost:8000', 'X-Forwarded-Host': 'synthetic-codespace-8000.app.github.dev', 'Sec-Fetch-Site': 'same-origin'}
            credentials = {'username': 'owner', 'password': settings.password}
            response = client.post('/api/auth/login', json=credentials, headers=headers)
            self.assertEqual(response.status_code, 200, response.text)
            token = client.get('/api/session').json()['write_token']
            self.assertEqual(client.post('/api/projects', json={'name': 'Tunnel trial'}, headers=headers | {'X-Workspace-Token': token}).status_code, 201)
            # Session alone does not bypass the write token or origin boundary.
            self.assertEqual(client.post('/api/projects', json={'name': 'Blocked'}, headers=headers).status_code, 403)
            for modified in ({'Sec-Fetch-Site': 'cross-site'}, {'Sec-Fetch-Site': 'same-site'}, {'Sec-Fetch-Site': ''}, {'X-Forwarded-Host': 'foreign.app.github.dev'}, {'X-Forwarded-Host': ''}, {'Origin': 'https://foreign.example'}, {'Origin': 'http://localhost:9000'}, {'Origin': 'null'}):
                rejected = client.post('/api/auth/login', json=credentials, headers=headers | modified)
                self.assertEqual(rejected.status_code, 403, modified)
                self.assertNotIn('set-cookie', rejected.headers)
        # The compatibility path is unavailable to ordinary hosted deployments.
        self.assertEqual(self.client.post('/api/auth/login', json={'username': 'owner', 'password': self.settings.password}, headers={'Origin': 'http://localhost:8000', 'X-Forwarded-Host': 'workspace.example', 'Sec-Fetch-Site': 'same-origin'}).status_code, 403)
        for values in ({'codespace_name': ''}, {'public_origin': 'https://foreign.app.github.dev'}, {'codespace_name': 'bad/name'}):
            with self.assertRaises(ValueError):
                dataclasses.replace(settings, **values).validate()

    def test_persistent_cookie_projects_original_assets_after_restart(self):
        self.login()
        headers = self.headers()
        project = self.client.post('/api/projects', json={'name': 'Bracket'}, headers=headers).json()
        original = b'o bracket\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n'
        path = '/api/projects/' + project['id']
        saved = self.client.post(path + '/assets', json={'base_revision': 0, 'name': 'bracket.obj', 'units': 'in', 'content_base64': base64.b64encode(original).decode()}, headers=headers)
        self.assertEqual(saved.status_code, 201, saved.text)
        cookie = self.client.cookies.get(COOKIE)
        restarted = TestClient(create_app(settings=self.settings, testing=True), base_url=self.settings.public_origin)
        try:
            restarted.cookies.set(COOKIE, cookie, domain='workspace.example', path='/')
            self.assertTrue(restarted.get('/api/auth/status').json()['authenticated'])
            reopened = restarted.get(path).json()
            self.assertEqual(reopened['asset']['source_units'], 'in')
            self.assertEqual(restarted.get(path + '/assets/' + reopened['asset']['id']).content, original)
            anonymous = TestClient(self.app, base_url=self.settings.public_origin)
            try:
                self.assertEqual(anonymous.get(path).status_code, 401)
            finally:
                anonymous.close()
        finally:
            restarted.close()

    def test_expiry_and_password_rotation_revoke_sessions(self):
        self.login()
        cookie = self.client.cookies.get(COOKIE)
        now = self.app.state.auth.clock()
        self.app.state.auth.clock = lambda: now + self.settings.session_seconds + 1
        self.assertEqual(self.client.get('/api/session').status_code, 401)
        rotated = dataclasses.replace(self.settings, password='a-different-synthetic-password')
        restarted = TestClient(create_app(settings=rotated, testing=True), base_url=rotated.public_origin)
        try:
            restarted.cookies.set(COOKIE, cookie, domain='workspace.example', path='/')
            self.assertEqual(restarted.get('/api/session').status_code, 401)
        finally:
            restarted.close()

    def test_login_limits_unicode_and_no_echo_of_invalid_password(self):
        secret = 'x' * 513
        invalid = self.client.post('/api/auth/login', json={'username': 'owner', 'password': secret}, headers=self.origin)
        self.assertEqual(invalid.status_code, 422)
        self.assertNotIn(secret, invalid.text)
        for index in range(5):
            bad = self.client.post('/api/auth/login', json={'username': 'étudiant', 'password': 'wrong'}, headers=self.origin)
            self.assertEqual(bad.status_code, 401)
        limited = self.client.post('/api/auth/login', json={'username': 'owner', 'password': self.settings.password}, headers=self.origin)
        self.assertEqual(limited.status_code, 429)


if __name__ == '__main__':
    unittest.main()
