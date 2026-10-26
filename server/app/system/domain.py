"""Subsystem graph, source records and dependency hashes; independent of rendering."""
from ..store import digest
from .schemas import ModelManifest,InterfacePort

MODEL=ModelManifest(id='fabrivra.system-l0',version='1.0.0',fidelity='L0',implementation='implemented',license='MIT',validity='Deterministic configured resource scheduling; no physical/experimental production validation.')
NODES=[('stock','material_supply'),('dryer','batch_conditioning'),('feeder','material_transport'),('screw','plasticising'),('press','injection_press'),('mould','tooling'),('robot','xyz_eoat'),('belt','finite_buffer_conveyor'),('packaging','operational_packaging'),('output','finished_goods')]

def graph():
    links=[('stock','dryer','g'),('dryer','feeder','g'),('feeder','screw','g'),('screw','press','g'),('press','mould','g'),('mould','robot','part'),('robot','belt','part'),('belt','packaging','part'),('packaging','output','part')]
    return {'schema_version':'fabrivra.production-system/1','nodes':[{'id':i,'type':t} for i,t in NODES],
        'connections':[{'id':f'{a}:{b}','from':a+'.out','to':b+'.in','quantity':'material' if unit=='g' else 'part','unit':unit} for a,b,unit in links],
        'ports':[InterfacePort(id=node+'.'+side,node=node,quantity='material_or_parts',unit='g' if node in ('stock','dryer','feeder','screw','press') or node=='mould' and side=='in' else 'part',frame='cell_mm_xyz',time_basis='simulation_seconds').model_dump() for node,_ in NODES for side in ('in','out')],
        'adapters':[MODEL.model_dump(),ModelManifest(id='fabrivra.mold-cae',version='contract/1',fidelity='L2',implementation='unavailable',license='Solver selection not approved',validity='Interface only; no mesh/solver invocation.').model_dump(),ModelManifest(id='fabrivra.timeseries',version='contract/1',fidelity='forecast',implementation='unavailable',license='Code/weights require separate review',validity='No model weights or forecasts loaded.').model_dump()],
        'future_modules':{'packaging_design':'unavailable; operational packaging is implemented in L0','fmi_adapter':'unavailable; no FMI compliance claim'}}

def dependency_hashes(config,bindings):
    machine=(bindings.get('machine') or {}).get('data',{});physical_machine={k:v for k,v in machine.items() if k not in ('hourly_cost','currency','notes','name','manufacturer','source_url')}
    asset=bindings.get('asset');geometry={'sha256':asset['sha256'],'units':asset['source_units'],'frame':asset['frame']} if asset else None
    layout={'geometry':geometry,'mould':config['mould'],'cavities':config['recipe']['cavities']}
    compatibility={'layout':layout,'machine':physical_machine,'shot':{k:config['recipe'][k] for k in ('cavities','part_mass_g','runner_mass_g')},'material':(bindings.get('material') or {}).get('data')}
    eoat={'layout':layout,'robot':config['robot'],'mass':config['recipe']['part_mass_g'],'orientation':config['recipe']['mould_orientation_deg']}
    schedule={'policy':config['policy'],'recipe':{k:v for k,v in config['recipe'].items() if k not in ('name','basis','material')},'robot':config['robot'],'conveyor':config['conveyor'],'packaging':config['packaging'],'machine':physical_machine,'material':compatibility['material']}
    schedule_hash=digest(schedule)
    return {'geometry':digest(geometry),'mould_layout':digest(layout),'press_checks':digest(compatibility),'eoat_checks':digest(eoat),'schedule':schedule_hash,
        'animation':digest({'schedule':schedule_hash,'geometry':geometry,'layout':layout}),
        'economics':digest({'schedule':schedule_hash,'costs':config['costs'],'machine_rate':machine.get('hourly_cost'),'machine_currency':machine.get('currency')})}

UNITS={'annual_good_demand':'part/year','programme_years':'year','operating_hours_per_year':'h/year','eoat_slots':'part/grip','capacity_parts':'part','parts_per_container':'part/container','available_containers':'container','cavities':'cavity','cycles':'shot','clamp_safety_factor':'1','cavity_pressure_mpa':'MPa','projected_area_mm2':'mm²','eoat_mass_kg':'kg','payload_kg':'kg','material_per_kg':'currency/kg','robot_per_hour':'currency/h','packaging_per_hour':'currency/h','container_each':'currency/container','tooling_investment':'currency','additional_energy_per_shot':'currency/shot'}

def parameter_records(config,revision,bindings=None):
    out=[]
    def walk(value,path=''):
        if isinstance(value,dict):
            for k,v in value.items():walk(v,path+'.'+k if path else k)
        elif value is None or isinstance(value,(int,float,bool,str)):
            key=path.rsplit('.',1)[-1];unit='flag' if isinstance(value,bool) else 'identifier' if key.endswith('_id') else 'enum/text' if isinstance(value,str) and (not path.startswith('costs.') or key=='currency') else UNITS.get(key)
            if unit is None:
                unit=next((u for suffix,u in [('_mm_s','mm/s'),('_g_s','g/s'),('_s_per_part','s/part'),('_mm','mm'),('_g','g'),('_s','s'),('_deg','degree')] if key.endswith(suffix)),'count')
            out.append({'path':path,'value':value,'unit':unit.replace('currency',config['costs']['currency']),'origin':config['origin'],'source_ref':config['source_ref'],'model_version':MODEL.version,'confidence_or_validity':'unknown' if value is None else 'synthetic configured fixture; not measured' if config['origin']=='synthetic_demo' else 'user-declared; unverified','scenario_revision':revision,'time_basis':'simulation_seconds'})
    walk(config)
    for kind in ('machine','material'):
        resource=(bindings or {}).get(kind)
        if not resource:continue
        for key,value in resource['data'].items():
            if not (value is None or isinstance(value,(int,float)) and not isinstance(value,bool) or key=='hourly_cost'):continue
            unit={'hourly_cost':config['costs']['currency']+'/h','max_shot_cm3':'cm³','max_injection_rate_cm3_s':'cm³/s','plasticising_capacity_g_s':'g/s','melt_density_kg_m3':'kg/m³','solid_density_kg_m3':'kg/m³','clamp_force_kn':'kN'}.get(key,'mm' if key.endswith('_mm') else 'declared in resource schema')
            out.append({'path':'bindings.'+kind+'.'+key,'value':value,'unit':unit,'origin':resource['data'].get('source_kind','manual'),'source_ref':resource['data'].get('source_url') or resource['data'].get('notes') or resource['id'],'model_version':MODEL.version,'confidence_or_validity':'unknown' if value is None else 'declared resource; not independently verified','scenario_revision':revision,'time_basis':'simulation_seconds'})
    return out
