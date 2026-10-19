"""Offline, native-model regression for the owner's failed comparison and follow-up.

This measures narrow workflow routing/extraction, not general engineering ability.
Use MOULD_AI_PROFILE=advisor only after preparing the pinned optional model.
"""
import asyncio
import json
import os
import resource
from pathlib import Path
import sys
import time
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'server'))
from app.assistant import AssistantRequest, generate, status
from app.process import example
from app.schemas import CommercialPatch

async def main():
    os.environ['MOULD_SERVER_AI'] = '1'
    project={'id':'evaluation','revision':0,'commercial':CommercialPatch().model_dump(mode='json'),'asset':None,'process':example().model_dump()}
    async def connected():return False
    prompt="voglio produrre un auto da 1000000 di pezzi in plastica materiale pp. l'idea è di confrontare se farla su una 1100 o su una 280"
    history=[]; results=[]
    for message,mode in [(prompt,'chat'),('cosa mi consigli di fare?','chat'),('Set cooling_s to 12 seconds and cycles to 3.','process')]:
        start=time.monotonic()
        result=await generate(AssistantRequest(base_revision=0,message=message,mode=mode,language='it',history=history[-6:]),project,connected)
        assert result['commercial'] is None
        assert all(word not in result['reply'] for word in ['Pluto','Ruters','999,850','499,975','699,975'])
        if mode=='chat':
            assert 'annua' in result['reply']
            if not history:
                assert result['response_mode']=='ai_routed_workflow', result
            history.extend([{'role':'user','content':message},{'role':'assistant','content':result['reply']}])
        else:
            assert result['process'] and result['process']['cooling_s']==12 and result['process']['cycles']==3, result
        results.append({'mode':mode,'message':message,'seconds':round(time.monotonic()-start,3),'result':result})
    output={'runtime':status(),'scope':'Narrow routing and explicit extraction only; not validated engineering advice','cases':results,'peak_child_rss_kib':resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss}
    path=Path(__file__).resolve().parents[1]/'.cache/ai'/f"evaluation-{os.environ.get('MOULD_AI_PROFILE','compact')}.json"
    path.write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'evidence':str(path),'cases_passed':len(results),'generation_s':[r['seconds'] for r in results],'profile':os.environ.get('MOULD_AI_PROFILE','compact')}))

if __name__=='__main__':asyncio.run(main())
