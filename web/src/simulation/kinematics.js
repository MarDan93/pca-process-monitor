// One kinematic model shared by animation, plots and trace export. Not collision validated.
const mix = (a, b, u) => a.map((v, i) => v + (b[i] - v) * Math.max(0, Math.min(1, u)));
export function robotPosition(run, time) {
  for (const c of run.cycles) {
    if (time >= c.pick_start_s && time < c.pick_end_s) return mix([0, 0, 0], [0, 0, 220], (time - c.pick_start_s) / (c.pick_end_s - c.pick_start_s || 1));
    if (time >= c.pick_end_s && time < c.transfer_end_s) return mix([0, 0, 220], [900, 0, 20], (time - c.pick_end_s) / (c.transfer_end_s - c.pick_end_s));
    if (time >= c.transfer_end_s && time < c.deposit_s) return [900, 0, 20];
    if (time >= c.deposit_s && time < c.return_end_s) return mix([900, 0, 20], [0, 0, 350], (time - c.deposit_s) / (c.return_end_s - c.deposit_s || 1));
  }
  return [0, 0, 350];
}
export function partPosition(run, cycle, lane, time) {
  const s = run.scenario;
  if (time < cycle.injection_start_s + s.injection_s || time >= cycle.exit_s) return null;
  const y = run.engineering?.cavity_positions_mm[lane]?.[1] ?? (lane - (s.cavities - 1) / 2) * 80;
  if (time < cycle.pick_start_s) return [0, y, 0];
  if (time < cycle.deposit_s) { const p = robotPosition(run, time); return [p[0], p[1] + y, p[2]]; }
  return [900 + (time - cycle.deposit_s) * s.belt_speed_mm_s, y, 20];
}

export function mouldOpenness(run, time) {
  let value = 1;
  for (const e of run.events) {
    if (e.phase === 'closing' && time >= e.start_s) value = time >= e.end_s ? 0 : 1 - (time - e.start_s) / (e.end_s - e.start_s || 1);
    if (e.phase === 'opening' && time >= e.start_s) value = time >= e.end_s ? 1 : (time - e.start_s) / (e.end_s - e.start_s || 1);
  }
  return value;
}
