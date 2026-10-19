import json
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from app.assistant import AssistantRequest, validated_result
from app.main import create_app
from app.process import ProcessScenario, example, simulate


class ProcessEngineTests(unittest.TestCase):
    def test_analytical_schedule_and_mass_balance(self):
        run = simulate(example())
        self.assertEqual(run["status"], "completed")
        self.assertEqual(run["cycles"][0]["injection_start_s"], 27)
        self.assertEqual(run["cycles"][0]["deposit_s"], 46)
        self.assertEqual(run["duration_s"], 126)
        self.assertEqual(run["summary"]["mean_cycle_interval_s"], 17)
        self.assertEqual(run["summary"]["output_parts"], 10)
        self.assertEqual(run["summary"]["consumed_g"], 220)
        self.assertEqual(run["summary"]["runner_g"], 20)
        for time in sorted({e["end_s"] for e in run["events"]}):
            bins = {"raw": 1000.}
            for event in run["events"]:
                if event["end_s"] <= time:
                    for key, value in event["mass_delta_g"].items():
                        bins[key] = bins.get(key, 0.) + value
            self.assertAlmostEqual(sum(bins.values()), 1000.)
            self.assertGreaterEqual(min(bins.values()), -1e-8)
        for resource in ("press", "robot", "screw", "feeder"):
            events = sorted((e for e in run["events"] if e["resource"] == resource and e["end_s"] > e["start_s"]), key=lambda e: e["start_s"])
            for a, b in zip(events, events[1:]):
                self.assertLessEqual(a["end_s"], b["start_s"], resource)
        # Next-shot plasticising really overlaps the preceding cooling phase.
        screw2 = next(e for e in run["events"] if e["phase"] == "plasticising" and e["cycle"] == 2)
        cooling1 = next(e for e in run["events"] if e["phase"] == "cooling" and e["cycle"] == 1)
        self.assertEqual(screw2["start_s"], cooling1["start_s"])

    def test_starvation_orientation_hopper_and_repeatability(self):
        def changed(**values): return ProcessScenario.model_validate(example().model_dump() | values)
        partial = simulate(changed(initial_material_g=60.))
        self.assertEqual(partial["status"], "partial")
        self.assertEqual(partial["summary"]["output_parts"], 2)
        self.assertEqual(partial["summary"]["remaining_g"], 16)
        self.assertIn("material_starved", partial["issues"])
        for config, issue in [({"belt_orientation_deg": 180}, "orientation_unreachable"), ({"hopper_capacity_g": 40.}, "hopper_too_small")]:
            result = simulate(changed(**config))
            self.assertEqual(result["status"], "blocked")
            self.assertEqual(result["events"], [])
            self.assertIn(issue, result["issues"])
        self.assertEqual(simulate(example()), simulate(example()))

    def test_robot_and_belt_contention_extend_cycle(self):
        base = example().model_dump()
        slow_robot = simulate(ProcessScenario.model_validate(base | {"robot_return_s": 30.}))
        self.assertTrue(any(e["phase"] == "robot_wait" for e in slow_robot["events"]))
        slow_belt = simulate(ProcessScenario.model_validate(base | {"belt_speed_mm_s": 1.}))
        self.assertTrue(any(e["phase"] == "belt_wait" for e in slow_belt["events"]))
        no_dryer = simulate(ProcessScenario.model_validate(base | {"dryer_enabled": False}))
        self.assertEqual(no_dryer["cycles"][0]["injection_start_s"], 7)


class ProcessWorkflowTests(unittest.TestCase):
    def test_approval_undo_persistence_stale_and_typed_assistant(self):
        with tempfile.TemporaryDirectory() as folder:
            database = Path(folder) / "projects.sqlite3"
            client = TestClient(create_app(database, testing=True))
            headers = {"X-Workspace-Token": client.get('/api/session').json()['write_token']}
            project = client.post('/api/projects', json={"name": "Process test"}, headers=headers).json()
            path = '/api/projects/' + project['id']
            scenario = client.get('/api/process/example').json()
            def preview(changes, revision):
                return client.post(path + '/process/preview', headers=headers, json={"base_revision": revision, "changes": changes, "source": {"kind": "manual"}}).json()
            def approve(op):
                token = client.post(path + '/operations/' + op['id'] + '/approve', headers=headers, json={"digest": op['digest']}).json()
                return client.post(path + '/operations/' + op['id'] + '/execute', headers=headers, json={**token, "idempotency_key": 'execute-process-' + op['id']}).json()
            op = preview(scenario, 0)
            self.assertIsNone(client.get(path).json()['process'])
            self.assertEqual(client.post(path + '/process/runs', headers=headers, json={"base_revision": 0}).status_code, 422)
            project = approve(op)
            self.assertEqual(project['revision'], 1)
            run = client.post(path + '/process/runs', headers=headers, json={"base_revision": 1}).json()
            self.assertEqual(run['summary']['output_parts'], 10)
            saved = TestClient(create_app(database, testing=True)).get(path + '/process/latest').json()
            self.assertEqual(saved, run)
            self.assertIsNone(client.get(path).json()['commercial']['annual_volume'])
            ai_request = AssistantRequest(base_revision=1, message="Set cooling_s to 12", mode="process")
            reply = validated_result('{"reply":"Changed cooling","changes":{"cooling_s":12}}', ai_request, project)
            self.assertEqual(reply['process']['cooling_s'], 12)
            self.assertEqual(client.get(path).json()['process']['cooling_s'], 8)
            for patch in ({"shell_command": "run"}, {"cooling_s": "12"}, {"cooling_s": -1}, {"cycles": 100000}):
                rejected = validated_result(json.dumps({"reply": "Unsafe", "changes": patch}), ai_request, project)
                self.assertIsNone(rejected['process'])
                self.assertIn('validation_error', rejected)
            project = approve(preview(scenario | {"cooling_s": 12}, 1))
            self.assertNotEqual(project['revision'], run['project_revision'])
            self.assertEqual(client.post(path + '/process/runs', headers=headers, json={"base_revision": 1}).status_code, 409)
            undo = client.post(path + '/operations/' + op['id'] + '/undo', headers=headers, json={"base_revision": 2, "idempotency_key": "wrong-undo-process"})
            self.assertEqual(undo.status_code, 409)
            self.assertEqual(client.get(path + '/process/latest').json(), saved)
            invalid = client.post(path + '/process/preview', headers=headers, json={"base_revision": 2, "changes": scenario | {"cycles": 10000}, "source": {"kind": "manual"}})
            self.assertEqual(invalid.status_code, 422)
            # Existing commercial execution/undo must preserve the new process state.
            commercial = client.post(path + '/operations/preview', headers=headers, json={"base_revision": 2, "changes": {"annual_volume": 1000}, "source": {"kind": "manual"}}).json()
            edited = approve(commercial)
            self.assertEqual(edited['process'], project['process'])
            undone = client.post(path + '/operations/' + commercial['id'] + '/undo', headers=headers, json={"base_revision": 3, "idempotency_key": "undo-commercial-keeping-process"}).json()
            self.assertEqual(undone['process'], project['process'])
            self.assertIsNone(undone['commercial']['annual_volume'])


if __name__ == '__main__':
    unittest.main()
