"""Portable owner-project backup. No sessions, credentials or approval tokens."""
import base64
import hashlib
import json
from uuid import uuid4
from pydantic import Field
from .schemas import StrictModel,CommercialPatch,AssetRequest
from .process import ProcessScenario
from .resources import MODELS
from .store import DomainError,encoded,digest
from .system.service import ProductionSystem

def backup_digest(value):
    """Portable JSON semantic checksum; money remains a typed exact string.

    Browser JSON.stringify may encode 200.0 as 200. Normalize numeric values
    through IEEE754 (the app restricts integer input to JS-safe ranges), then
    tag *all* types so numbers, strings, arrays and objects cannot alias.
    This is a checksum, not a signature or authenticity/physics certification.
    """
    import math
    from decimal import Decimal
    def canonical(v):
        if v is None:return ['null']
        if isinstance(v,bool):return ['bool',v]
        if isinstance(v,(int,float)):
            number=float(v)
            if not math.isfinite(number):raise ValueError('Non-finite archived number.')
            return ['number',format(Decimal(str(number)).normalize(),'f') if number else '0']
        if isinstance(v,str):return ['string',v]
        if isinstance(v,list):return ['array',[canonical(i) for i in v]]
        if isinstance(v,dict):return ['object',[[k,canonical(v[k])] for k in sorted(v)]]
        raise ValueError('Unsupported archived type.')
    return digest(canonical(value))

class RestoreRequest(StrictModel):
    backup:dict
    approved_sha256:str | None=None
    name:str | None=Field(default=None,min_length=1,max_length=120)

class ProjectBackup:
    def __init__(self,store):self.store=store
    def export(self,project_id):
        with self.store.connection() as db:
            p=self.store._project(db,project_id)
            state={k:p[k] for k in ('name','commercial','asset','process','engineering','production_system')}
            revisions=[{'revision':r['revision'],'state':json.loads(r['state']),'source':json.loads(r['source']),'created':r['created']} for r in db.execute('SELECT * FROM revisions WHERE project_id=? ORDER BY revision',(project_id,))]
            assets=[{'id':r['id'],'manifest':json.loads(r['manifest']),'content_base64':base64.b64encode(r['content']).decode()} for r in db.execute('SELECT * FROM assets WHERE project_id=?',(project_id,))]
            legacy=[json.loads(r['result']) for r in db.execute('SELECT result FROM process_runs WHERE project_id=? ORDER BY created',(project_id,))]
            system=[json.loads(r['result']) for r in db.execute('SELECT result FROM system_runs WHERE project_id=? ORDER BY created',(project_id,))]
            resource_ids=set()
            def collect(v):
                if isinstance(v,dict):
                    for k,val in v.items():
                        if k in ('machine_id','material_id') and isinstance(val,str):resource_ids.add(val)
                        collect(val)
                elif isinstance(v,list):
                    for item in v:collect(item)
            collect(state);collect(revisions)
            resources=[]
            for rid in sorted(resource_ids):
                r=db.execute('SELECT * FROM resources WHERE id=? AND owner=?',(rid,self.store.principal)).fetchone()
                if r:resources.append({'id':r['id'],'kind':r['kind'],'data':json.loads(r['data'])})
            payload={'format':'fabrivra.project-backup/1','project_id':project_id,'revision':p['revision'],'state':state,'revisions':revisions,'assets':assets,'resources':resources,'process_runs':legacy,'system_runs':system,'created_at':self.store.clock(),'excludes':['credentials','sessions','approval_tokens','pending_operations']}
            if len(encoded(payload).encode())>32*1024*1024:raise DomainError(413,'Portable project backup exceeds the 32 MiB trial limit; use a private SQLite backup for larger workspaces.')
            return {'payload':payload,'sha256':backup_digest(payload)}

    def inspect(self,archive):
        try:return self._inspect(archive)
        except (KeyError,TypeError,ValueError,AttributeError) as e:raise DomainError(422,"Malformed backup: invalid or missing project records.") from e

    def _inspect(self,archive):
        if set(archive)!={'payload','sha256'} or not isinstance(archive.get('payload'),dict) or backup_digest(archive['payload'])!=archive['sha256']:raise DomainError(422,'Backup manifest/checksum mismatch.')
        p=archive['payload']
        if len(encoded(p).encode())>32*1024*1024:raise DomainError(413,'Backup exceeds portable size limit.')
        required={'format','project_id','revision','state','revisions','assets','resources','process_runs','system_runs','created_at','excludes'}
        if set(p)!=required or p['format']!='fabrivra.project-backup/1':raise DomainError(422,'Unsupported backup format.')
        if not isinstance(p['revision'],int) or isinstance(p['revision'],bool) or not 0<=p['revision']<=5000:raise DomainError(422,'Invalid project revision.')
        if any(not isinstance(p[k],list) for k in ('assets','resources','revisions','process_runs','system_runs')):raise DomainError(422,'Invalid backup collections.')
        if len(p['assets'])>20 or len(p['resources'])>200 or len(p['process_runs'])>30 or len(p['system_runs'])>120 or len(p['revisions'])>5001:raise DomainError(413,'Backup exceeds project limits.')
        keys={'name','commercial','asset','process','engineering','production_system'}
        def validate_state(state):
            if not isinstance(state,dict) or set(state)-keys or not {'name','commercial','asset'}<=set(state):raise DomainError(422,'Unsupported project state.')
            if not isinstance(state['name'],str) or not state['name'].strip() or len(state['name'])>120:raise DomainError(422,'Invalid project name.')
            CommercialPatch.model_validate(state['commercial'])
            if state.get('process'):ProcessScenario.model_validate(state['process'])
            if state.get('production_system'):ProductionSystem.model_validate(state['production_system'])
        validate_state(p['state'])
        if [r.get('revision') for r in p['revisions']]!=list(range(p['revision']+1)):raise DomainError(422,'Backup must retain contiguous revision history.')
        for r in p['revisions']:
            validate_state(r['state'])
            if not isinstance(r['source'],dict) or not isinstance(r['created'],(int,float)):raise DomainError(422,'Invalid archived revision metadata.')
        asset_ids=set();raw_size=0
        for a in p['assets']:
            m=a['manifest'];request=AssetRequest(base_revision=0,name=m['name'],units=m['source_units'],content_base64=a['content_base64'],source=m.get('source','user'))
            try:raw=base64.b64decode(request.content_base64,validate=True)
            except ValueError as e:raise DomainError(422,'Invalid archived mesh encoding.') from e
            if not raw or len(raw)>12*1024*1024 or hashlib.sha256(raw).hexdigest()!=m['sha256'] or a['id']!=m['id'] or a['id'] in asset_ids or m['name'].rsplit('.',1)[-1].lower() not in ('obj','stl'):raise DomainError(422,'Archived geometry/hash is invalid.')
            asset_ids.add(a['id']);raw_size+=len(raw)
        if raw_size>96*1024*1024:raise DomainError(413,'Archived geometry exceeds storage limit.')
        if len({r['id'] for r in p['resources']})!=len(p['resources']):raise DomainError(422,'Duplicate resource IDs.')
        for r in p['resources']:
            if r['kind'] not in MODELS:raise DomainError(422,'Unknown archived resource.')
            MODELS[r['kind']].model_validate(r['data'])
        for state in [p['state'],*[r['state'] for r in p['revisions']]]:
            if state.get('asset'):
                original=next((a['manifest'] for a in p['assets'] if a['id']==state['asset']['id']),None)
                if original!=state['asset']:raise DomainError(422,'Archived geometry manifest/bytes are missing or inconsistent.')
        run_ids=set()
        for kind in ('process_runs','system_runs'):
            for r in p[kind]:
                if not isinstance(r,dict) or not isinstance(r.get('id'),str) or r['id'] in run_ids or r.get('project_id')!=p['project_id']:raise DomainError(422,'Invalid archived run identity.')
                run_ids.add(r['id'])
                if not isinstance(r.get('created_at'),(int,float)) or not isinstance(r.get('events'),list) or not isinstance(r.get('cycles'),list) or not isinstance(r.get('summary'),dict):raise DomainError(422,'Invalid archived run records.')
                ProcessScenario.model_validate(r['scenario'])
                if len(r['events'])>20000 or len(r['cycles'])>100:raise DomainError(413,'Archived run exceeds trial bounds.')
                if kind=='system_runs':
                    from .system.schemas import ProductionSystemScenario
                    ProductionSystemScenario.model_validate(r['system_configuration'])
                    if not isinstance(r.get('scenario_id'),str):raise DomainError(422,'Archived system run lacks scenario identity.')
        return {'name':p['state']['name'],'sha256':archive['sha256'],'assets':len(p['assets']),'revisions':len(p['revisions']),'runs':len(p['process_runs'])+len(p['system_runs']),'notice':'Restores a separate project with fresh internal IDs. Historical evidence is retained; credentials and pending approvals are excluded.'}

    def restore(self,archive,approved_sha256,name=None):
        info=self.inspect(archive)
        if approved_sha256!=info['sha256']:raise DomainError(409,'Review and approve the exact backup checksum before restore.')
        p=archive['payload'];project_id=str(uuid4());mapping={p['project_id']:project_id}
        for a in p['assets']:mapping[a['id']]=str(uuid4())
        for r in p['resources']:mapping[r['id']]=str(uuid4())
        def ids(value):
            if isinstance(value,dict):
                for k,v in value.items():
                    if k in ('id','system_id','scenario_id','run_id','operation_id') and isinstance(v,str) and len(v)==36 and v not in mapping:mapping[v]=str(uuid4())
                    ids(v)
            elif isinstance(value,list):
                for v in value:ids(v)
        ids(p['state']);ids(p['revisions']);ids(p['process_runs']);ids(p['system_runs'])
        id_keys={'id','project_id','system_id','scenario_id','run_id','operation_id','asset_id','machine_id','material_id','project','scenario'}
        def rebase(value,key=''):
            if isinstance(value,dict):return {k:rebase(v,k) for k,v in value.items()}
            if isinstance(value,list):return [rebase(v,key) for v in value]
            return mapping.get(value,value) if isinstance(value,str) and key in id_keys else value
        state=rebase(p['state']);state['name']=name or state['name']+' (restored)'
        if len(state['name'])>120:state['name']=state['name'][:120]
        with self.store.connection(True) as db:
            if db.execute('SELECT count(*) FROM projects WHERE owner=?',(self.store.principal,)).fetchone()[0]>=200:raise DomainError(409,'Project limit reached.')
            if db.execute('SELECT count(*) FROM resources WHERE owner=?',(self.store.principal,)).fetchone()[0]+len(p['resources'])>2000:raise DomainError(409,'Resource limit reached.')
            for r in p['resources']:db.execute('INSERT INTO resources VALUES(?,?,?,?,?)',(mapping[r['id']],self.store.principal,r['kind'],encoded(r['data']),self.store.clock()))
            now=self.store.clock();db.execute('INSERT INTO projects VALUES(?,?,?,?,?,?)',(project_id,self.store.principal,p['revision'],encoded(state),now,now))
            for a in p['assets']:db.execute('INSERT INTO assets VALUES(?,?,?,?)',(mapping[a['id']],project_id,encoded(rebase(a['manifest'])),base64.b64decode(a['content_base64'])))
            for r in p['revisions']:
                rs=rebase(r['state']);rs['name']=state['name'] if r['revision']==p['revision'] else rs['name']
                source={**rebase(r['source']),'restored_from_backup':True,'backup_sha256':archive['sha256']}
                db.execute('INSERT INTO revisions VALUES(?,?,?,?,?)',(project_id,r['revision'],encoded(rs),encoded(source),r['created']))
            for kind,table in [('process_runs','process_runs'),('system_runs','system_runs')]:
                for old in p[kind]:
                    r=rebase(old);r['project_id']=project_id;r['restored_from']={'run_id':old['id'],'input_sha256':old.get('input_sha256'),'source_snapshot_sha256':digest(old)};r['input_sha256']=digest({'restored_snapshot':r,'backup_sha256':archive['sha256']})
                    if table=='process_runs':db.execute('INSERT INTO process_runs VALUES(?,?,?,?)',(r['id'],project_id,r['created_at'],encoded(r)))
                    else:db.execute('INSERT INTO system_runs VALUES(?,?,?,?,?)',(r['id'],project_id,r['scenario_id'],r['created_at'],encoded(r)))
            return self.store._project(db,project_id)
