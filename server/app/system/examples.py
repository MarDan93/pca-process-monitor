"""Original geometry and configured fixtures. These are not OEM/grade data."""
from itertools import product
from ..process import example


def consumer_tray_obj():
    axes=[[0.,2.5,77.5,80.],[0.,2.5,47.5,50.],[0.,2.5,20.]]
    cells={(i,j,k) for i,j,k in product(range(3),range(3),range(2)) if i in (0,2) or j in (0,2) or k==0}
    vertices=[];lookup={};triangles=[]
    faces=[((-1,0,0),[(0,0,0),(0,0,1),(0,1,1),(0,1,0)]),((1,0,0),[(1,0,0),(1,1,0),(1,1,1),(1,0,1)]),((0,-1,0),[(0,0,0),(1,0,0),(1,0,1),(0,0,1)]),((0,1,0),[(0,1,0),(0,1,1),(1,1,1),(1,1,0)]),((0,0,-1),[(0,0,0),(0,1,0),(1,1,0),(1,0,0)]),((0,0,1),[(0,0,1),(1,0,1),(1,1,1),(0,1,1)])]
    for cell in sorted(cells):
        for offset,corners in faces:
            if tuple(cell[a]+offset[a] for a in range(3)) in cells:continue
            ids=[]
            for corner in corners:
                v=tuple(axes[a][cell[a]+corner[a]] for a in range(3))
                if v not in lookup:lookup[v]=len(vertices)+1;vertices.append(v)
                ids.append(lookup[v])
            triangles.extend([(ids[0],ids[1],ids[2]),(ids[0],ids[2],ids[3])])
    return ('o Original_consumer_tray\n'+''.join('v '+' '.join(map(str,v))+'\n' for v in vertices)+''.join('f '+' '.join(map(str,t))+'\n' for t in triangles)).encode()


def fixture_configs():
    result=[]
    for cavities in [2,4]:
        recipe=example().model_dump();recipe.update(name=f'{cavities}-cavity configured cell',cycles=80 if cavities==2 else 40,cavities=cavities,part_mass_g=18.,runner_mass_g=2.,initial_material_g=5000.,hopper_capacity_g=500.,dryer_enabled=False,drying_s=0.,feed_rate_g_s=200.,plasticising_s=2.,closing_s=.5,injection_s=.8,holding_s=1.,cooling_s=2.,opening_s=.5,ejection_s=.5,robot_pick_s=.6,robot_transfer_s=1.,robot_return_s=.8,belt_speed_mm_s=100.,belt_length_mm=1000.,batch_pitch_mm=100.)
        result.append({'name':f'Configuration {"A" if cavities==2 else "B"} · {cavities} cavities','origin':'synthetic_demo','source_ref':'FABRIVRA original system benchmark / 2026-10-26','policy':'exploratory','machine_id':None,'material_id':None,'recipe':recipe,
            'mould':{'ejection_axis':'z','cavity_gap_mm':30.,'edge_allowance_mm':50.,'plate_thickness_mm':120.,'opening_mm':250.,'projected_area_mm2':4100.,'cavity_pressure_mpa':30.,'clamp_safety_factor':1.2},
            'robot':{'eoat_slots':cavities,'allow_multiple_trips':True,'payload_kg':5.,'eoat_mass_kg':1.,'eoat_pitch_mm':80.,'reindex_s':1.5,'reach_mm':1500.,'required_reach_mm':1000.,'clearance_mm':350.,'transfer_distance_mm':900.,'deposit_height_mm':20.},
            'conveyor':{'capacity_parts':4,'length_mm':1000.,'speed_mm_s':100.,'minimum_batch_pitch_mm':100.},
            'packaging':{'enabled':True,'parts_per_container':12,'handling_s_per_part':1.2,'container_change_s':25.,'supply':'unlimited_configured','available_containers':None,'required_orientation_deg':0},
            'costs':{'currency':'EUR','material_per_kg':'2.00','robot_per_hour':'5.00','packaging_per_hour':'15.00','container_each':'0.30','tooling_investment':'50000' if cavities==2 else '75000','energy_in_hourly_rates':True,'additional_energy_per_shot':None,'operating_hours_per_year':4000.,'annual_good_demand':500000,'programme_years':5.}})
    return result


def machine_fixture(name='Synthetic press A'):
    return {'name':name,'manufacturer':'Fictional test fixture','model':'CONFIGURED-A','source_kind':'synthetic','notes':'All dimensions, capacity and costs are arbitrary software-test inputs; no OEM claim.','clamp_force_kn':3000.,'tiebar_x_mm':650.,'tiebar_y_mm':650.,'mould_min_mm':200.,'mould_max_mm':700.,'opening_stroke_mm':600.,'max_daylight_mm':1300.,'max_shot_cm3':700.,'screw_diameter_mm':55.,'max_injection_rate_cm3_s':100.,'plasticising_capacity_g_s':60.,'hourly_cost':'60.00','currency':'EUR'}


def material_fixture():
    return {'name':'Synthetic thermoplastic test material','family':'Unspecified thermoplastic','source_kind':'synthetic','melt_density_kg_m3':750.,'notes':'Arbitrary melt density for dimensional conversion only. No measured grade, thermal or rheological properties supplied.'}


def kit_files():
    """Portable declared fixtures. Configuration IDs must be selected after import."""
    import csv,io,json,hashlib
    from ..resources import Machine,Material
    files={'consumer-tray.obj':consumer_tray_obj()}
    for name,model,data in [('machines.csv',Machine,machine_fixture()),('materials.csv',Material,material_fixture())]:
        stream=io.StringIO(newline='');writer=csv.DictWriter(stream,fieldnames=list(model.model_fields),lineterminator='\n');writer.writeheader();writer.writerow(data);files[name]=stream.getvalue().encode()
    for i,cfg in enumerate(fixture_configs()):files[f'scenario-{2 if i==0 else 4}-cavities.json']=json.dumps(cfg,indent=2).encode()+b'\n'
    files['README.md']=b'''# FABRIVRA complete-cell benchmark v1\n\nAll costs, times, machine dimensions and material properties are synthetic original software-test inputs, not OEM/grade data or scientific validation. The OBJ is an original 80 x 50 x 20 mm consumer tray. It is a mesh, not a parametric production mould.\n\nFast path: in System Simulation, click Load 2 vs 4 cavity benchmark, then Run & compare scenarios. This creates a separate project with geometry, two resource records and two saved scenarios; existing projects are retained.\n\nManual import: create a project, import consumer-tray.obj in mm, import machines.csv and materials.csv through the respective library validate/import flow, import each scenario JSON, select the newly imported press and material, review, approve and run. Both alternatives produce 160 parts (80 x 2 vs 40 x 4 shots). Compare the same finite campaign, including startup and drain.\n\nThe baseline has four conveyor slots and 12 parts/container with a 25-second change. Change the container capacity or change time and rerun: downstream queueing changes actual robot/press waiting. Try 1000 conveyor slots, 0 seconds change and 0.01 seconds/part handling for the fast downstream counterexample. No optimum is hardcoded. The press hourly rate belongs to the machine record. Missing prices remain unknown. A run snapshot retains its original inputs and sources.\n\nL0 provides mass balances and configured resource reservations. Pressure, temperature, moisture, collision clearance and product quality are unavailable/unverified; no FEM/FVM, CAE or forecasting model runs. Do not use the benchmark to size real production equipment.\n\nLicense: original FABRIVRA code and fixtures MIT. No OEM assets or external material datasets are redistributed.\n'''
    manifest={'schema_version':'fabrivra.benchmark-kit/1','origin':'synthetic_demo','source_ref':'FABRIVRA original benchmark / 2026-10-26','license':'MIT','files':{k:hashlib.sha256(v).hexdigest() for k,v in files.items()}}
    files['manifest.json']=json.dumps(manifest,indent=2).encode()+b'\n'
    return files
