"""Reproduce declared L0 fixtures without touching any user's database."""
import copy,json
from pathlib import Path
import sys,tempfile
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'server'))
from app.store import Store
from app.resources import Resources
from app.system.service import SystemService
from app.system.engine import run,economics
from app.system.domain import MODEL

def main():
    with tempfile.TemporaryDirectory(prefix='fabrivra-system-oracle-') as temp:
        store=Store(Path(temp)/'temporary.sqlite3');Resources(store);service=SystemService(store);p=service.create_benchmark();scenarios=p['production_system']['scenarios'];rows=[]
        def measure(label,s,modify=None):
            cfg=copy.deepcopy(s['configuration'])
            if modify:modify(cfg)
            result=run(cfg,s['bindings']);cost=economics(result,s['bindings'])
            rows.append({'case':label,'cavities':cfg['recipe']['cavities'],'origin':cfg['origin'],'output_parts':result['summary']['output_parts'],'duration_s':result['duration_s'],'parts_per_hour':result['summary']['system_output_per_hour'],'unit_cost':cost['unit_cost'],'currency':cost['currency'],'buffer_blocking_s':result['summary']['waits_s']['conveyor_capacity_wait'],'container_change_s':result['summary']['waits_s']['container_change'],'busiest_resource_heuristic':result['summary']['bottleneck_by_busy_time'],'status':result['status'],'physical_schedule_sha256':result['dependency_hashes']['schedule']})
        for s in scenarios:measure('finite_buffer_12_part_box',s)
        measure('48_part_box',scenarios[1],lambda c:c['packaging'].update(parts_per_container=48))
        def fast(c):c['conveyor']['capacity_parts']=1000;c['packaging'].update(container_change_s=0.,handling_s_per_part=.01)
        for s in scenarios:measure('fast_downstream_counterexample',s,fast)
        report={'model':MODEL.model_dump(),'source':'Original synthetic fixtures in examples/system-benchmark; no OEM/grade validation.','same_finite_campaign_parts':160,'results':rows}
        target=ROOT/'.cache/verification/fabrivra-system-benchmark.json';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(report,indent=2)+'\n')
        for r in rows:print(f"{r['case']}: {r['cavities']} cavities, {r['output_parts']} parts, {r['duration_s']:.6f} s, {r['parts_per_hour']:.6f} parts/h, {r['unit_cost']} {r['currency']}/part")
        print('Evidence:',target.relative_to(ROOT))
if __name__=='__main__':main()
