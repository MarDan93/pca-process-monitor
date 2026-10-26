"""Deterministic resource reservations for a complete configured production cell.

FIFO downstream service is scheduled causally from monotonically deposited
robot batches. A heap releases finite conveyor slots at packaging pickup.
Blocking propagates to the loaded robot, then to mould clearance/press reuse.
There is no global integration timestep, CFD, learned forecast or fake signal.
"""
import heapq
import math
from decimal import Decimal
from .domain import MODEL,graph,parameter_records,dependency_hashes
from .schemas import ProductionSystemScenario
from ..store import digest


def constraint(code,status,required=None,available=None,unit='',formula='',critical=True):
    return {'code':code,'status':status,'required':required,'available':available,'unit':unit,'formula':formula,'critical_to_l0':critical}


def prepare(configuration,bindings):
    cfg=ProductionSystemScenario.model_validate(configuration).model_dump(mode='json')
    s=dict(cfg['recipe']);r=cfg['robot'];b=cfg['conveyor'];p=cfg['packaging'];checks=list(bindings.get('press_checks',[]))
    checks=[{**c,'critical_to_l0':True,'unit':c.get('unit','mm' if c['code'].endswith('_mm') else 'kN' if c['code'].endswith('_kn') else 'cm³')} for c in checks]
    grip=min(r['eoat_slots'],s['cavities'])
    checks.append(constraint('eoat_multiple_trips','passed' if r['allow_multiple_trips'] or r['eoat_slots']>=s['cavities'] else 'failed',s['cavities'],r['eoat_slots'],'part/grip','Multiple trips must be explicitly permitted when grip capacity is below cavitation.'))
    mass=(grip*s['part_mass_g']/1000+r['eoat_mass_kg']) if r['eoat_mass_kg'] is not None else None
    checks.append(constraint('robot_payload','incomplete' if mass is None or r['payload_kg'] is None else 'passed' if mass<=r['payload_kg'] else 'failed',mass,r['payload_kg'],'kg','EOAT mass + simultaneous part mass <= payload limit'))
    concept=bindings.get('engineering');pitch=concept['cavity_positions_mm'][1][1]-concept['cavity_positions_mm'][0][1] if concept and s['cavities']>1 else None
    if concept and s['mould_orientation_deg']!=0:checks.append(constraint('layout_yaw_unsupported','failed',0,s['mould_orientation_deg'],'degree','The mesh-derived envelope/pitch currently supports zero yaw in the extraction frame only; relayout required.'))
    if grip>1:checks.append(constraint('eoat_pitch','incomplete' if pitch is None or r['eoat_pitch_mm'] is None else 'passed' if abs(pitch-r['eoat_pitch_mm'])<=1e-6 else 'failed',pitch,r['eoat_pitch_mm'],'mm','Declared EOAT pitch must equal the cavity-row pitch for simultaneous pickup.'))
    reach=r['required_reach_mm'];checks.append(constraint('robot_declared_reach','incomplete' if reach is None or r['reach_mm'] is None else 'passed' if reach<=r['reach_mm'] else 'failed',reach,r['reach_mm'],'mm','Declared required reach <= declared travel/reach; not a geometric collision/reach solve.'))
    checks.append(constraint('geometric_collision_check','unknown',formula='No swept-volume/collision solver in this increment.',critical=False))
    checks.append(constraint('conveyor_batch_capacity','passed' if grip<=b['capacity_parts'] else 'failed',grip,b['capacity_parts'],'part','One robot deposit must fit the finite conveyor buffer.'))
    orientation_ok=s['mould_orientation_deg']==s['belt_orientation_deg'] and (not p['enabled'] or p['required_orientation_deg']==s['belt_orientation_deg'])
    checks.append(constraint('xyz_orientation','passed' if orientation_ok else 'failed',s['mould_orientation_deg'],p['required_orientation_deg'] if p['enabled'] else s['belt_orientation_deg'],'degree','XYZ robot has no rotary axis.'))
    dose=s['part_mass_g']*s['cavities']+s['runner_mass_g'];checks.append(constraint('hopper_shot_capacity','passed' if dose<=s['hopper_capacity_g'] else 'failed',dose,s['hopper_capacity_g'],'g','A full dose must fit the configured hopper reservation.'))
    planned=min(s['cycles'],int((s['initial_material_g']+1e-9)//dose))*s['cavities']
    if p['enabled'] and p['supply']=='finite':checks.append(constraint('container_supply','passed' if planned<=p['parts_per_container']*p['available_containers'] else 'failed',planned,p['parts_per_container']*p['available_containers'],'part','Finite container supply must cover the requested finite campaign.'))
    machine=(bindings.get('machine') or {}).get('data',{});material=(bindings.get('material') or {}).get('data',{});density=material.get('melt_density_kg_m3');rate=machine.get('max_injection_rate_cm3_s');plastic=machine.get('plasticising_capacity_g_s')
    limits=[]
    if rate and density:
        minimum=dose*1000/density/rate;s['injection_s']=max(s['injection_s'],minimum);limits.append({'phase':'injection','minimum_s':minimum,'effective_s':s['injection_s'],'source':'declared volumetric press capacity and melt density'})
    if plastic:
        minimum=dose/plastic;s['plasticising_s']=max(s['plasticising_s'],minimum);limits.append({'phase':'plasticising','minimum_s':minimum,'effective_s':s['plasticising_s'],'source':'declared plasticising mass capacity'})
    if not rate or not density:checks.append(constraint('injection_capacity_time','incomplete',formula='Configured injection time used; volumetric capacity or melt density unknown.',critical=False))
    if not plastic:checks.append(constraint('plasticising_capacity_time','incomplete',formula='Configured plasticising duration used; mass-capacity limit unknown.',critical=False))
    s.update(belt_speed_mm_s=b['speed_mm_s'],belt_length_mm=b['length_mm'],batch_pitch_mm=b['minimum_batch_pitch_mm'])
    return cfg,s,checks,limits


def run(configuration,bindings,scenario_revision=0):
    cfg,s,checks,limits=prepare(configuration,bindings);r=cfg['robot'];belt=cfg['conveyor'];pack=cfg['packaging']
    events=[];cycles=[];parts=[];trips=[];issues=[];sequence=0
    def event(phase,resource,cycle,start,end,delta=None,part_ids=None,**extra):
        nonlocal sequence
        sequence+=1;events.append({'id':f'E{sequence:06d}','phase':phase,'resource':resource,'cycle':cycle,'start_s':float(start),'end_s':float(end),'mass_delta_g':delta or {},'part_ids':part_ids or [],**extra})
    hard=[c for c in checks if c['status']=='failed' or cfg['policy']=='require_known_l0_constraints' and c['critical_to_l0'] and c['status'] in ('incomplete','unknown')]
    dose=s['cavities']*s['part_mass_g']+s['runner_mass_g'];remaining=s['initial_material_g'];available_cycles=min(s['cycles'],int((remaining+1e-9)//dose));planned_parts=available_cycles*s['cavities']
    if hard:issues.extend('constraint:'+c['code'] for c in hard)
    ready=s['drying_s'] if s['dryer_enabled'] else 0.
    press_free=robot_free=feeder_free=screw_free=hopper_free=pitch_free=package_free=0.
    releases=[];box=1;box_fill=0;packaged=0
    waits={'robot_wait':0.,'conveyor_capacity_wait':0.,'conveyor_pitch_wait':0.,'container_change':0.,'packaging_queue':0.,'press_unload_wait':0.}
    if not hard:event('drying' if s['dryer_enabled'] else 'conditioning_bypassed','dryer',0,0.,ready,{'raw':-remaining,'conditioned':remaining})
    for number in range(1,available_cycles+1 if not hard else 1):
        remaining=max(0.,remaining-dose);feed_start=max(ready,feeder_free,hopper_free);feed_end=feed_start+s['feed_delay_s']+dose/s['feed_rate_g_s']
        event('feeding','feeder',number,feed_start,feed_end,{'conditioned':-dose,'hopper':dose})
        plastic_start=max(feed_end,screw_free);plastic_end=plastic_start+s['plasticising_s'];feeder_free=feed_end;hopper_free=plastic_end
        event('plasticising','screw',number,plastic_start,plastic_end,{'hopper':-dose,'melt':dose})
        close_end=press_free+s['closing_s'];event('closing','press',number,press_free,close_end)
        inject_start=max(close_end,plastic_end)
        if inject_start>close_end:event('dose_wait','press',number,close_end,inject_start)
        inject_end=inject_start+s['injection_s'];event('injection','press',number,inject_start,inject_end,{'melt':-dose,'mould':dose})
        hold_end=inject_end+s['holding_s'];event('holding','press',number,inject_end,hold_end);screw_free=hold_end
        cool_end=hold_end+s['cooling_s'];event('cooling','press',number,hold_end,cool_end)
        open_end=cool_end+s['opening_s'];event('opening','press',number,cool_end,open_end)
        eject_end=open_end+s['ejection_s'];event('ejection','press',number,open_end,eject_end,{'mould':-s['runner_mass_g'],'runner':s['runner_mass_g']})
        cycle_parts=[];cycle_trips=[]
        for start_lane in range(0,s['cavities'],r['eoat_slots']):
            lanes=list(range(start_lane,min(s['cavities'],start_lane+r['eoat_slots'])));ids=[f'C{number}-P{i+1}' for i in lanes];mass=len(lanes)*s['part_mass_g']
            pick_ready=max(eject_end,robot_free)
            if start_lane:
                event('reindex','robot',number,pick_ready,pick_ready+r['reindex_s']);pick_ready+=r['reindex_s']
            waits['robot_wait']+=max(0.,pick_ready-eject_end) if not start_lane else 0.
            pick_start=pick_ready;pick_end=pick_start+s['robot_pick_s'];event('pickup','robot',number,pick_start,pick_end,{'mould':-mass,'robot':mass},ids)
            transfer_end=pick_end+s['robot_transfer_s'];event('transfer','robot',number,pick_end,transfer_end,part_ids=ids)
            deposit=max(transfer_end,pitch_free);waits['conveyor_pitch_wait']+=deposit-transfer_end
            before_capacity=deposit
            while True:
                while releases and releases[0]<=deposit:heapq.heappop(releases)
                if len(releases)+len(lanes)<=belt['capacity_parts']:break
                deposit=max(deposit,releases[0])
            waits['conveyor_capacity_wait']+=deposit-before_capacity
            if deposit>transfer_end:event('belt_wait','robot',number,transfer_end,deposit,part_ids=ids)
            event('deposit','robot',number,deposit,deposit,{'robot':-mass,'belt':mass},ids)
            robot_free=deposit+s['robot_return_s'];event('return','robot',number,deposit,robot_free)
            pitch_free=deposit+belt['minimum_batch_pitch_mm']/belt['speed_mm_s'];arrival=deposit+belt['length_mm']/belt['speed_mm_s']
            trip={'cycle':number,'lanes':lanes,'pick_start_s':pick_start,'pick_end_s':pick_end,'transfer_end_s':transfer_end,'deposit_s':deposit,'return_end_s':robot_free};trips.append(trip);cycle_trips.append(trip)
            event('conveying','belt',number,deposit,arrival,part_ids=ids)
            for lane,pid in zip(lanes,ids):
                if pack['enabled']:
                    start=max(arrival,package_free);end=start+pack['handling_s_per_part'];waits['packaging_queue']+=start-arrival
                    event('packaging_accept','packaging',number,start,start,{'belt':-s['part_mass_g'],'packaging':s['part_mass_g']},[pid],container=box)
                    event('packaging','packaging',number,start,end,{'packaging':-s['part_mass_g'],'output':s['part_mass_g']},[pid],container=box)
                    current_box=box;package_free=end;box_fill+=1;packaged+=1
                    if box_fill==pack['parts_per_container'] and packaged<planned_parts:
                        event('container_change','packaging',number,end,end+pack['container_change_s'],container=box)
                        waits['container_change']+=pack['container_change_s'];package_free=end+pack['container_change_s'];box+=1;box_fill=0
                else:
                    start=end=arrival;current_box=None;event('output','belt',number,arrival,arrival,{'belt':-s['part_mass_g'],'output':s['part_mass_g']},[pid]);packaged+=1
                heapq.heappush(releases,start)
                item={'part_id':pid,'cycle':number,'lane':lane,'injection_end_s':inject_end,**{k:v for k,v in trip.items() if k not in ('cycle','lanes')},'arrival_s':arrival,'packaging_start_s':start,'packaging_end_s':end,'container':current_box};parts.append(item);cycle_parts.append(item)
        press_free=cycle_trips[-1]['pick_end_s'];event('unload_wait','press',number,eject_end,press_free);waits['press_unload_wait']+=press_free-eject_end
        first=cycle_trips[0];last=cycle_trips[-1]
        cycles.append({'cycle':number,'feed_start_s':feed_start,'injection_start_s':inject_start,'opening_start_s':cool_end,'opening_end_s':open_end,'pick_start_s':first['pick_start_s'],'pick_end_s':last['pick_end_s'],'transfer_end_s':last['transfer_end_s'],'deposit_s':last['deposit_s'],'return_end_s':last['return_end_s'],'exit_s':max(p['packaging_end_s'] for p in cycle_parts),'part_ids':[p['part_id'] for p in cycle_parts]})
    if not hard and available_cycles<s['cycles']:issues.append('material_starved')
    events.sort(key=lambda e:(e['start_s'],e['end_s'],e['id']));duration=max((e['end_s'] for e in events),default=0.)
    intervals=[b['injection_start_s']-a['injection_start_s'] for a,b in zip(cycles,cycles[1:])];mean=sum(intervals)/len(intervals) if intervals else None
    inventory={k:0. for k in ('raw','conditioned','hopper','melt','mould','robot','belt','packaging','output','runner')};inventory['raw']=s['initial_material_g']
    for e in events:
        for key,value in e['mass_delta_g'].items():inventory[key]+=value
    if abs(sum(inventory.values())-s['initial_material_g'])>1e-6 or min(inventory.values())< -1e-6:raise ArithmeticError('System mass conservation failed; no run may be saved.')
    busy={resource:sum(e['end_s']-e['start_s'] for e in events if e['resource']==resource and e['phase'] not in ('dose_wait','unload_wait','belt_wait','conveying','packaging_accept')) for resource in ('press','robot','screw','feeder','packaging')}
    bottleneck=max(busy,key=busy.get) if duration else None
    output=len(parts);containers=math.ceil(output/pack['parts_per_container']) if pack['enabled'] and output else 0
    summary={'completed_cycles':len(cycles),'output_parts':output,'shot_mass_g':dose,'consumed_g':len(cycles)*dose,'remaining_g':remaining,'output_g':output*s['part_mass_g'],'runner_g':len(cycles)*s['runner_mass_g'],'mean_cycle_interval_s':mean,'configured_parts_per_hour':3600*s['cavities']/mean if mean else None,'first_deposit_s':min((p['deposit_s'] for p in parts),default=None),'system_output_per_hour':3600*output/duration if duration else None,'containers_used':containers,'bottleneck_by_busy_time':bottleneck,'resource_busy_s':busy,'waits_s':waits,'final_inventory_g':inventory}
    return {'engine':'fabrivra.system-l0/1','model_manifest':MODEL.model_dump(),'fidelity':'L0 configured discrete events; exploratory, not physics/quality certification','origin':cfg['origin'],'status':'blocked' if hard else 'partial' if issues else 'completed','issues':issues,'scenario':s,'system_configuration':cfg,'constraints':checks,'press_checks':checks,'capacity_adjustments':limits,'graph':graph(),'events':events,'cycles':cycles,'part_records':parts,'robot_trips':trips,'duration_s':duration,'summary':summary,'parameters':parameter_records(cfg,scenario_revision,bindings),'dependency_hashes':dependency_hashes(cfg,bindings),
        'signal_manifest':[{'name':k,'unit':'g','status':'COMPUTED_UNVALIDATED','basis':'discrete completion-time mass balance'} for k in inventory]+[{'name':k,'unit':u,'status':'UNAVAILABLE','basis':'No physical solver/measurement supplied'} for k,u in [('cavity_pressure','MPa'),('melt_temperature','°C'),('moisture','%')]],
        'assumptions':['Configured batch conditioning, feed, press, robot, finite conveyor and operational packaging; no CFD or drying qualification.', 'A conveyor slot is occupied from robot deposit until packaging pickup, including travel and downstream waiting.', 'One FIFO packaging operator; container changes occupy it and propagate backpressure via finite conveyor capacity.', 'EOAT capacity may require multiple trips; press cannot close until the final grip clears the mould.', 'Linear XYZ poses and generic equipment are visual interpretations of the event clock; collision and actual gripper/container geometric fit are unverified.', 'Rates describe this finite campaign including startup/drain, not a measured annual good-production/OEE guarantee.']}


def economics(result,bindings):
    c=result['system_configuration']['costs'];m=(bindings.get('machine') or {}).get('data',{});n=result['summary']['output_parts'];D=lambda v:Decimal(str(v));fmt=lambda v:None if v is None else format(v.quantize(Decimal('.000001')),'f')
    rate=m.get('hourly_cost') if m.get('currency')==c['currency'] else None
    hours=D(result['duration_s'])/3600
    machine=D(rate)*hours if rate is not None else None;robot=D(c['robot_per_hour'])*hours if c['robot_per_hour'] is not None else None
    packaging=D(c['packaging_per_hour'])*hours if c['packaging_per_hour'] is not None and result['system_configuration']['packaging']['enabled'] else Decimal(0) if not result['system_configuration']['packaging']['enabled'] else None
    material=D(result['summary']['consumed_g'])/1000*D(c['material_per_kg']) if c['material_per_kg'] is not None else None
    boxes=D(result['summary']['containers_used'])*D(c['container_each']) if c['container_each'] is not None else Decimal(0) if not result['system_configuration']['packaging']['enabled'] else None
    amort=D(c['tooling_investment'])*n/(D(c['annual_good_demand'])*D(c['programme_years'])) if c['tooling_investment'] is not None and c['annual_good_demand'] and c['programme_years'] else None
    energy=Decimal(0) if c['energy_in_hourly_rates'] else D(c['additional_energy_per_shot'])*result['summary']['completed_cycles'] if c['additional_energy_per_shot'] is not None else None
    components={'machine':machine,'robot':robot,'packaging':packaging,'material_including_runner':material,'containers':boxes,'tooling_allocation':amort,'additional_energy':energy};total=sum(components.values(),Decimal(0)) if n and all(v is not None for v in components.values()) else None
    annual=result['summary']['system_output_per_hour']*c['operating_hours_per_year'] if result['summary']['system_output_per_hour'] is not None and c['operating_hours_per_year'] is not None else None
    return {'currency':c['currency'],'components_total':{k:fmt(v) for k,v in components.items()},'unit_cost':fmt(total/n) if total is not None else None,'total_campaign_cost':fmt(total),'missing_costs':[k for k,v in components.items() if v is None],'annual_capacity_projection':annual,'annual_demand':c['annual_good_demand'],'demand_met':annual>=c['annual_good_demand'] if annual is not None and c['annual_good_demand'] is not None else None,'validity':'Configured campaign cost; hourly costs include waiting. Energy charged only once. Annual projection assumes identical campaigns and 100% acceptance; no OEE/scrap forecast. Tool allocation uses declared demand, not confirmed sales. No financing/tax or unspecified costs inferred.'}
