import copy,json,unittest
from pathlib import Path
from app.assistant import AssistantRequest,validated_result,SYSTEM_FIELDS
from app.system.examples import fixture_configs

class SystemAssistantTests(unittest.TestCase):
    def test_fifty_typed_extraction_and_refusal_contracts(self):
        cases=json.loads((Path(__file__).parent/'fixtures/system-assistant-cases.json').read_text())['cases']
        cfg=fixture_configs()[0];project={'revision':0,'production_system':{'scenarios':[{'id':'fixture','configuration':cfg}]}}
        self.assertEqual(len(cases),50)
        for case in cases:
            with self.subTest(case=case['id']):
                before=copy.deepcopy(project);request=AssistantRequest(base_revision=0,mode='system',scenario_id=case.get('scenario_id','fixture'),language=case['language'],message=case['message'])
                result=validated_result(json.dumps({'reply':'Untrusted model text','changes':case['candidate_changes']}),request,project)
                if not case['expected_changes']:self.assertIsNone(result['system'])
                else:
                    self.assertIsNotNone(result['system'])
                    for key,value in case['expected_changes'].items():group,field=SYSTEM_FIELDS[key];self.assertEqual(result['system'][group][field],value)
                self.assertEqual(before,project);self.assertNotIn('Untrusted model text',result['reply'])
    def test_read_only_chat_and_malformed_payload(self):
        from app.schemas import CommercialPatch
        project={'revision':0,'commercial':CommercialPatch().model_dump(),'asset':None,'process':None,'engineering':None,'production_system':None}
        request=AssistantRequest(base_revision=0,mode='system',message='Set container_change_s = 5.')
        for output in ['not json','{}','{"reply":"x","changes":[]}','{"reply":"x","changes":{"run_shell":"rm"}}']:
            self.assertIsNone(validated_result(output,request,project)['system'])
        request=AssistantRequest(base_revision=0,mode='chat',message='Run all manufacturing steps now.')
        result=validated_result('{"actions":["simulation"]}',request,project)
        self.assertIsNone(result['system']);self.assertIsNone(result['process']);self.assertIsNone(result['commercial'])
