"""Reproducible Codespaces setup; no service, paid plan or Codespace is created."""
import argparse
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--with-ai", action="store_true", help="Download and verify the pinned ~786 MB CPU model.")
    parser.add_argument("--ai-profile", choices=("compact", "advisor"), default="compact", help="Compact: ~786 MB; optional advisor: ~1.79 GB. Inference is still bounded workflow/extraction.")
    args = parser.parse_args()
    subprocess.run([sys.executable, "scripts/run_workspace.py", "--setup", "--prepare-only"], cwd=ROOT, check=True)
    if args.with_ai:
        subprocess.run(["node", "--use-env-proxy", "prototype/server-ai.mjs", "--prepare"], cwd=ROOT, env={**os.environ, "MOULD_AI_PROFILE": args.ai_profile}, check=True)
    print("Workspace prepared. Start with python scripts/start_codespaces.py.")


if __name__ == "__main__":
    main()
