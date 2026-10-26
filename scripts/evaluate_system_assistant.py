"""Evaluate the pinned cache-only CPU model on 50 bounded system tasks.

No weights, GPU or API calls are provisioned. Raw model outputs are audit data,
never engineering advice. Run with .venv-app/bin/python from the repository root.
"""
import json
from pathlib import Path
import statistics
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'server'))
from app.assistant import AssistantRequest,SYSTEM_FIELDS,validated_result
from app.system.examples import fixture_configs
from app.store import digest


def evaluate(native,cases):
    project={'revision':0,'production_system':{'scenarios':[{'id':'fixture','configuration':fixture_configs()[0]}]}}
    if len(native['results'])!=len(cases):raise ValueError('Incomplete native evaluation.')
    details=[]
    for case,result in zip(cases,native['results']):
        if case['id']!=result['id']:raise ValueError('Mismatched native evaluation IDs.')
        request=AssistantRequest(base_revision=0,mode='system',scenario_id=case.get('scenario_id','fixture'),language=case['language'],message=case['message'])
        output=validated_result(result['text'],request,project);proposed={}
        if output['system']:
            for key,(group,field) in SYSTEM_FIELDS.items():
                if output['system'][group][field]!=project['production_system']['scenarios'][0]['configuration'][group][field]:proposed[key]=output['system'][group][field]
        expected=case['expected_changes']
        passed=(all(output['system'] is not None and output['system'][SYSTEM_FIELDS[k][0]][SYSTEM_FIELDS[k][1]]==v for k,v in expected.items()) and not set(proposed)-set(expected)) if expected else output['system'] is None
        details.append({'id':case['id'],'passed':passed,'native_output':result['text'],'latency_ms':result['latency_ms'],'accepted_proposal':output['system'] is not None,'expected_changes':expected,'proposed_changes':proposed,'validation_error':output.get('validation_error')})
    supported=[r for r in details if r['expected_changes']];refusals=[r for r in details if not r['expected_changes']]
    return {'model':native['model'],'revision':native['revision'],'fixture_sha256':digest(cases),'cases':len(details),'passed':sum(r['passed'] for r in details),'supported_extraction_cases':len(supported),'supported_passed':sum(r['passed'] for r in supported),'refusal_cases':len(refusals),'refusal_passed':sum(r['passed'] for r in refusals),'median_latency_ms':statistics.median(r['latency_ms'] for r in details),'total_generation_s':sum(r['latency_ms'] for r in details)/1000,'scope':'Actual pinned CPU model plus typed post-validation; bounded L0 settings/refusals only. Not CAD or scientific competence.','results':details}


def main():
    fixture=ROOT/'server/tests/fixtures/system-assistant-cases.json';cases=json.loads(fixture.read_text())['cases'];cache=ROOT/'.cache';cache.mkdir(exist_ok=True)
    native_path=cache/'fabrivra-v2-ai-native.json'
    if '--grade-cached' not in sys.argv:
        with native_path.open('w') as out:subprocess.run(['node','prototype/server-ai.mjs','--evaluate',str(fixture)],cwd=ROOT,stdout=out,check=True)
    report=evaluate(json.loads(native_path.read_text()),cases);target=cache/'fabrivra-v2-ai-evaluation.json';target.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='results'},indent=2));print('Full evidence:',target.relative_to(ROOT))
    # A measured quality result, including model failures, is retained honestly.
    return 0 if report['passed']==report['cases'] else 1

if __name__=='__main__':raise SystemExit(main())
