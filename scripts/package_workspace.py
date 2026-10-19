#!/usr/bin/env python3
"""Create a local review artifact, never a remote publication."""
import hashlib
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / ".cache/artifacts"


def main():
    if not (ROOT / 'web/dist/index.html').is_file():
        raise SystemExit('Build the workspace first: cd web && npm run build')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    target = OUTPUT / 'Mould-Studio-Workspace-0.2.0-local.zip'
    paths = [ROOT / file for file in ('LICENSE', 'NOTICE', 'SECURITY.md', 'server/requirements.lock', 'server/requirements.in', 'server/README.md', 'web/README.md', 'scripts/run_workspace.py', 'prototype/OPEN_SOURCE.md', 'docs/product/ROADMAP.md', 'docs/product/IMPLEMENTATION_STATUS.md', 'docs/compliance/WORKSPACE_DEPENDENCIES.md', 'docs/compliance/WORKSPACE_PYTHON_DEPENDENCIES.json', 'docs/compliance/WORKSPACE_WEB_DEPENDENCIES.json', 'docs/verification/WORKSPACE_2026-10-17.md', 'docs/verification/WORKSPACE_AI_2026-10-17.json', 'docs/design/WORKSPACE_0_2_0.png')]
    paths += sorted((ROOT / 'server/app').glob('*.py'))
    paths += sorted((ROOT / 'server/app').glob('*.json'))
    paths += sorted((ROOT / 'server/tests').glob('*.py'))
    paths += sorted(path for path in (ROOT / 'web/dist').rglob('*') if path.is_file())
    intro = """# Mould Studio — local review build 0.2.0

Requires Python 3.12+ and Internet access for the locked Python dependencies.
Node.js is NOT needed for this prebuilt package. Extract the entire ZIP first.
From the extracted folder run:

    python scripts/run_workspace.py --setup --open

The launcher installs a local Python environment and opens your computer's
browser after the API becomes ready. Keep the terminal running; Ctrl+C stops it.
Subsequent starts: python scripts/run_workspace.py --open
If the port is busy: add --port 8124.

Create any project, enter the commercial brief, preview/approve, and import an
OBJ/STL with its units or choose the optional synthetic Reference flange.
The real browser AI model is loaded explicitly (about 800 MB), separately from
this ZIP. No API key is needed. A normal HTTPS browser connection to upstream
model/runtime hosts is required unless exact same-origin assets are prepared.
Model/engineering accuracy is not validated; review every proposal.

This is a local development application, not a public hosted service. Project
data lives in .cache/workspace/projects.sqlite3. The other module engines are
planned, not implemented. Read web/README.md for details and the roadmap.
English is the default; Italiano, Français and Español are selectable.
The source licence is MIT; browser dependency notices are included.
"""
    with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=9) as archive:
        archive.writestr('Mould-Studio-Workspace/START_HERE.md', intro)
        for path in paths:
            archive.write(path, 'Mould-Studio-Workspace/' + str(path.relative_to(ROOT)))
        manifest = {str(path.relative_to(ROOT)): hashlib.sha256(path.read_bytes()).hexdigest() for path in paths}
        archive.writestr('Mould-Studio-Workspace/manifest.sha256.json', json.dumps(manifest, indent=2) + '\n')
    sha = hashlib.sha256(target.read_bytes()).hexdigest()
    (target.with_suffix('.zip.sha256')).write_text(sha + '  ' + target.name + '\n')
    print(f'Local review package: {target} ({target.stat().st_size:,} bytes)\nSHA-256: {sha}')


if __name__ == '__main__':
    main()
