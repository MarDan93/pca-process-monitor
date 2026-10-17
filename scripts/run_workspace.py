#!/usr/bin/env python3
"""One launcher for a source checkout or the prebuilt local review package."""
import argparse
import os
import shutil
import subprocess
import sys
import threading
import time
import urllib.request
import venv
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description="Run the local Mould Studio workspace. Never binds to the public network.")
    parser.add_argument("--setup", action="store_true", help="Install locked dependencies and build the source checkout first.")
    parser.add_argument("--open", action="store_true", help="Open the workspace in your computer's browser after readiness.")
    parser.add_argument("--port", type=int, default=8123)
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("Use a port from 1 to 65535.")
    python = ROOT / ".venv-app" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    if args.setup:
        if sys.version_info < (3, 12):
            parser.error("Python 3.12 or newer is required.")
        if not python.exists():
            venv.create(ROOT / ".venv-app", with_pip=True)
        subprocess.run([str(python), "-m", "pip", "install", "--require-hashes", "--cache-dir", str(ROOT / ".cache/pip"), "-r", str(ROOT / "server/requirements.lock")], check=True)
        if (ROOT / "web/package-lock.json").exists():
            npm = shutil.which("npm.cmd" if os.name == "nt" else "npm")
            if not npm:
                parser.error("Node.js 22.12+ and npm are needed to build this source checkout. The prebuilt review package needs only Python.")
            for folder in ("prototype", "web"):
                subprocess.run([npm, "ci", "--ignore-scripts", "--cache", str(ROOT / ".cache/npm")], cwd=ROOT / folder, check=True)
            subprocess.run([npm, "run", "build"], cwd=ROOT / "web", check=True)
    if not python.exists() or not (ROOT / "web/dist/index.html").exists():
        parser.error("Run python scripts/run_workspace.py --setup first.")
    if args.open:
        def open_when_ready():
            for _ in range(100):
                try:
                    with urllib.request.urlopen(f"http://127.0.0.1:{args.port}/api/health", timeout=1) as response:
                        if response.status == 200:
                            webbrowser.open(f"http://127.0.0.1:{args.port}/")
                            return
                except OSError:
                    time.sleep(.2)
        threading.Thread(target=open_when_ready, daemon=True).start()
    print("Starting Mould Studio in local development mode. Press Ctrl+C to stop.", flush=True)
    return subprocess.call([str(python), "-m", "uvicorn", "app.main:app", "--app-dir", "server", "--host", "127.0.0.1", "--port", str(args.port)], cwd=ROOT)


if __name__ == "__main__":
    raise SystemExit(main())
