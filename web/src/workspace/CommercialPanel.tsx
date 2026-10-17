import { useEffect, useState } from 'react';
import type { Commercial, Project } from '../api';
import { fieldLabels } from '../i18n';
import { Icon } from '../ui/Icon';
export function CommercialPanel({ project, t, busy, onPreview }: { project: Project; t: (s: string) => string; busy: boolean; onPreview: (patch: Partial<Commercial>) => void }) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  useEffect(() => { setDraft(Object.fromEntries(Object.entries(project.commercial).map(([key, value]) => [key, value === null ? '' : String(value)]))); }, [project.id, project.revision]);
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const patch: Record<string, string | number | null> = {};
    const numeric = ['annual_volume', 'lot_size', 'program_years'];
    for (const key of Object.keys(fieldLabels)) {
      const value = draft[key]?.trim() || '';
      const next = value === '' ? null : numeric.includes(key) ? Number(value) : value;
      if (next !== project.commercial[key as keyof Commercial]) patch[key] = next;
    }
    onPreview(patch as Partial<Commercial>);
  }
  function field(key: keyof Commercial, type = 'text') {
    return <label key={key} className={key === 'notes' ? 'field full' : 'field'}><span>{t(fieldLabels[key])}</span>{key === 'notes' ? <textarea id={`field-${key}`} rows={4} value={draft[key] ?? ''} onChange={e => setDraft({ ...draft, [key]: e.target.value })}/> : <input id={`field-${key}`} type={type} min={key === 'program_years' ? '0.01' : '0'} step={['annual_volume', 'lot_size'].includes(key) ? '1' : 'any'} maxLength={300} placeholder={t('Not specified')} value={draft[key] ?? ''} onChange={e => setDraft({ ...draft, [key]: e.target.value })}/>}</label>;
  }
  function select(key: keyof Commercial, options: [string, string][]) {
    return <label className="field"><span>{t(fieldLabels[key])}</span><select id={`field-${key}`} value={draft[key] ?? ''} onChange={e => setDraft({ ...draft, [key]: e.target.value })}><option value="">{t('Not specified')}</option>{options.map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}</select></label>;
  }
  return <form onSubmit={submit} className="commercial-form"><p className="eyebrow">01 / {t('Customer brief')}</p><h2>{t('Commercial requirements')}</h2><p className="help">{t('Define demand, market and commercial units before comparing manufacturing choices.')}</p>
    <div className="form-fields">{field('customer')}{field('reference')}{field('market')}{select('commercial_unit', [['part', 'Part'], ['kit', 'Kit'], ['assembly', 'Assembly']])}{field('annual_volume', 'number')}{field('lot_size', 'number')}{field('program_years', 'number')}{select('currency', ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'JPY'].map(value => [value, value]))}{field('unit_cost_target', 'number')}{field('selling_price', 'number')}{field('mould_budget', 'number')}{field('notes')}</div>
    <p className="help small">{t('Clear a field to mark it unknown. Zero is an explicit value.')}</p><button className="primary full" disabled={busy} type="submit" id="preview-manual"><Icon name="eye" size={17}/>{t('Preview changes')}</button>
  </form>;
}
