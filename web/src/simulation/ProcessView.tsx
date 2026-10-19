import { useEffect, useMemo, useRef, useState } from 'react';
import { mountProcessCell } from './cell-view.js';
import { phaseLabels, type ProcessRun } from './types';
import type { Concept } from '../geometry/import';
import { Icon } from '../ui/Icon';

export function ProcessView({ run, concept, active, stale, t }: { run: ProcessRun; concept: Concept | null; active: boolean; stale: boolean; t: (s: string) => string }) {
  const [time, setTime] = useState(0), [playing, setPlaying] = useState(false), [speed, setSpeed] = useState(1);
  const element = useRef<HTMLDivElement>(null), viewer = useRef<ReturnType<typeof mountProcessCell> | null>(null);
  useEffect(() => { setTime(0); setPlaying(false); }, [run.id]);
  useEffect(() => { if (!active) setPlaying(false); }, [active]);
  useEffect(() => { if (element.current) viewer.current = mountProcessCell(element.current, run, concept, t); return () => { viewer.current?.dispose(); viewer.current = null; }; }, [run.id, concept, t('Drying')]);
  useEffect(() => viewer.current?.sample(time), [time, run.id]);
  useEffect(() => { if (time >= run.duration_s) setPlaying(false); }, [time, run.duration_s]);
  useEffect(() => {
    if (!playing || !active) return;
    let handle = 0, previous = performance.now();
    const frame = (now: number) => { const dt = Math.min(.25, (now - previous) / 1000); previous = now; setTime(old => Math.min(run.duration_s, old + dt * speed)); handle = requestAnimationFrame(frame); };
    handle = requestAnimationFrame(frame); return () => cancelAnimationFrame(handle);
  }, [playing, speed, active, run.duration_s]);
  const boundaries = useMemo(() => [...new Set(run.events.flatMap(e => [e.start_s, e.end_s]))].sort((a, b) => a - b), [run.id]);
  const activeEvents = run.events.filter(e => e.start_s <= time && time < e.end_s);
  const balances: Record<string, number> = { raw: run.scenario.initial_material_g, conditioned: 0, hopper: 0, melt: 0, mould: 0, robot: 0, belt: 0, output: 0, runner: 0 };
  for (const e of run.events) if (e.end_s <= time) for (const [k, v] of Object.entries(e.mass_delta_g)) balances[k] += v;
  const deposited = run.cycles.filter(c => c.deposit_s <= time).length * run.scenario.cavities;
  const out = run.cycles.filter(c => c.exit_s <= time).length * run.scenario.cavities;
  const labels: Record<string, string> = { raw: 'Granules', conditioned: 'Conditioned', hopper: 'Hopper', melt: 'Melt', mould: 'Mould', robot: 'Robot', belt: 'Conveyor', output: 'Output', runner: 'Runner' };
  return <div className="process-workbench" hidden={!active}>
    <div className="process-view-title"><span className="badge">L0 · {t('Configured cycle')}</span><strong>{run.scenario.name}</strong><span className={`badge ${stale ? 'amber' : ''}`}>{t(stale ? 'Outdated result' : run.status)}</span></div>
    <div className="process-cell"><div id="process-cell" ref={element}/><div className="process-stage-list">{activeEvents.filter(e => !['return', 'conveying'].includes(e.phase)).map(e => <span key={`${e.phase}-${e.cycle}`}>{t(phaseLabels[e.phase])} {e.cycle ? `· C${e.cycle}` : ''}</span>)}</div><div className="process-cell-note">{t('Illustrative cell. Paths and tooling clearances are not validated.')}</div></div>
    <div className="process-live-stats"><span>{t('Deposited')}<b id="deposited-count">{deposited}</b></span><span>{t('Output parts')}<b id="output-count">{out}</b></span><span>{t('Simulation time')}<b id="simulation-time">{time.toFixed(2)} s</b></span></div>
    <div className="process-transport"><button id="process-play" aria-label={t(playing ? 'Pause' : 'Play')} disabled={!run.duration_s} onClick={() => { if (time >= run.duration_s) setTime(0); setPlaying(!playing); }}><Icon name={playing ? 'stop' : 'play'} size={17}/>{t(playing ? 'Pause' : 'Play')}</button><button id="process-step" title={t('Next event')} onClick={() => { setPlaying(false); setTime(boundaries.find(v => v > time + 1e-7) ?? run.duration_s); }}>{t('Next event')}</button><input id="process-seek" aria-label={t('Simulation time')} type="range" min="0" max={run.duration_s || 1} step="0.01" value={time} onChange={e => { setPlaying(false); setTime(Number(e.target.value)); }}/><select aria-label={t('Playback speed')} value={speed} onChange={e => setSpeed(Number(e.target.value))}>{[.25, 1, 4, 10].map(v => <option key={v} value={v}>{v}×</option>)}</select></div>
    <div className="process-timeline">{['dryer', 'feeder', 'screw', 'press', 'robot', 'belt'].map(resource => <div className="timeline-row" key={resource}><span>{t({ dryer: 'Drying', feeder: 'Feeding', screw: 'Plasticising', press: 'Press', robot: 'Robot', belt: 'Conveyor' }[resource]!)}</span><div>{run.events.filter(e => e.resource === resource).map((e, i) => <button key={i} className={`timeline-event phase-${e.phase}`} title={`${t(phaseLabels[e.phase])} · C${e.cycle} · ${e.start_s.toFixed(2)}–${e.end_s.toFixed(2)} s`} style={{ left: `${e.start_s / (run.duration_s || 1) * 100}%`, width: `${Math.max(.3, (e.end_s - e.start_s) / (run.duration_s || 1) * 100)}%` }} onClick={() => { setPlaying(false); setTime(e.start_s); }}/>) }<i className="timeline-cursor" style={{ left: `${time / (run.duration_s || 1) * 100}%` }}/></div></div>)}</div>
    <div className="process-inventory" aria-label={t('Material inventory')}>{Object.entries(balances).map(([key, value]) => <span key={key}>{t(labels[key])}<b>{Math.max(0, value).toFixed(1)} g</b></span>)}</div>
  </div>;
}
