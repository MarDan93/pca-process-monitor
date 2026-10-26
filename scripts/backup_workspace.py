"""Create a verified private online SQLite backup; never replace a live database."""
import argparse
from datetime import datetime,timezone
import hashlib
import json
import os
from pathlib import Path
import sqlite3
from uuid import uuid4
ROOT=Path(__file__).resolve().parents[1]

def backup(source,destination):
    source=source.resolve()
    if not source.is_file():raise FileNotFoundError('Workspace database not found; no empty backup created.')
    destination.mkdir(parents=True,mode=0o700,exist_ok=False)
    target=destination/'projects.sqlite3'
    with sqlite3.connect(source.as_uri()+'?mode=ro',uri=True) as live,sqlite3.connect(target) as copy:
        live.backup(copy)
        if copy.execute('PRAGMA integrity_check').fetchone()[0]!='ok':raise RuntimeError('Backup integrity check failed.')
        tables=[row[0] for row in copy.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")]
        # Table names are read from SQLite and quoted; no caller SQL is evaluated.
        counts={name:copy.execute('SELECT count(*) FROM "'+name.replace('"','""')+'"').fetchone()[0] for name in tables}
    os.chmod(target,0o600)
    manifest={'format':'fabrivra.private-sqlite-backup/1','created_at':datetime.now(timezone.utc).isoformat(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'tables':counts,'privacy':'Full private database, including security tables when present. Keep outside Git and public uploads. Credentials file is separate and unchanged.'}
    path=destination/'manifest.json';path.write_text(json.dumps(manifest,indent=2)+'\n');os.chmod(path,0o600)
    return target,manifest

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--database',type=Path,default=ROOT/'.cache/workspace/projects.sqlite3');args=parser.parse_args()
    target,manifest=backup(args.database,ROOT/'.cache/backups'/(datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-'+uuid4().hex[:8]))
    print('Verified private SQLite backup:',target.relative_to(ROOT));print('SHA-256:',manifest['sha256']);print('Integrity: ok. Original database, credentials, projects and branches are unchanged.')
if __name__=='__main__':main()
