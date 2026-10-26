"""Start the authenticated hosted app behind a private Codespaces forwarded port."""
import json
import os
import re
import secrets
import signal
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def public_origin(environ):
    name = environ.get("CODESPACE_NAME", "")
    domain = environ.get("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN", "app.github.dev")
    if not re.fullmatch(r"[a-z0-9-]{1,120}", name) or domain != "app.github.dev":
        raise ValueError("Run this launcher inside GitHub Codespaces. Use run_workspace.py for local development.")
    return f"https://{name}-8000.{domain}"


def configuration(environ, root=None):
    root = root or ROOT
    origin = public_origin(environ)
    data = root / ".cache/codespaces"
    data.mkdir(parents=True, exist_ok=True)
    credentials = data / "owner-credentials.json"
    if not credentials.exists():
        # Exclusive creation, restrictive permissions, never echoed into logs or Git.
        with open(credentials, "x", opener=lambda p, flags: os.open(p, flags, 0o600)) as stream:
            json.dump({"username": "owner", "password": secrets.token_urlsafe(24), "session_secret": secrets.token_urlsafe(40)}, stream)
    private = json.loads(credentials.read_text())
    result = {**environ, "MOULD_RUNTIME": "hosted", "MOULD_PUBLIC_ORIGIN": origin,
              "MOULD_WORKSPACE_DB": str(root / ".cache/workspace/projects.sqlite3"),
              "MOULD_ADMIN_USER": private["username"], "MOULD_ADMIN_PASSWORD": private["password"], "MOULD_AUTH_SECRET": private["session_secret"],
              "MOULD_SERVER_AI": "1", "MOULD_CODESPACES_PROXY": "1"}
    return result, credentials


def stop_owned_runtime(root):
    """Stop only the launcher PID with this checkout's exact command and cwd."""
    record = root / ".cache/codespaces/workspace.pid"
    if not record.exists():
        return
    pid = int(record.read_text().strip())
    expected = [str(root / ".venv-app/bin/python"), "-m", "uvicorn", "app.main:app", "--app-dir", "server", "--host", "0.0.0.0", "--port", "8000"]
    try:
        command = Path(f"/proc/{pid}/cmdline").read_bytes().rstrip(b"\0").decode().split("\0")
        cwd = Path(f"/proc/{pid}/cwd").resolve()
    except FileNotFoundError:
        record.unlink(missing_ok=True)
        return
    if command != expected or cwd != root.resolve():
        raise SystemExit("The recorded PID does not belong to this workspace launcher; it was left untouched.")
    os.kill(pid, signal.SIGTERM)
    for _ in range(100):
        try:
            state = Path(f"/proc/{pid}/stat").read_text().partition(") ")[2][:1]
            if state == "Z":
                break
        except FileNotFoundError:
            break
        time.sleep(.1)
    else:
        raise SystemExit("The workspace did not stop gracefully; no forced kill was used.")
    record.unlink(missing_ok=True)


def main():
    try:
        if "--url" in sys.argv:
            print(public_origin(os.environ))
            return
        environment, credentials = configuration(os.environ)
    except ValueError as error:
        raise SystemExit(str(error))
    python = ROOT / ".venv-app/bin/python"
    if not python.exists() or not (ROOT / "web/dist/index.html").exists():
        raise SystemExit("Setup is incomplete. Run python scripts/setup_codespaces.py --with-ai.")
    if "--restart" in sys.argv:
        stop_owned_runtime(ROOT)
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
    print(f"FABRIVRA is ready. Open this secure address in your browser: {environment['MOULD_PUBLIC_ORIGIN']}")
    print("Keep port 8000 visibility Private. Desktop localhost forwarding is not the hosted sign-in address.")
    print(f"Sign in as owner. Read your private password in {credentials.relative_to(ROOT)}; do not commit or share that file.")


if __name__ == "__main__":
    main()
