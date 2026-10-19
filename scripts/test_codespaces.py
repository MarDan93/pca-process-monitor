"""Exercise the real launcher/auth/API in a synthetic Codespaces environment.

Does not create a Codespace or verify GitHub's external port forwarding.
Owns its temporary database, credentials and launched processes only.
"""
import http.client
import json
import os
from pathlib import Path
import signal
import socket
import subprocess
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]


def main():
    with socket.socket() as probe:
        try:
            probe.bind(("127.0.0.1", 8000))
        except OSError:
            raise SystemExit("Port 8000 is already occupied. No unrelated process was stopped.")
    with tempfile.TemporaryDirectory(prefix="mould-codespaces-test-") as folder:
        root = Path(folder)
        for name in ("server", "web", ".venv-app"):
            (root / name).symlink_to(ROOT / name, target_is_directory=True)
        pid = None
        cookie, token = "", ""
        origin = "https://synthetic-verification-8000.app.github.dev"
        def request(path, body=None, authenticated=True):
            connection = http.client.HTTPConnection("127.0.0.1", 8000, timeout=160)
            headers = {"Host": "synthetic-verification-8000.app.github.dev", "Origin": "http://localhost:8000", "X-Forwarded-Host": "synthetic-verification-8000.app.github.dev", "Sec-Fetch-Site": "same-origin"}
            if authenticated:
                headers.update({"Cookie": cookie, "X-Workspace-Token": token})
            data = None if body is None else json.dumps(body)
            if data is not None:
                headers["Content-Type"] = "application/json"
            connection.request("GET" if body is None else "POST", path, data, headers)
            response = connection.getresponse()
            raw, status, response_headers = response.read(), response.status, dict(response.getheaders())
            connection.close()
            return status, json.loads(raw), response_headers
        def launch():
            nonlocal pid
            code = "import importlib.util,pathlib; s=importlib.util.spec_from_file_location('launcher'," + repr(str(ROOT / "scripts/start_codespaces.py")) + "); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); m.ROOT=pathlib.Path(" + repr(str(root)) + "); m.main()"
            result = subprocess.run([sys.executable, "-c", code], env={**os.environ, "CODESPACE_NAME": "synthetic-verification"}, capture_output=True, text=True, timeout=45)
            if result.returncode:
                raise AssertionError(result.stderr or result.stdout)
            pid = int((root / ".cache/codespaces/workspace.pid").read_text())
        def stop():
            nonlocal pid
            if pid:
                try:
                    os.kill(pid, signal.SIGTERM)
                except ProcessLookupError:
                    pass
                pid = None
                for _ in range(100):
                    try:
                        with socket.create_connection(("127.0.0.1", 8000), timeout=.1):
                            time.sleep(.1)
                    except OSError:
                        return
                raise AssertionError("Owned API process did not stop.")
        try:
            launch()
            assert request('/api/health')[1]['codespaces_proxy'] is True
            assert request('/api/projects', authenticated=False)[0] == 401
            private = json.loads((root / '.cache/codespaces/owner-credentials.json').read_text())
            status, _, headers = request('/api/auth/login', {"username": private['username'], "password": private['password']}, authenticated=False)
            assert status == 200
            cookie = headers['set-cookie'].split(';', 1)[0]
            token = request('/api/session')[1]['write_token']
            project = request('/api/projects', {"name": "Synthetic Codespaces process"})[1]
            path = '/api/projects/' + project['id']
            scenario = request('/api/process/example')[1]
            def apply(values, source, revision):
                status, op, _ = request(path + '/process/preview', {"base_revision": revision, "changes": values, "source": source})
                assert status == 200
                approval = request(path + '/operations/' + op['id'] + '/approve', {"digest": op['digest']})[1]
                status, state, _ = request(path + '/operations/' + op['id'] + '/execute', {**approval, "idempotency_key": 'apply-' + op['id']})
                assert status == 200
                return state
            project = apply(scenario, {"kind": "manual"}, 0)
            status, initial, _ = request(path + '/process/runs', {"base_revision": project['revision']})
            assert status == 200 and initial['summary']['output_parts'] == 10
            started = time.perf_counter()
            status, answer, _ = request(path + '/assistant', {"base_revision": 1, "message": "Set cooling_s to 12 seconds and cycles to 3.", "mode": "process", "language": "en"})
            assert status == 200 and answer['process'] == scenario | {"cooling_s": 12., "cycles": 3}
            elapsed = time.perf_counter() - started
            assert request(path)[1]['revision'] == 1
            project = apply(answer['process'], answer['source'], 1)
            status, updated, _ = request(path + '/process/runs', {"base_revision": project['revision']})
            assert status == 200 and updated['duration_s'] == 104 and updated['summary']['output_parts'] == 6
            # Exercise the actual safe restart path, preserving credentials/session/data.
            restart_code = "import importlib.util,pathlib,sys; s=importlib.util.spec_from_file_location('launcher'," + repr(str(ROOT / "scripts/start_codespaces.py")) + "); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); m.ROOT=pathlib.Path(" + repr(str(root)) + "); sys.argv=['start_codespaces.py','--restart']; m.main()"
            restarted = subprocess.run([sys.executable, '-c', restart_code], env={**os.environ, 'CODESPACE_NAME': 'synthetic-verification'}, capture_output=True, text=True, timeout=45)
            assert restarted.returncode == 0, restarted.stderr
            pid = int((root / '.cache/codespaces/workspace.pid').read_text())
            assert request(path + '/process/latest')[1] == updated
            assert request(path)[1]['process']['cycles'] == 3
            assert request('/api/auth/logout', {})[0] == 200
            assert request('/api/projects')[0] == 401
            evidence = {"actual_codespace": False, "synthetic_codespaces_environment": True, "launcher": "passed", "rewritten_origin_with_bound_host_and_fetch_metadata": "passed", "authenticated_process_ai_workflow": "passed", "safe_restart_persistence": "passed", "logout_revocation": "passed", "actual_server_cpu_inference_s": round(elapsed, 3), "initial_duration_s": 126, "updated_duration_s": 104, "github_port_forwarding": "owner is now using the external app; this increment is not yet verified in their instance"}
            target = ROOT / '.cache/verification/codespaces-process.json'
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(json.dumps(evidence, indent=2))
            print('PASS real Codespaces launcher in synthetic environment, owner login, actual server AI, approved process rerun, restart persistence and logout')
        finally:
            stop()


if __name__ == '__main__':
    main()
