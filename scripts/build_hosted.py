#!/usr/bin/env python3
"""Build the hosted image, preserving the cloud proxy's TLS verification."""
import os
import socket
import subprocess
from pathlib import Path
from urllib.parse import urlsplit

root = Path(__file__).resolve().parents[1]
os.environ['BUILDX_CONFIG'] = str(root / '.cache/buildx')
command = ['docker', 'build', '--progress=plain', '--tag', 'mould-studio:hosted']
proxy_hosts = set()
for name in ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY']:
    if name in os.environ:
        command += ['--build-arg', name]
    if name in ('HTTP_PROXY', 'HTTPS_PROXY') and os.environ.get(name):
        proxy_hosts.add(urlsplit(os.environ[name]).hostname)
if proxy_hosts:
    command += ['--network=host']
    # Some cloud Docker namespaces cannot resolve the configured proxy name.
    # Map only that existing proxy through the environment's own resolver;
    # requests still use the same egress proxy and its policy.
    for host in sorted(proxy_hosts):
        address = socket.getaddrinfo(host, None, socket.AF_INET)[0][4][0]
        command += ['--add-host', host + ':' + address]
if os.environ.get('CODEX_PROXY_CERT'):
    command += ['--secret', 'id=build_ca,src=' + os.environ['CODEX_PROXY_CERT']]
command += ['.']
raise SystemExit(subprocess.call(command, cwd=root))
