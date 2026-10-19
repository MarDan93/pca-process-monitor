import { useEffect, useState } from 'react';
import { api, type Project, type Source } from '../api';
import { Icon } from '../ui/Icon';
import { issueLabels, scenarioLabels, type Scenario, type ProcessRun } from './types';

export function ProcessPanel({ project, run, t, busy, onPreview, onRun, onError }: { project: Project; run: ProcessRun | null; t: (s: string) => string; busy: boolean; onPreview: (s: Scenario, source: Source) => void; onRun: () => void; onError: (s: string) => void }) {
  const [draft, setDraft] = useState<Scenario | null>(project.process);
  useEffect(() => setDraft(project.process), [project.id, project.process]);
  const set = (key: string, value: unknown) => setDraft(d => d ? { ...d, [key]: value } : d);
  const field = (key: keyof Scenario) => <label className="field" key={key}><span>{t(scenarioLabels[key])}</span><input id={`process-${key}`} type="number" step="any" min="0" required value={String(draft?.[key] ?? '')} onChange={e => set(key, e.target.value === '' ? NaN : Number(e.target.value))}/></label>;
  const group = (label: string, keys: (keyof Scenario)[], open = false) => <details className="process-group" open={open}><summary>{t(label)}</summary><div className="form-fields">{keys.map(field)}</div></details>;
  const stale = run && run.project_revision !== project.revision;
  const dirty = JSON.stringify(draft) !== JSON.stringify(project.process);
  return <div className="process-panel"><p className="eyebrow">L0 / {t('Process simulation')}</p><h2>{t('Granule to conveyor')}</h2><p className="help">{t('Configured times and discrete material balances. No flow or thermal solution.')}</p>
    <button className="secondary full" id="load-process-example" disabled={busy} onClick={() => { api.processExample().then(setDraft).catch(e => onError(e.message)); }}><Icon name="process" size={16}/>{t('Load synthetic example')}</button>
    {draft && <form onSubmit={e => { e.preventDefault(); onPreview(draft, { kind: 'manual' }); }}>
      <label className="field"><span>{t('Scenario name')}</span><input id="process-name" value={draft.name} required maxLength={120} onChange={e => set('name', e.target.value)}/></label>
      <span className="badge amber">{t(draft.basis === 'synthetic' ? 'Synthetic reference' : 'User-declared inputs')}</span>
      <label className="field"><span>{t('Input basis')}</span><select value={draft.basis} onChange={e => set('basis', e.target.value)}><option value="synthetic">{t('Synthetic reference')}</option><option value="user_declared">{t('User-declared inputs')}</option></select></label>
      <label className="field"><span>{t('Material / grade')}</span><input value={draft.material} required maxLength={120} onChange={e => set('material', e.target.value)}/></label>
      {group('Production and material', ['cycles', 'cavities', 'part_mass_g', 'runner_mass_g', 'initial_material_g', 'hopper_capacity_g'], true)}
      <details className="process-group"><summary>{t('Drying and feeding')}</summary><label className="process-check"><input id="process-dryer_enabled" type="checkbox" checked={draft.dryer_enabled} onChange={e => set('dryer_enabled', e.target.checked)}/>{t('Dryer enabled')}</label><div className="form-fields">{(['drying_s', 'feed_delay_s', 'feed_rate_g_s'] as const).map(field)}</div></details>
      {group('Press sequence', ['plasticising_s', 'closing_s', 'injection_s', 'holding_s', 'cooling_s', 'opening_s', 'ejection_s'])}
      {group('Robot and conveyor', ['robot_pick_s', 'robot_transfer_s', 'robot_return_s', 'belt_speed_mm_s', 'belt_length_mm', 'batch_pitch_mm'])}
      <details className="process-group"><summary>{t('Orientation')}</summary>{(['mould_orientation_deg', 'belt_orientation_deg'] as const).map(key => <label className="field" key={key}><span>{t(scenarioLabels[key])}</span><select id={`process-${key}`} value={draft[key]} onChange={e => set(key, Number(e.target.value))}>{[0, 90, 180, 270].map(n => <option key={n} value={n}>{n}°</option>)}</select></label>)}</details>
      <button className="secondary full" id="preview-process" type="submit" disabled={busy || !dirty}>{t('Preview changes')}</button>
    </form>}
    <button className="primary full run-process" id="run-process" disabled={busy || !project.process || dirty} onClick={onRun}><Icon name="play" size={17}/>{t('Run process')}</button>
    {dirty && <p className="help small">{t('Approve the configuration before running.')}</p>}
    {run && <div className="process-results"><span className={`badge ${stale || run.status !== 'completed' ? 'amber' : ''}`}>{t(stale ? 'Outdated result' : run.status)}</span><p className="section-label">{t('Run results')} · r{run.project_revision}</p><dl><div><dt>{t('Output parts')}</dt><dd>{run.summary.output_parts}</dd></div><div><dt>{t('Run duration')}</dt><dd>{run.duration_s.toFixed(2)} s</dd></div><div><dt>{t('Mean injection interval')}</dt><dd>{run.summary.mean_cycle_interval_s?.toFixed(2) ?? '—'} s</dd></div><div><dt>{t('Configured output / hour')}</dt><dd>{run.summary.configured_parts_per_hour?.toFixed(0) ?? '—'}</dd></div><div><dt>{t('Consumed material')}</dt><dd>{run.summary.consumed_g.toFixed(2)} g</dd></div></dl>{run.issues.map(issue => <p className="inline-error" key={issue}>{t(issueLabels[issue] || issue)}</p>)}<button className="secondary full" onClick={() => { const url = URL.createObjectURL(new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `process-${run.id}.json`; a.click(); URL.revokeObjectURL(url); }}>{t('Download run')}</button><details><summary>{t('Model assumptions')}</summary><ul>{run.assumptions.map(s => <li key={s}>{s}</li>)}</ul></details></div>}
  </div>;
}
