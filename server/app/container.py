"""Initialise the mounted volume, then drop privileges before serving requests."""
import os
import sys
from pathlib import Path
from .settings import Settings

settings = Settings.from_environment()
directory = Path(settings.database).parent
if not settings.hosted or directory.resolve() != Path('/var/data'):
    raise SystemExit('Container mode requires a hosted database under /var/data.')
directory.mkdir(parents=True, exist_ok=True)
if os.geteuid() == 0:
    os.chown(directory, 10001, 10001)
    os.setgroups([])
    os.setgid(10001)
    os.setuid(10001)
if not os.access(directory, os.W_OK):
    raise SystemExit('The persistent volume must be writable by application UID 10001.')
command = sys.argv[1:] or [sys.executable, '-m', 'app']
os.execvp(command[0], command)
