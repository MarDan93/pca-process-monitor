"""Reproducible Codespaces setup; no service, paid plan or Codespace is created."""
import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--with-ai", action="store_true", help="Download and verify the pinned ~786 MB CPU model.")
    args = parser.parse_args()
    subprocess.run([sys.executable, "scripts/run_workspace.py", "--setup", "--prepare-only"], cwd=ROOT, check=True)
    if args.with_ai:
        subprocess.run(["node", "--use-env-proxy", "prototype/server-ai.mjs", "--prepare"], cwd=ROOT, check=True)
    print("Workspace prepared. Start with python scripts/start_codespaces.py.")


if __name__ == "__main__":
    main()
