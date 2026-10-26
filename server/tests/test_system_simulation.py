"""Independent invariants and interventions on the complete configured system."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from fastapi.testclient import TestClient
from app.main import create_app
from app.system.engine import run
from app.system.domain import dependency_hashes,graph
from app.system.schemas import ProductionSystemScenario,CAEOutput,ForecastOutput

class SystemSimulationTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.database=Path(self.temp.name)/'system.sqlite'
        self.client=TestClient(create_app(self.database,testing=True));self.headers={'X-Workspace-Token':self.client.get('/api/session').json()['write_token']}
        self.p=self.post('/api/system/benchmark',{}).json();self.path='/api/projects/'+self.p['id'];self.scenarios=self.p['production_system']['scenarios']
    def tearDown(self):self.temp.cleanup()
    def post(self,path,data):return self.client.post(path,json=data,headers=self.headers)
    def compare(self):
        r=self.post(self.path+'/system/compare',{'base_revision':self.p['revision'],'scenario_ids':[s['id'] for s in self.scenarios]});self.assertEqual(r.status_code,200,r.text);return r.json()
    def apply(self,cfg,sid):
        response=self.post(self.path+'/system/preview',{'base_revision':self.p['revision'],'scenario_id':sid,'changes':cfg,'source':{'kind':'manual'}});self.assertEqual(response.status_code,200,response.text);op=response.json()
        token=self.post(self.path+'/operations/'+op['id']+'/approve',{'digest':op['digest']}).json();result=self.post(self.path+'/operations/'+op['id']+'/execute',{**token,'idempotency_key':'system-'+op['id']});self.assertEqual(result.status_code,200,result.text);self.p=result.json();self.scenarios=self.p['production_system']['scenarios'];return op
    def test_full_system_mass_resource_and_buffer_invariants(self):
        comparison=self.compare();self.assertEqual(len(comparison['runs']),2)
        for r in comparison['runs']:
            self.assertEqual(r['status'],'completed');self.assertEqual(r['summary']['output_parts'],160)
            self.assertEqual(len({p['part_id'] for p in r['part_records']}),160)
            self.assertAlmostEqual(r['summary']['final_inventory_g']['output'],2880.)
            for time in sorted({e['end_s'] for e in r['events']}):
                bins={'raw':r['scenario']['initial_material_g']}
                for e in r['events']:
                    if e['end_s']<=time:
                        for k,v in e['mass_delta_g'].items():bins[k]=bins.get(k,0.)+v
                self.assertAlmostEqual(sum(bins.values()),5000.,places=6);self.assertGreaterEqual(min(bins.values()),-1e-7)
                occupied=sum(p['deposit_s']<=time<p['packaging_start_s'] for p in r['part_records'])
                self.assertLessEqual(occupied,4)
            for resource in ('press','robot','screw','feeder','packaging'):
                events=sorted((e for e in r['events'] if e['resource']==resource and e['end_s']>e['start_s']),key=lambda e:e['start_s'])
                for a,b in zip(events,events[1:]):self.assertLessEqual(a['end_s'],b['start_s']+1e-8,resource)
            changes=[e for e in r['events'] if e['phase']=='container_change'];self.assertEqual(len(changes),13);self.assertAlmostEqual(sum(e['end_s']-e['start_s'] for e in changes),325.)
            self.assertTrue(all(s['status']=='UNAVAILABLE' for s in r['signal_manifest'] if s['name'] in ('cavity_pressure','melt_temperature','moisture')))
    def test_downstream_changes_cavitation_advantage_without_hardcoding(self):
        a,b=self.compare()['runs'];self.assertGreater(a['summary']['system_output_per_hour'],b['summary']['system_output_per_hour'])
        self.assertLess(float(a['economics']['unit_cost']),float(b['economics']['unit_cost']))
        fast=[]
        for s in self.scenarios:
            cfg=copy.deepcopy(s['configuration']);cfg['conveyor']['capacity_parts']=1000;cfg['packaging']['container_change_s']=0.;cfg['packaging']['handling_s_per_part']=.01
            fast.append(run(cfg,s['bindings']))
        self.assertGreater(fast[1]['summary']['system_output_per_hour'],fast[0]['summary']['system_output_per_hour'])
        self.assertGreater(fast[1]['summary']['system_output_per_hour'],b['summary']['system_output_per_hour'])
        cfg=copy.deepcopy(self.scenarios[1]['configuration']);cfg['packaging']['parts_per_container']=48
        larger_boxes=run(cfg,self.scenarios[1]['bindings']);self.assertGreater(larger_boxes['summary']['system_output_per_hour'],b['summary']['system_output_per_hour'])
    def test_each_equipment_capacity_changes_outcome(self):
        s=self.scenarios[1];baseline=run(s['configuration'],s['bindings']);cfg=copy.deepcopy(s['configuration']);cfg['robot']['eoat_slots']=2
        regrip=run(cfg,s['bindings']);self.assertNotEqual(regrip['duration_s'],baseline['duration_s']);self.assertEqual(len(regrip['robot_trips']),80)
        for cycle in regrip['cycles'][:-1]:
            following=next(e for e in regrip['events'] if e['phase']=='closing' and e['cycle']==cycle['cycle']+1)
            last=max(t['pick_end_s'] for t in regrip['robot_trips'] if t['cycle']==cycle['cycle']);self.assertGreaterEqual(following['start_s'],last)
        bound=copy.deepcopy(s['bindings']);bound['machine']['data']['max_injection_rate_cm3_s']=1.
        slow=run(s['configuration'],bound);self.assertGreater(slow['scenario']['injection_s'],90);self.assertGreater(slow['duration_s'],baseline['duration_s'])
        cfg=copy.deepcopy(s['configuration']);cfg['conveyor']['capacity_parts']=40
        buffer=run(cfg,s['bindings']);self.assertGreater(buffer['summary']['system_output_per_hour'],baseline['summary']['system_output_per_hour'])
    def test_physical_unknowns_failures_and_mass_starvation(self):
        s=self.scenarios[0];cfg=copy.deepcopy(s['configuration']);cfg['robot']['payload_kg']=.5
        blocked=run(cfg,s['bindings']);self.assertEqual(blocked['status'],'blocked');self.assertEqual(blocked['events'],[])
        cfg=copy.deepcopy(s['configuration']);cfg['packaging']['required_orientation_deg']=180
        self.assertEqual(run(cfg,s['bindings'])['status'],'blocked')
        cfg=copy.deepcopy(s['configuration']);cfg['robot']['payload_kg']=None
        exploratory=run(cfg,s['bindings']);self.assertEqual(exploratory['status'],'completed');self.assertEqual(next(c for c in exploratory['constraints'] if c['code']=='robot_payload')['status'],'incomplete')
        yaw=copy.deepcopy(s['configuration']);yaw['recipe'].update(mould_orientation_deg=90,belt_orientation_deg=90);yaw['packaging']['required_orientation_deg']=90
        self.assertIn('constraint:layout_yaw_unsupported',run(yaw,s['bindings'])['issues'])
        cfg['policy']='require_known_l0_constraints';self.assertEqual(run(cfg,s['bindings'])['status'],'blocked')
        cfg=copy.deepcopy(s['configuration']);cfg['recipe']['initial_material_g']=100.
        partial=run(cfg,s['bindings']);self.assertEqual(partial['status'],'partial');self.assertEqual(partial['summary']['output_parts'],4);self.assertEqual(partial['summary']['remaining_g'],24.)
    def test_dependency_invalidation_undo_and_immutable_old_runs(self):
        old=self.compare()['runs'][0];cfg=copy.deepcopy(self.scenarios[0]['configuration']);cfg['packaging']['container_change_s']=5.
        op=self.apply(cfg,self.scenarios[0]['id']);statuses=self.client.get(self.path+'/system').json()['statuses'];a=statuses[0]
        self.assertIn('schedule',a['stale_artifacts']);self.assertIn('economics',a['stale_artifacts']);self.assertNotIn('press_checks',a['stale_artifacts']);self.assertNotIn('geometry',a['stale_artifacts']);self.assertEqual(statuses[1]['stale_artifacts'],[])
        self.assertEqual(self.client.get(self.path+'/system/runs/'+old['id']).json(),old)
        undone=self.post(self.path+'/operations/'+op['id']+'/undo',{'base_revision':self.p['revision'],'idempotency_key':'undo-system-'+op['id']});self.assertEqual(undone.status_code,200,undone.text)
        restored=undone.json()['production_system']['scenarios'][0];self.assertEqual(restored['revision'],2);self.assertEqual(restored['configuration']['packaging']['container_change_s'],25.)
        with self.assertRaises(Exception):ProductionSystemScenario.model_validate(cfg|{'arbitrary_shell':'run'})
    def test_cost_unknown_is_not_zero_and_recipe_overlap(self):
        s=self.scenarios[0];cfg=copy.deepcopy(s['configuration']);cfg['costs']['material_per_kg']=None
        self.apply(cfg,s['id']);result=self.compare()['runs'][0];self.assertIsNone(result['economics']['unit_cost']);self.assertIn('material_including_runner',result['economics']['missing_costs'])
        heat1=next(e for e in result['events'] if e['phase']=='cooling' and e['cycle']==1);screw2=next(e for e in result['events'] if e['phase']=='plasticising' and e['cycle']==2)
        self.assertLess(screw2['start_s'],heat1['end_s']);self.assertEqual(screw2['start_s'],heat1['start_s'])
    def test_backup_restore_persistence_and_project_isolation(self):
        runs=self.compare()['runs'];archive=self.client.get(self.path+'/backup').json();self.assertEqual(set(archive),{'payload','sha256'})
        self.assertNotIn('sessions',archive['payload']);self.assertNotIn('operations',archive['payload'])
        preview=self.post('/api/backups/preview',{'backup':archive});self.assertEqual(preview.status_code,200,preview.text)
        restored=self.post('/api/backups/restore',{'backup':archive,'approved_sha256':preview.json()['sha256']});self.assertEqual(restored.status_code,200,restored.text);p=restored.json();self.assertNotEqual(p['id'],self.p['id'])
        reloaded=TestClient(create_app(self.database,testing=True));self.assertEqual(reloaded.get('/api/projects/'+p['id']).json(),p)
        records=reloaded.get('/api/projects/'+p['id']+'/system/runs').json();self.assertEqual(len(records),2)
        run1=reloaded.get('/api/projects/'+p['id']+'/system/runs/'+records[0]['id']).json();self.assertEqual(run1['project_id'],p['id']);self.assertIn('restored_from',run1)
        original_bytes=self.client.get(self.path+'/assets/'+self.p['asset']['id']).content;new_bytes=reloaded.get('/api/projects/'+p['id']+'/assets/'+p['asset']['id']).content;self.assertEqual(new_bytes,original_bytes)
        foreign=TestClient(create_app(self.database,principal='other-owner',testing=True));self.assertEqual(foreign.get(self.path+'/backup').status_code,404);self.assertEqual(foreign.get(self.path+'/system/runs/'+runs[0]['id']).status_code,404)
        bad=copy.deepcopy(archive);bad['payload']['state']['name']='tampered';self.assertEqual(self.post('/api/backups/restore',{'backup':bad,'approved_sha256':archive['sha256']}).status_code,422)
    def test_contracts_and_port_graph(self):
        g=graph();ports={p['id']:p for p in g['ports']}
        self.assertEqual(len(g['nodes']),10)
        self.assertTrue(all(link['from'] in ports and link['to'] in ports for link in g['connections']))
        for link in g['connections']:self.assertEqual(ports[link['from']]['unit'],ports[link['to']]['unit']);self.assertEqual(link['unit'],ports[link['to']]['unit'])
        with self.assertRaises(Exception):CAEOutput.model_validate({'schema_version':'fabrivra.cae-output/1','source_case_id':'x','source_geometry_sha256':'abc','solver':'uninstalled','solver_version':'none','converged':False,'validation':'independently_validated','source_ref':'test'})
        with self.assertRaises(Exception):ForecastOutput.model_validate({'schema_version':'fabrivra.forecast-output/1','model_id':'not-downloaded','model_version':'future','training_data_sha256':'abc','time_basis':'UTC','unit':'g','timestamps_s':[1,2],'median':[4,5],'lower':[6,7],'upper':[8,9]})

    def test_hand_calculated_single_shot_and_declared_container_supply(self):
        # Independent one-shot oracle: 38 g / 200 g/s + feed delay 1 s;
        # plast 2 + injection .8 + hold 1 + cooling 2 + open .5 + eject .5;
        # robot .6+1, belt 10, packaging 2*1.2. Return ends before finished parts.
        s=self.scenarios[0];cfg=copy.deepcopy(s['configuration']);cfg['recipe']['cycles']=1
        r=run(cfg,s['bindings']);expected=1+38/200+2+.8+1+2+.5+.5+.6+1+10+2*1.2
        self.assertAlmostEqual(r['duration_s'],expected)
        cfg['packaging'].update(supply='finite',available_containers=1,parts_per_container=1)
        limited=run(cfg,s['bindings']);self.assertEqual(limited['status'],'blocked');self.assertIn('constraint:container_supply',limited['issues'])
    def test_portable_kit_checksums_malformed_backup_and_foreign_scenario(self):
        import io,zipfile,hashlib
        from app.backup import backup_digest
        response=self.client.get('/api/system/example-kit');self.assertEqual(response.status_code,200)
        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            files={Path(name).name:z.read(name) for name in z.namelist()};manifest=json.loads(files['manifest.json'])
            for name,expected in manifest['files'].items():self.assertEqual(hashlib.sha256(files[name]).hexdigest(),expected)
        archive=self.client.get(self.path+'/backup').json();archive['payload']['assets'][0].pop('manifest');archive['sha256']=backup_digest(archive['payload'])
        self.assertEqual(self.post('/api/backups/preview',{'backup':archive}).status_code,422)
        self.assertEqual(self.post(self.path+'/system/compare',{'base_revision':0,'scenario_ids':['foreign-scenario']}).status_code,404)
    def test_cost_only_dependency_change_and_new_scenario_creation(self):
        saved=self.scenarios[0];cfg=copy.deepcopy(saved['configuration']);cfg['costs']['robot_per_hour']='10'
        before=dependency_hashes(saved['configuration'],saved['bindings']);after=dependency_hashes(cfg,saved['bindings'])
        self.assertEqual([k for k in before if before[k]!=after[k]],['economics'])
        cfg=copy.deepcopy(saved['configuration']);cfg['name']='New label'
        renamed=dependency_hashes(cfg,saved['bindings']);self.assertEqual(before,renamed)
        response=self.post(self.path+'/system/preview',{'base_revision':0,'changes':cfg,'source':{'kind':'manual'}})
        self.assertEqual(response.status_code,200,response.text);self.assertEqual(len(self.client.get(self.path).json()['production_system']['scenarios']),2)
        preview=response.json();approved=self.post(self.path+'/operations/'+preview['id']+'/approve',{'digest':preview['digest']}).json()
        result=self.post(self.path+'/operations/'+preview['id']+'/execute',{**approved,'idempotency_key':'new-scenario'})
        self.assertEqual(result.status_code,200,result.text);self.assertEqual(len(result.json()['production_system']['scenarios']),3)

    def test_backup_survives_javascript_numeric_normalization(self):
        from app.backup import backup_digest
        a={'value':200.,'nested':[1.0,1e-8,True,None,'200']}
        b={'value':200,'nested':[1,0.00000001,True,None,'200']}
        self.assertEqual(backup_digest(a),backup_digest(b))
        self.assertNotEqual(backup_digest({'value':200}),backup_digest({'value':'200'}))
        self.assertNotEqual(backup_digest({'value':['number','200']}),backup_digest({'value':200}))
        self.assertNotEqual(backup_digest({'cost':'2.00'}),backup_digest({'cost':'2.0'}))
