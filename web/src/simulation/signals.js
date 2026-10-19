import { robotPosition, mouldOpenness } from './kinematics.js';
/** @type {Array<{id:string,label:string,unit:string,source:string,interpolation?:string,unavailable?:boolean}>} */
export const channels = [
 ...['raw','conditioned','hopper','melt','mould','robot','belt','output','runner'].map(id=>({id:`mass_${id}`, label: {raw:'Granules',conditioned:'Conditioned',hopper:'Hopper',melt:'Melt',mould:'Mould',robot:'Robot',belt:'Conveyor',output:'Output',runner:'Runner'}[id] || id, unit:'g', source:'L0 discrete mass balance', interpolation:'step'})),
 ...['x','y','z'].map(axis=>({id:`robot_${axis}`,label:`Robot ${axis.toUpperCase()}`,unit:'mm',source:'Illustrative XYZ trajectory',interpolation:'linear'})),
 {id:'mould_open',label:'Mould opening',unit:'%',source:'Configured opening/closing ramp',interpolation:'linear'},
 {id:'output_parts',label:'Output parts',unit:'parts',source:'L0 event count',interpolation:'step'},
 {id:'cavity_pressure',label:'Cavity pressure',unit:'MPa',source:'Requires measurements or a filling solver',unavailable:true},
 {id:'melt_temperature',label:'Melt temperature',unit:'°C',source:'Requires measurements or a thermal solver',unavailable:true},
 {id:'moisture',label:'Material moisture',unit:'%',source:'Requires measurements or a drying model',unavailable:true},
 {id:'screw_torque',label:'Screw torque',unit:'N·m',source:'Requires screw geometry, rheology and a plasticising model',unavailable:true}
];
export function signalValue(run,id,time){
 if(id.startsWith('mass_')){const k=id.slice(5);let v=k==='raw'?run.scenario.initial_material_g:0;for(const e of run.events)if(e.end_s<=time)v+=e.mass_delta_g[k]||0;return Math.max(0,v);}
 if(id.startsWith('robot_'))return robotPosition(run,time)[{robot_x:0,robot_y:1,robot_z:2}[id]];
 if(id==='mould_open')return mouldOpenness(run,time)*100;
 if(id==='output_parts')return run.cycles.filter(c=>c.exit_s<=time).length*run.scenario.cavities;
 return null;
}
export function traceTimes(run){return [...new Set([0,run.duration_s,...run.events.flatMap(e=>[e.start_s,e.end_s]),...Array.from({length:301},(_,i)=>run.duration_s*i/300)])].sort((a,b)=>a-b);}
export function traceCSV(run){const selected=channels.filter(c=>!c.unavailable);return ['time_s,'+selected.map(c=>c.id+'__'+c.unit).join(','),...traceTimes(run).map(t=>[t,...selected.map(c=>signalValue(run,c.id,t))].join(','))].join('\n');}
