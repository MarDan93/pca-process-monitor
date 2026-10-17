#!/usr/bin/env python3
"""Run the actual hosted image with a disposable persistent volume."""
import json
import os
import secrets
import subprocess
import time
from pathlib import Path

suffix = secrets.token_hex(5)
name, volume = 'mould-hosted-test-' + suffix, 'mould-hosted-data-' + suffix
environment = os.environ | {
    'MOULD_RUNTIME': 'hosted', 'MOULD_PUBLIC_ORIGIN': 'https://workspace.example',
    'MOULD_ADMIN_USER': 'owner', 'MOULD_ADMIN_PASSWORD': secrets.token_urlsafe(24),
    'MOULD_AUTH_SECRET': secrets.token_urlsafe(32), 'MOULD_WORKSPACE_DB': '/var/data/projects.sqlite3',
}
keys = ['MOULD_RUNTIME', 'MOULD_PUBLIC_ORIGIN', 'MOULD_ADMIN_USER', 'MOULD_ADMIN_PASSWORD', 'MOULD_AUTH_SECRET', 'MOULD_WORKSPACE_DB']


def docker(*args, check=True):
    return subprocess.run(['docker', *args], env=environment, check=check, text=True, capture_output=True)


def start():
    args = ['run', '--detach', '--name', name, '--memory', '512m', '--cpus', '0.5', '--volume', volume + ':/var/data']
    for key in keys:
        args += ['--env', key]
    args += ['mould-studio:hosted']
    docker(*args)
    for _ in range(100):
        result = docker('exec', name, 'python', '-c', "import urllib.request;urllib.request.urlopen('http://127.0.0.1:8000/api/health',timeout=1)", check=False)
        if result.returncode == 0:
            return
        time.sleep(.2)
    raise RuntimeError('Hosted container did not become healthy: ' + docker('logs', name).stderr[-1500:])


COMMON = '''
import base64,http.cookies,json,os,urllib.request,urllib.error
base='http://127.0.0.1:8000'
def request(path,body=None,cookie='',token=''):
    headers={'Host':'workspace.example','Origin':'https://workspace.example'}
    if body is not None: headers['Content-Type']='application/json'
    if cookie: headers['Cookie']=cookie
    if token: headers['X-Workspace-Token']=token
    req=urllib.request.Request(base+path,data=None if body is None else json.dumps(body).encode(),headers=headers)
    return urllib.request.urlopen(req)
'''


try:
    docker('volume', 'create', volume)
    start()
    first = COMMON + '''
try:
    request('/api/projects')
    raise AssertionError('Anonymous data access allowed')
except urllib.error.HTTPError as error:
    assert error.code==401
login=request('/api/auth/login',{'username':'owner','password':os.environ['MOULD_ADMIN_PASSWORD']})
cookie=login.headers['Set-Cookie'].split(';',1)[0]
assert 'Secure' in login.headers['Set-Cookie'] and 'HttpOnly' in login.headers['Set-Cookie']
token=json.load(request('/api/session',cookie=cookie))['write_token']
project=json.load(request('/api/projects',{'name':'Hosted persistence fixture'},cookie,token))
path='/api/projects/'+project['id']
preview=json.load(request(path+'/operations/preview',{'base_revision':0,'changes':{'annual_volume':80000,'market':'Electronics'},'source':{'kind':'manual'}},cookie,token))
approval=json.load(request(path+'/operations/'+preview['id']+'/approve',{'digest':preview['digest']},cookie,token))
saved=json.load(request(path+'/operations/'+preview['id']+'/execute',approval|{'idempotency_key':'container-fixture-key'},cookie,token))
assert saved['commercial']['annual_volume']==80000
original=b'o bracket\\nv 0 0 0\\nv 2 0 0\\nv 0 1 0\\nf 1 2 3\\n'
saved=json.load(request(path+'/assets',{'base_revision':1,'name':'bracket.obj','units':'in','content_base64':base64.b64encode(original).decode()},cookie,token))
status=open('/proc/1/status').read()
assert next(line for line in status.splitlines() if line.startswith('Uid:')).split()[1]=='10001'
print(json.dumps({'project':saved['id'],'asset':saved['asset']['id'],'cookie':cookie}))
'''
    result = json.loads(docker('exec', name, 'python', '-c', first).stdout)
    print('PASS hosted image: protected API, real sign-in/CSRF, commercial approval, mesh persistence; application UID 10001', flush=True)
    docker('rm', '--force', name)
    start()
    environment['TEST_COOKIE'], environment['TEST_PROJECT'], environment['TEST_ASSET'] = result['cookie'], result['project'], result['asset']
    second = COMMON + '''
cookie=os.environ['TEST_COOKIE'];path='/api/projects/'+os.environ['TEST_PROJECT']
saved=json.load(request(path,cookie=cookie))
assert saved['revision']==2 and saved['commercial']['annual_volume']==80000
assert saved['asset']['source_units']=='in'
assert request(path+'/assets/'+os.environ['TEST_ASSET'],cookie=cookie).read().startswith(b'o bracket')
token=json.load(request('/api/session',cookie=cookie))['write_token']
request('/api/auth/logout',{},cookie,token)
try:
    request(path,cookie=cookie)
    raise AssertionError('Revoked cookie accepted')
except urllib.error.HTTPError as error:
    assert error.code==401
print('PASS replacement container restores authenticated session, projects, revisions and original bytes from the volume; logout revokes access')
'''
    print(docker('exec', '--env', 'TEST_COOKIE', '--env', 'TEST_PROJECT', '--env', 'TEST_ASSET', name, 'python', '-c', second).stdout.strip(), flush=True)
    output = Path('.cache/verification'); output.mkdir(parents=True, exist_ok=True)
    (output / 'hosted-container.json').write_text(json.dumps({'image': docker('image', 'inspect', 'mould-studio:hosted', '--format', '{{.Id}}').stdout.strip(), 'mode': 'hosted', 'memory_budget_mib': 512, 'cpu_budget': 0.5, 'application_uid': 10001, 'authenticated_commercial_flow': True, 'original_asset_persistence': True, 'replacement_container_restores_data_and_session': True, 'logout_revokes_access': True}, indent=2) + '\n')
finally:
    docker('rm', '--force', name, check=False)
    docker('volume', 'rm', volume, check=False)
