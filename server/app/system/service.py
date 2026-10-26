"""Versioned system scenarios through the existing preview/approve/undo ledger."""
import copy
import hashlib
import json
from uuid import uuid4
from typing import Literal
from pydantic import Field,model_validator
from ..schemas import StrictModel,Provenance,AssetRequest
from ..store import DomainError,digest,encoded
from ..engineering import LayoutSpec,build_layout,press_checks
from ..resources import Resources,Machine,Material
from .schemas import ProductionSystemScenario
from .domain import dependency_hashes
from .engine import run,economics,constraint

class FrozenScenario(StrictModel):
    id:str
    revision:int=Field(ge=0)
    configuration:ProductionSystemScenario
    bindings:dict

class ProductionSystem(StrictModel):
    id:str
    schema_version:Literal['fabrivra.production-system/1']='fabrivra.production-system/1'
    scenarios:list[FrozenScenario]=Field(max_length=20)

    @model_validator(mode='after')
    def unique_scenarios(self):
        if len({s.id for s in self.scenarios})!=len(self.scenarios):raise ValueError('Scenario IDs must be unique.')
        return self

class SystemChange(StrictModel):
    base_revision:int
    changes:ProductionSystem
    source:Provenance

class SystemService:
    def __init__(self,store):
        self.store=store
        with store.connection(True) as db:db.execute('CREATE TABLE IF NOT EXISTS system_runs(id TEXT PRIMARY KEY,project_id TEXT NOT NULL,scenario_id TEXT NOT NULL,created REAL NOT NULL,result TEXT NOT NULL)')

    def bind(self,db,project,cfg):
        library=Resources.__new__(Resources);library.store=self.store
        machine=library.get(db,cfg.machine_id,'machine') if cfg.machine_id else None;material=library.get(db,cfg.material_id,'material') if cfg.material_id else None
        layout=None;checks=[]
        if project['asset']:
            spec=LayoutSpec(**cfg.mould.model_dump(),cavities=cfg.recipe.cavities,machine_id=cfg.machine_id,material_id=cfg.material_id)
            layout=build_layout(self.store,db,project,spec);checks=press_checks(layout,cfg.recipe.model_dump());layout['checks']=checks
        else:checks=[constraint('product_geometry','incomplete',formula='Import a product mesh before geometric press/layout checks.')]
        if machine is None:checks.append(constraint('press_specification','incomplete',formula='Select a declared press specification.'))
        return {'asset':project['asset'],'machine':machine,'material':material,'engineering':layout,'press_checks':checks}

    def preview(self,project_id,request):
        with self.store.connection() as db:
            p=self.store._project(db,project_id);self.store._current(p,request.base_revision)
            state=copy.deepcopy(p.get('production_system') or {'id':str(uuid4()),'schema_version':'fabrivra.production-system/1','scenarios':[]})
            old=next((s for s in state['scenarios'] if s['id']==request.scenario_id),None)
            if request.scenario_id and old is None:raise DomainError(404,'Scenario not found in this project.')
            cfg=request.changes;bindings=self.bind(db,p,cfg);body=cfg.model_dump(mode='json')
            if old and old['configuration']==body and old['bindings']==bindings:raise DomainError(422,'No scenario changes to preview.')
            if old:old.update(revision=old['revision']+1,configuration=body,bindings=bindings)
            else:state['scenarios'].append({'id':str(uuid4()),'revision':0,'configuration':body,'bindings':bindings})
        return self.store.preview_process(project_id,SystemChange(base_revision=request.base_revision,changes=state,source=request.source),field='production_system')

    def state(self,project_id):
        p=self.store.get(project_id);system=p.get('production_system');rows=[]
        if system:
            for s in system['scenarios']:
                latest=self.latest(project_id,s['id']);current=dependency_hashes(s['configuration'],s['bindings'])
                stale=[k for k,v in current.items() if latest and latest['dependency_hashes'].get(k)!=v]
                current_asset=p['asset'];bound=s['bindings']['asset'];geometry_stale=(current_asset or {}).get('sha256')!=(bound or {}).get('sha256') or (current_asset or {}).get('source_units')!=(bound or {}).get('source_units')
                if geometry_stale:stale=sorted(set(stale+['geometry','mould_layout','press_checks','eoat_checks','schedule','animation','economics']))
                rows.append({'scenario_id':s['id'],'revision':s['revision'],'latest_run_id':latest['id'] if latest else None,'stale_artifacts':stale,'geometry_binding_stale':geometry_stale})
        return {'production_system':system,'statuses':rows,'project_revision':p['revision']}

    def list_runs(self,project_id):
        with self.store.connection() as db:
            self.store._project(db,project_id)
            return [{'id':r['id'],'scenario_id':r['scenario_id'],'created_at':r['created']} for r in db.execute('SELECT id,scenario_id,created FROM system_runs WHERE project_id=? ORDER BY created DESC',(project_id,))]

    def get_run(self,project_id,run_id):
        with self.store.connection() as db:
            self.store._project(db,project_id);row=db.execute('SELECT result FROM system_runs WHERE project_id=? AND id=?',(project_id,run_id)).fetchone()
            if row is None:raise DomainError(404,'System run not found.')
            return json.loads(row['result'])

    def latest(self,project_id,scenario_id):
        with self.store.connection() as db:
            self.store._project(db,project_id);row=db.execute('SELECT result FROM system_runs WHERE project_id=? AND scenario_id=? ORDER BY created DESC,rowid DESC LIMIT 1',(project_id,scenario_id)).fetchone()
            return json.loads(row['result']) if row else None

    def compare(self,project_id,request):
        p=self.store.get(project_id);self.store._current(p,request.base_revision);state=p.get('production_system')
        if not state:raise DomainError(422,'Create a production-system scenario first.')
        scenarios=[]
        for sid in request.scenario_ids:
            s=next((s for s in state['scenarios'] if s['id']==sid),None)
            if s is None:raise DomainError(404,'Scenario not found in this project.')
            asset=p['asset'];bound=s['bindings']['asset']
            if (asset or {}).get('sha256')!=(bound or {}).get('sha256') or (asset or {}).get('source_units')!=(bound or {}).get('source_units'):raise DomainError(409,'Product geometry changed; update the scenario to capture the current geometry before rerunning.')
            scenarios.append(s)
        results=[]
        for s in scenarios:
            cfg=s['configuration'];bindings=s['bindings'];result=run(cfg,bindings,s['revision']);result.update(id=str(uuid4()),project_id=project_id,project_revision=p['revision'],system_id=state['id'],scenario_id=s['id'],scenario_revision=s['revision'],scenario_name=cfg['name'],asset=bindings['asset'],engineering=bindings['engineering'],bindings=bindings,created_at=self.store.clock())
            result['economics']=economics(result,bindings);result['input_sha256']=digest({'configuration':cfg,'bindings':bindings,'manifest':result['model_manifest']});results.append(result)
        with self.store.connection(True) as db:
            self.store._current(self.store._project(db,project_id),request.base_revision)
            count=db.execute('SELECT count(*) FROM system_runs WHERE project_id=?',(project_id,)).fetchone()[0]
            if count+len(results)>120:raise DomainError(409,'System trial limit reached (120 immutable runs/project). Export the project before starting a new campaign.')
            for r in results:db.execute('INSERT INTO system_runs VALUES(?,?,?,?,?)',(r['id'],project_id,r['scenario_id'],r['created_at'],encoded(r)))
        eligible=[r for r in results if r['status']=='completed'];frontier=[]
        for a in eligible:
            cost=a['economics']['unit_cost'];rate=a['summary']['system_output_per_hour']
            dominated=any(b['economics']['currency']==a['economics']['currency'] and cost is not None and b['economics']['unit_cost'] is not None and b['summary']['system_output_per_hour']>=rate and float(b['economics']['unit_cost'])<=float(cost) and (b['summary']['system_output_per_hour']>rate or float(b['economics']['unit_cost'])<float(cost)) for b in eligible if b['id']!=a['id'])
            if not dominated:frontier.append(a['id'])
        return {'schema_version':'fabrivra.system-comparison/1','runs':results,'pareto_run_ids':frontier,'validity':'Exploratory configured campaign comparison; unknown geometry/quality/collision checks are not certified. No automatic selection by cavitation.'}

    def create_benchmark(self):
        from .examples import fixture_configs,consumer_tray_obj,machine_fixture,material_fixture
        with self.store.connection(True) as db:
            if db.execute('SELECT count(*) FROM projects WHERE owner=?',(self.store.principal,)).fetchone()[0]>=200:raise DomainError(409,'Project limit reached.')
            if db.execute('SELECT count(*) FROM resources WHERE owner=?',(self.store.principal,)).fetchone()[0]+2>2000:raise DomainError(409,'Resource limit reached.')
            p_id=str(uuid4());a_id=str(uuid4());now=self.store.clock();machine_id=str(uuid4());material_id=str(uuid4());content=consumer_tray_obj()
            for rid,kind,data in [(machine_id,'machine',Machine.model_validate(machine_fixture()).model_dump(mode='json')),(material_id,'material',Material.model_validate(material_fixture()).model_dump(mode='json'))]:db.execute('INSERT INTO resources VALUES(?,?,?,?,?)',(rid,self.store.principal,kind,encoded(data),now))
            asset={'id':a_id,'name':'fabrivra-consumer-tray.obj','source_units':'mm','sha256':hashlib.sha256(content).hexdigest(),'size_bytes':len(content),'kind':'mesh','source':'synthetic_reference','frame':'Original source coordinates retained; declared extraction frame.'}
            from ..schemas import CommercialPatch
            state={'name':'FABRIVRA · integrated system benchmark','commercial':CommercialPatch(commercial_unit='part',annual_volume=500000,program_years=5.,currency='EUR',notes='Explicitly synthetic benchmark; no OEM or material-grade validation.').model_dump(mode='json'),'asset':asset,'process':None,'engineering':None,'production_system':None}
            db.execute('INSERT INTO projects VALUES(?,?,?,?,?,?)',(p_id,self.store.principal,0,encoded(state),now,now));db.execute('INSERT INTO assets VALUES(?,?,?,?)',(a_id,p_id,encoded(asset),content))
            system={'id':str(uuid4()),'schema_version':'fabrivra.production-system/1','scenarios':[]}
            for cfg in fixture_configs():
                cfg.update(machine_id=machine_id,material_id=material_id);config=ProductionSystemScenario.model_validate(cfg);bindings=self.bind(db,{'id':p_id,**state},config)
                system['scenarios'].append({'id':str(uuid4()),'revision':0,'configuration':config.model_dump(mode='json'),'bindings':bindings})
            state['production_system']=system;db.execute('UPDATE projects SET state=? WHERE id=?',(encoded(state),p_id));db.execute('INSERT INTO revisions VALUES(?,?,?,?,?)',(p_id,0,encoded(state),encoded({'kind':'synthetic_benchmark_import','manifest':'fabrivra.system-l0/1'}),now))
            return self.store._project(db,p_id)
