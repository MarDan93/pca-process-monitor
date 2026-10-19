"""Independent unit conversions, approval/persistence and invalidation checks."""
import base64
import json
from pathlib import Path
import tempfile
import unittest
from fastapi.testclient import TestClient
from app.main import create_app
from app.assistant import AssistantRequest, validated_result
from app.engineering import mesh_bounds
from app.resources import Resources
from app.store import Store


class EngineeringTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.database = Path(self.temp.name) / 'engineering.sqlite3'
        self.client = TestClient(create_app(self.database, testing=True))
        self.headers = {'X-Workspace-Token': self.client.get('/api/session').json()['write_token']}
        self.project = self.post('/api/projects', {'name': 'Generic component'}).json()
        self.path = '/api/projects/' + self.project['id']

    def tearDown(self):
        self.temp.cleanup()

    def post(self, path, data):
        return self.client.post(path, json=data, headers=self.headers)

    def apply(self, op):
        token = self.post(self.path+'/operations/'+op['id']+'/approve', {'digest': op['digest']}).json()
        response = self.post(self.path+'/operations/'+op['id']+'/execute', token | {'idempotency_key': 'engineering-'+op['id']})
        self.assertEqual(response.status_code, 200, response.text)
        self.project = response.json()
        return self.project

    def mesh(self, units='mm'):
        content = b'v 0 0 0\nv 100 0 0\nv 100 40 0\nv 0 40 0\nv 0 0 20\nv 100 0 20\nv 100 40 20\nv 0 40 20\nf 1 2 3\nf 1 3 4\nf 5 7 6\nf 5 8 7\n'
        response = self.post(self.path+'/assets', {'base_revision': self.project['revision'], 'name':'part.obj','units':units,'content_base64':base64.b64encode(content).decode()})
        self.project = response.json()
        return content

    def resource(self, kind, **data):
        result = self.post('/api/library', {'kind':kind,'data':{'name':'Test '+kind,'source_kind':'synthetic'} | data})
        self.assertEqual(result.status_code, 200, result.text)
        return result.json()

    def layout(self, **spec):
        result = self.post(self.path+'/engineering/preview', {'base_revision':self.project['revision'], 'changes':{'cavities':2} | spec,'source':{'kind':'manual'}})
        self.assertEqual(result.status_code, 200, result.text)
        return self.apply(result.json())

    def recipe(self, **patch):
        scenario = self.client.get('/api/process/example').json() | patch
        op = self.post(self.path+'/process/preview', {'base_revision':self.project['revision'],'changes':scenario,'source':{'kind':'manual'}}).json()
        return self.apply(op)

    def test_layout_force_volume_units_and_snapshot(self):
        self.mesh()
        machine = self.resource('machine', clamp_force_kn=500., tiebar_x_mm=500., tiebar_y_mm=500., mould_min_mm=100., mould_max_mm=500., opening_stroke_mm=300., max_daylight_mm=800., max_shot_cm3=100., hourly_cost='70.123456',currency='EUR')
        material = self.resource('material', melt_density_kg_m3=800.)
        self.recipe()
        self.layout(machine_id=machine['id'],material_id=material['id'],projected_area_mm2=4000.,cavity_pressure_mpa=40.)
        layout = self.project['engineering']
        self.assertEqual(layout['mould'], {'depth_mm':180.,'width_mm':240.,'height_mm':220.})
        checks = {c['code']:c for c in layout['checks']}
        # 4000 mm² * 40 N/mm² * 2 * 1.2 = 384000 N = 384 kN.
        self.assertEqual(checks['clamp_force_kn']['required'],384.)
        # 44 g / 0.8 g/cm³ = 55 cm³, not PS-rated shot mass.
        self.assertEqual(checks['shot_volume_cm3']['required'],55.)
        self.assertTrue(all(c['status']=='passed' for c in layout['checks']))
        run = self.post(self.path+'/process/runs',{'base_revision':self.project['revision']}).json()
        self.assertEqual(run['engineering'],layout)
        self.assertEqual(run['summary']['output_parts'],10)
        reopened = TestClient(create_app(self.database,testing=True)).get(self.path).json()
        self.assertEqual(reopened['engineering'],layout)
        self.assertEqual(layout['machine']['data']['hourly_cost'],'70.123456')
        # Same bytes with different declared units must invalidate layout (hash alone is insufficient).
        self.mesh('cm')
        rejected=self.post(self.path+'/process/runs',{'base_revision':self.project['revision']})
        self.assertEqual(rejected.status_code,409)
        self.assertEqual(self.client.get(self.path+'/process/latest').json(),run)

    def test_failed_incomplete_foreign_and_cavities(self):
        self.mesh(); self.recipe(); self.layout()
        self.assertTrue(any(c['status']=='incomplete' for c in self.project['engineering']['checks']))
        self.assertEqual(self.post(self.path+'/process/runs',{'base_revision':self.project['revision']}).status_code,200)
        small=self.resource('machine',tiebar_x_mm=50.)
        self.layout(machine_id=small['id'])
        self.assertEqual(self.post(self.path+'/process/runs',{'base_revision':self.project['revision']}).status_code,422)
        self.layout(cavities=1)
        self.assertEqual(self.post(self.path+'/process/runs',{'base_revision':self.project['revision']}).status_code,422)
        comparisons=self.client.get(self.path+'/engineering/presses').json()['alternatives']
        self.assertEqual(len(comparisons),1)
        self.assertEqual(comparisons[0]['status'],'failed')
        self.assertEqual(Resources(Store(self.database,'someone-else')).list('machine'),[])
        foreign=TestClient(create_app(self.database,principal='someone-else',testing=True))
        self.assertEqual(foreign.get(self.path).status_code,404)
        op=self.post(self.path+'/engineering/preview',{'base_revision':self.project['revision'],'changes':{'machine_id':'foreign-id'},'source':{'kind':'manual'}})
        self.assertEqual(op.status_code,404)

    def test_csv_atomic_decimal_and_validation(self):
        csv='name,source_kind,clamp_force_kn,hourly_cost,currency\nBig,user_declared,10787.315,0.123456,EUR\nSmall,user_declared,2745.862,55.20,EUR\n'
        for commit in [False,True]:
            result=self.post('/api/library/import',{'kind':'machine','csv_text':csv,'commit':commit})
            self.assertEqual(result.status_code,200,result.text)
            self.assertTrue(result.json()['valid'])
            self.assertEqual(len(result.json()['saved']),2 if commit else 0)
        self.assertEqual(self.client.get('/api/library/machine').json()[1]['data']['hourly_cost'],'0.123456')
        for invalid in ['name,source_kind\n"unclosed,user_declared',csv+'Bad,user_declared,-1,10,EUR\n',csv.replace('clamp_force_kn','force_tonnes'),csv.replace('Big,user_declared','Big,synthetic').replace('2745.862','NaN')]:
            r=self.post('/api/library/import',{'kind':'machine','csv_text':invalid,'commit':True})
            self.assertTrue(r.status_code==422 or r.json()['valid'] is False)
            self.assertEqual(len(self.client.get('/api/library/machine').json()),2)
        self.assertEqual(self.client.get('/api/library/sources').json()['verified_manufacturer_models'],0)
        invalid=self.post('/api/library',{'kind':'machine','data':{'name':'x','source_kind':'user_declared','hourly_cost':'10'}})
        self.assertEqual(invalid.status_code,422)

    def test_mesh_and_advisor_do_not_invent_facts(self):
        self.assertEqual(mesh_bounds(b'v 0 0 0\nv 1 2 3\n','x.obj','in'),[25.4,50.8,76.19999999999999])
        for bad in [b'v NaN 0 0\nv 1 2 3\n',b'v 0 0 0\nv 1 2 0\n']:
            with self.assertRaises(ValueError):mesh_bounds(bad,'x.obj','mm')
        request=AssistantRequest(base_revision=0,language='it',message='voglio produrre un auto da 1000000 di pezzi in plastica materiale pp; confronto una 1100 o una 280')
        result=validated_result('The reference is Pluto. Budget EUR 999850.',request,self.project)
        self.assertNotIn('Pluto',result['reply']);self.assertNotIn('999850',result['reply'])
        self.assertIn('annua',result['reply']);self.assertIsNone(result['commercial'])
        routed=validated_result('```json\n["machines","costs"]\n```',request,self.project)
        self.assertEqual(routed['response_mode'],'ai_routed_workflow')
        self.assertIn('Presse:',routed['reply'])
        self.assertIn('Materiale:',routed['reply'])
        for changes in [{'reference':'Pluto'},{'mould_budget_eur':999850},{'mould_budget_eur':'garbage'},{'annual_volume':1000000}]:
            out=validated_result(json.dumps({'reply':'invented','changes':{'brief':changes}}),request.model_copy(update={'mode':'commercial'}),self.project)
            self.assertIsNone(out['commercial']);self.assertIn('validation_error',out)
        valid=validated_result('{"reply":"x","changes":{"brief":{"annual_volume":1000000}}}',request.model_copy(update={'mode':'commercial','message':'Annual volume 1000000 parts'}),self.project)
        self.assertEqual(valid['commercial']['annual_volume'],1000000)
