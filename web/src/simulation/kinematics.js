// One stored run and one clock. Poses are generic L0 visuals, not a collision solve.
const mix = (a, b, u) => a.map((v, i) => v + (b[i] - v) * Math.max(0, Math.min(1, u)));
const laneY=(run,lane)=>run.engineering?.cavity_positions_mm[lane]?.[1] ?? (lane-(run.scenario.cavities-1)/2)*80;
export function robotPosition(run, time) {
  const cfg=run.system_configuration?.robot,clearance=cfg?.clearance_mm??350,transfer=cfg?.transfer_distance_mm??900,deposit=cfg?.deposit_height_mm??20;
  for (const c of run.robot_trips??run.cycles) {
    const center=c.lanes?c.lanes.reduce((v,l)=>v+laneY(run,l),0)/c.lanes.length:0;
    if (time >= c.pick_start_s && time < c.pick_end_s) return mix([0,center,0],[0,center,cfg?clearance:220],(time-c.pick_start_s)/(c.pick_end_s-c.pick_start_s||1));
    if (time >= c.pick_end_s && time < c.transfer_end_s) return mix([0,center,cfg?clearance:220],[transfer,center,deposit],(time-c.pick_end_s)/(c.transfer_end_s-c.pick_end_s||1));
    if (time >= c.transfer_end_s && time < c.deposit_s) return [transfer,center,deposit];
    if (time >= c.deposit_s && time < c.return_end_s) return mix([transfer,center,deposit],[0,0,clearance],(time-c.deposit_s)/(c.return_end_s-c.deposit_s||1));
  }
  return [0,0,clearance];
}
export function partPosition(run, cycle, lane, time) {
  const s=run.scenario,p=run.part_records?.find(p=>p.cycle===cycle.cycle&&p.lane===lane),y=laneY(run,lane);
  if(p){
    if(time<p.injection_end_s||time>=p.packaging_end_s)return null;
    if(time<p.pick_start_s)return [0,y,0];
    if(time<p.deposit_s){const position=robotPosition(run,time),trip=run.robot_trips.find(c=>c.cycle===p.cycle&&c.lanes.includes(lane)),center=trip.lanes.reduce((v,l)=>v+laneY(run,l),0)/trip.lanes.length;return [position[0],position[1]+y-center,position[2]];}
    const transfer=run.system_configuration.robot.transfer_distance_mm,z=run.system_configuration.robot.deposit_height_mm;
    if(time<p.packaging_start_s){
      // Render FIFO batch queues at the belt end; slots and wait times come from the engine.
      const waiting=run.part_records.filter(q=>q.arrival_s<=time&&time<q.packaging_start_s),batches=[...new Set(waiting.map(q=>q.deposit_s))].sort((a,b)=>a-b),index=Math.max(0,batches.indexOf(p.deposit_s));
      const queueEnd=s.belt_length_mm-index*run.system_configuration.conveyor.minimum_batch_pitch_mm;
      return [transfer+Math.max(0,Math.min((time-p.deposit_s)*s.belt_speed_mm_s,queueEnd)),y,z];
    }
    return mix([transfer+s.belt_length_mm,y,z],[transfer+s.belt_length_mm+200,0,z-40],(time-p.packaging_start_s)/(p.packaging_end_s-p.packaging_start_s||1));
  }
  if(time<cycle.injection_start_s+s.injection_s||time>=cycle.exit_s)return null;
  if(time<cycle.pick_start_s)return [0,y,0];
  if(time<cycle.deposit_s){const p=robotPosition(run,time);return [p[0],p[1]+y,p[2]];}
  return [900+(time-cycle.deposit_s)*s.belt_speed_mm_s,y,20];
}
export function mouldOpenness(run, time) {
  let value=1;
  for(const e of run.events){
    if(e.phase==='closing'&&time>=e.start_s)value=time>=e.end_s?0:1-(time-e.start_s)/(e.end_s-e.start_s||1);
    if(e.phase==='opening'&&time>=e.start_s)value=time>=e.end_s?1:(time-e.start_s)/(e.end_s-e.start_s||1);
  }
  return value;
}
