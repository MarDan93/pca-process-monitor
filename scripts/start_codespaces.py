"""Start the authenticated hosted app behind a private Codespaces forwarded port."""
import json
import os
import re
import secrets
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def configuration(environ, root=None):
    root = root or ROOT
    name = environ.get("CODESPACE_NAME", "")
    domain = environ.get("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN", "app.github.dev")
    if not re.fullmatch(r"[a-z0-9-]{1,120}", name) or domain != "app.github.dev":
        raise ValueError("Run this launcher inside GitHub Codespaces. Use run_workspace.py for local development.")
    data = root / ".cache/codespaces"
    data.mkdir(parents=True, exist_ok=True)
    credentials = data / "owner-credentials.json"
    if not credentials.exists():
        # Exclusive creation, restrictive permissions, never echoed into logs or Git.
        with open(credentials, "x", opener=lambda p, flags: os.open(p, flags, 0o600)) as stream:
            json.dump({"username": "owner", "password": secrets.token_urlsafe(24), "session_secret": secrets.token_urlsafe(40)}, stream)
    private = json.loads(credentials.read_text())
    result = {**environ, "MOULD_RUNTIME": "hosted", "MOULD_PUBLIC_ORIGIN": f"https://{name}-8000.{domain}",
              "MOULD_WORKSPACE_DB": str(root / ".cache/workspace/projects.sqlite3"),
              "MOULD_ADMIN_USER": private["username"], "MOULD_ADMIN_PASSWORD": private["password"], "MOULD_AUTH_SECRET": private["session_secret"],
              "MOULD_SERVER_AI": "1"}
    return result, credentials


def main():
    try:
        environment, credentials = configuration(os.environ)
    except ValueError as error:
        raise SystemExit(str(error))
    python = ROOT / ".venv-app/bin/python"
    if not python.exists() or not (ROOT / "web/dist/index.html").exists():
        raise SystemExit("Setup is incomplete. Run python scripts/setup_codespaces.py --with-ai.")
    # Readiness is verified, not inferred from a stale PID file.
    health = "http://127.0.0.1:8000/api/health"
    try:
        with urllib.request.urlopen(health, timeout=2) as response:
            if json.load(response).get("mode") != "hosted":
                raise SystemExit("Port 8000 is occupied by another service; it was left untouched.")
    except OSError:
        with (ROOT / ".cache/codespaces/workspace.log").open("ab") as log:
            process = subprocess.Popen([str(python), "-m", "uvicorn", "app.main:app", "--app-dir", "server", "--host", "0.0.0.0", "--port", "8000"],
                cwd=ROOT, env=environment, stdout=log, stderr=log, start_new_session=True)
        (ROOT / ".cache/codespaces/workspace.pid").write_text(str(process.pid))
        for _ in range(120):
            if process.poll() is not None:
                raise SystemExit("App startup failed. See .cache/codespaces/workspace.log.")
            try:
                with urllib.request.urlopen(health, timeout=1) as response:
                    if json.load(response).get("mode") == "hosted":
                        break
            except OSError:
                time.sleep(.25)
        else:
            raise SystemExit("App readiness timed out. See .cache/codespaces/workspace.log.")
    print("Mould Studio is ready. Open port 8000 from the Ports tab; keep its visibility Private.")
    print(f"Sign in as owner. Read your private password in {credentials.relative_to(ROOT)}; do not commit or share that file.")


if __name__ == "__main__":
    main()
