import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { api, type Commercial, type Preview, type Project, type ProjectSummary, type Revision, type Source } from '../api';
import { fieldLabels, initialLanguage, translate, type Language } from '../i18n';
import { parseMesh, type Concept } from '../geometry/import';
import { referenceFlange } from '../geometry/reference.js';
import { Icon } from '../ui/Icon';
import { CommercialPanel } from './CommercialPanel';
import { CopilotPanel } from './CopilotPanel';
import { SceneHost, type SceneControls } from './SceneHost';
import { ProcessPanel } from '../simulation/ProcessPanel';
import { ProcessView } from '../simulation/ProcessView';
import { LibraryPanel } from '../engineering/LibraryPanel';
import { LayoutPanel } from '../engineering/LayoutPanel';
import { LayoutView } from '../engineering/LayoutView';
import type { LayoutSpec } from '../engineering/types';
import '../engineering/engineering.css';
import { scenarioLabels, type ProcessRun, type Scenario } from '../simulation/types';

const modules = ['brief', 'product', 'mould', 'press', 'automation', 'material', 'process', 'quality', 'costs', 'reports'];
const labels = ['Customer brief', 'Product', 'Mould', 'Machine park', 'Automation', 'Materials', 'Process', 'Quality', 'Costs', 'Reports'];
function Dialog({ title, children, onClose, error, closeLabel }: { title: string; children: ReactNode; onClose: () => void; error: string; closeLabel: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = ref.current!; node.showModal(); return () => node.close(); }, []);
  return <dialog ref={ref} className="dialog" onCancel={e => { e.preventDefault(); onClose(); }} aria-labelledby="dialog-title"><div className="dialog-heading"><h2 id="dialog-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label={closeLabel}><Icon name="close"/></button></div>{error && <p className="inline-error" role="alert">{error}</p>}{children}</dialog>;
}
function Separator({ side, value, onChange, label }: { side: 'left' | 'right'; value: number; onChange: (n: number) => void; label: string }) {
  return <div className={`resize-handle ${side}`} role="separator" tabIndex={0} aria-label={label} aria-orientation="vertical" aria-valuemin={side === 'left' ? 250 : 300} aria-valuemax={side === 'left' ? 400 : 520} aria-valuenow={value} onKeyDown={e => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); onChange(value + (e.key === 'ArrowRight' ? 12 : -12) * (side === 'left' ? 1 : -1)); } }} onPointerDown={e => {
    e.preventDefault(); const start = e.clientX; const node = e.currentTarget; node.setPointerCapture(e.pointerId);
    const move = (event: PointerEvent) => onChange(value + (event.clientX - start) * (side === 'left' ? 1 : -1));
    const stop = () => { node.removeEventListener('pointermove', move); node.removeEventListener('pointerup', stop); node.removeEventListener('pointercancel', stop); };
    node.addEventListener('pointermove', move); node.addEventListener('pointerup', stop); node.addEventListener('pointercancel', stop);
  }}/ >;
}

export function WorkspaceShell({ hosted = false, onSignOut }: { hosted?: boolean; onSignOut?: () => void }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const t = (text: string) => translate(language, text);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [module, setModule] = useState('brief');
  const [concept, setConcept] = useState<Concept | null>(null);
  const [processRun, setProcessRun] = useState<ProcessRun | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [properties, setProperties] = useState(() => window.innerWidth > 950);
  const [copilot, setCopilot] = useState(() => window.innerWidth > 650);
  const [leftWidth, setLeftWidth] = useState(288);
  const [rightWidth, setRightWidth] = useState(348);
  const [wire, setWire] = useState(false);
  const [transparent, setTransparent] = useState(false);
  const [grid, setGrid] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [history, setHistory] = useState<Revision[]>([]);
  const [newProject, setNewProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [importDialog, setImportDialog] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [units, setUnits] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [lastOperation, setLastOperation] = useState<{ project: string; id: string; revision: number } | null>(null);
  const scene = useRef<SceneControls>(null);
  const layoutScene = useRef<{view:(v:string)=>void}>(null), processScene = useRef<{view:(v:string)=>void}>(null);
  const loadSequence = useRef(0);
  useEffect(() => {
    let active = true; setProcessRun(null);
    if (project) api.latestRun(project).then(value => { if (active) setProcessRun(value); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [project?.id]);

  useEffect(() => {
    document.documentElement.lang = language;
    try { localStorage.setItem('mould-studio-language', language); } catch { /* Preference only. */ }
  }, [language]);
  async function openProject(id: string) {
    const sequence = ++loadSequence.current;
    setBusy(true); setError('');
    try {
      const next = await api.get(id);
      let geometry = null;
      if (next.asset) geometry = await parseMesh(await api.asset(next), next.asset.name, next.asset.source_units);
      if (sequence !== loadSequence.current) return;
      setProject(next); setConcept(geometry); setSelection(null); setPreview(null); setLastOperation(null); setHistory([]);
      try { localStorage.setItem('mould-workspace-project', next.id); } catch { /* Preference only. */ }
    } catch (e) { if (sequence === loadSequence.current) setError((e as Error).message); }
    finally { if (sequence === loadSequence.current) setBusy(false); }
  }
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const session = await api.session();
        if (!active) return;
        if (session.ai_assets_local) {
          for (const [name, content] of [['ai-model-host', '/ai-assets/'], ['ai-wasm-base', '/ai-runtime/']]) {
            const meta = document.createElement('meta'); meta.name = name; meta.content = content; document.head.append(meta);
          }
        }
        const list = await api.list();
        if (!active) return;
        setProjects(list);
        let saved = ''; try { saved = localStorage.getItem('mould-workspace-project') || ''; } catch { /* Optional. */ }
        if (list.length) await openProject(list.find(p => p.id === saved)?.id ?? list[0].id);
      } catch (e) { if (active) setError((e as Error).message); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!project) { setHistory([]); return; }
    let active = true;
    api.history(project.id).then(value => { if (active) setHistory(value); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [project?.id, project?.revision]);
  async function run(action: () => Promise<void>) {
    setBusy(true); setError('');
    try { await action(); } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  async function createProject(event: React.FormEvent) {
    event.preventDefault();
    await run(async () => {
      const next = await api.create(projectName.trim());
      setProjects(await api.list()); setProject(next); setConcept(null); setSelection(null); setLastOperation(null); setHistory([]); setModule('brief'); setNewProject(false); setProjectName('');
      try { localStorage.setItem('mould-workspace-project', next.id); } catch { /* Preference only. */ }
    });
  }
  async function propose(patch: Partial<Commercial>, source: Source = { kind: 'manual' }) {
    if (!project) return;
    await run(async () => setPreview(await api.preview(project, patch, source)));
  }
  async function apply() {
    if (!preview || !project) return;
    await run(async () => {
      const next = await api.execute(preview, `apply-${preview.id}`);
      setProject(next); setLastOperation({ project: next.id, id: preview.id, revision: next.revision }); setPreview(null); setProjects(await api.list());
    });
  }
  async function proposeProcess(changes: Scenario, source: Source) {
    if (!project) return;
    setModule('process');
    await run(async () => setPreview(await api.previewProcess(project, changes, source)));
  }
  async function proposeLayout(changes: LayoutSpec) {
    if (!project) return;
    await run(async () => setPreview(await api.previewLayout(project, changes)));
  }
  async function simulateProcess() {
    if (!project) return;
    await run(async () => { setProcessRun(await api.runProcess(project)); setModule('process'); });
  }
  async function undo() {
    if (!project || !effectiveUndo) return;
    await run(async () => { const next = await api.undo(project, effectiveUndo.id, `undo-${effectiveUndo.id}`); setProject(next); setLastOperation(null); });
  }
  async function importFile(incoming: File, declaredUnits: string, synthetic = false) {
    if (!project) return;
    await run(async () => {
      const geometry = await parseMesh(await incoming.arrayBuffer(), incoming.name, declaredUnits);
      const next = await api.importAsset(project, incoming, declaredUnits, synthetic ? 'synthetic_reference' : 'user');
      setProject(next); setConcept(geometry); setSelection(null); setLastOperation(null); setImportDialog(false); setFile(null); setUnits(''); setModule('product');
    });
  }
  const overlay = module === 'mould' && project?.engineering && project.engineering.asset_id === project.asset?.id || module === 'process' && !!processRun;
  function view(value: string) {
    if (module === 'mould' && overlay) layoutScene.current?.view(value);
    else if (module === 'process' && processRun) processScene.current?.view(value);
    else scene.current?.view(value);
  }
  function ribbonButton(label: string, icon: string, action: () => void, enabled = true, pressed?: boolean) {
    return <button className={`ribbon-button ${pressed ? 'active' : ''}`} disabled={!enabled || busy} onClick={action} title={t(label)} aria-pressed={pressed} aria-label={t(label)}><Icon name={icon} size={24}/><span>{t(label)}</span></button>;
  }
  const dimensions = concept?.dimensions_mm;
  const currentLabel = labels[modules.indexOf(module)];
  const latest = history[0];
  const durableUndo = project && latest?.revision === project.revision && ['update_commercial_requirements', 'configure_process', 'configure_engineering'].includes(latest.source.tool ?? '') && latest.source.operation_id ? { project: project.id, revision: latest.revision, id: latest.source.operation_id } : null;
  const effectiveUndo = lastOperation?.project === project?.id && lastOperation?.revision === project?.revision ? lastOperation : durableUndo;
  const canUndo = !!effectiveUndo;
  const style = { '--properties-width': `${leftWidth}px`, '--copilot-width': `${rightWidth}px` } as CSSProperties;
  const amount = (value: unknown) => value === null || value === undefined ? t('Not specified') : typeof value === 'number' ? new Intl.NumberFormat(language, { maximumFractionDigits: 8 }).format(value) : typeof value === 'string' ? t(value) : JSON.stringify(value);
  const effects = preview?.effects.flatMap(effect => !['process', 'engineering'].includes(effect.field) ? [effect] : Object.entries((effect.after ?? {}) as Record<string, unknown>).filter(([k, v]) => v !== (effect.before as Record<string, unknown> | null)?.[k]).map(([k, v]) => ({ field: k, before: (effect.before as Record<string, unknown> | null)?.[k] ?? null, after: v }))) ?? [];
  return <div className={`workspace ${properties ? '' : 'properties-collapsed'} ${copilot ? '' : 'copilot-collapsed'}`} style={style}>
    <header className="app-header"><div className="brand"><span className="brand-mark"><Icon name="mould" size={22}/></span><strong>MOULD<span>STUDIO</span></strong><span className="app-tag">WORKSPACE</span></div><div className="project-switcher"><Icon name="folder" size={16}/><select id="project-switcher" aria-label={t('Open project')} value={project?.id ?? ''} onChange={e => { void openProject(e.target.value); }} disabled={busy || loading}><option value="" disabled>{t('No project selected')}</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>{project && <span className="revision-tag">r{project.revision}</span>}</div><button className="new-project" onClick={() => setNewProject(true)} disabled={busy || loading}><Icon name="plus" size={16}/>{t('New project')}</button><div className="header-spacer"/>{hosted && <button id="sign-out" className="new-project" onClick={onSignOut}>{t('Sign out')}</button>}<span className="local-tag"><i/>{t(hosted ? 'Online workspace' : 'Local development')}</span><select className="language-picker" aria-label="Language" value={language} onChange={e => setLanguage(e.target.value as Language)}><option value="en">English</option><option value="it">Italiano</option><option value="fr">Français</option><option value="es">Español</option></select></header>
    <div className="document-bar"><span className="document-tab"><Icon name="product" size={15}/>{project?.name ?? t('Engineering workspace')}<i/></span><span className="document-meta">{t('Engineering workspace')} <span>/</span> {t(currentLabel)}</span><div className="header-spacer"/><button className="icon-button" aria-pressed={properties} aria-label={t('Toggle properties')} title={t('Toggle properties')} onClick={() => setProperties(!properties)}><Icon name="panel" size={18}/></button><button className="icon-button copilot-toggle" aria-pressed={copilot} aria-label={t('Toggle copilot')} title={t('Toggle copilot')} onClick={() => setCopilot(!copilot)}><Icon name="chat" size={18}/></button></div>
    <div className="command-area"><div className="workflow-breadcrumb" aria-label={t('Workflow')}><span>{t('Customer brief')}</span><i>›</i><span>{t('Product')}</span><i>›</i><span>{t('Mould')}</span><i>›</i><span>{t('Machine park')}</span><i>›</i><span>{t('Process')}</span><strong>{t(currentLabel)}</strong></div><div className="ribbon"><div className="ribbon-group">{ribbonButton('Import mesh', 'import', () => setImportDialog(true), !!project)}{ribbonButton('Reference flange', 'product', () => { void importFile(referenceFlange(), 'mm', true); }, !!project)}<small>{t('Geometry')}</small></div><div className="ribbon-group">{ribbonButton('Fit view', 'fit', () => view('iso'))}{ribbonButton('Isometric', 'product', () => view('iso'))}{ribbonButton('Top', 'panel', () => view('front'))}{ribbonButton('Side', 'panel', () => view('side'))}<small>{t('View')}</small></div><div className="ribbon-group">{ribbonButton('Wireframe', 'wire', () => setWire(!wire), !overlay, wire)}{ribbonButton('Transparency', 'eye', () => setTransparent(!transparent), !overlay, transparent)}{ribbonButton('Grid', 'grid', () => setGrid(!grid), !overlay, grid)}<small>{t('Display')}</small></div><div className="ribbon-group compact">{ribbonButton('Undo last change', 'undo', () => { void undo(); }, canUndo)}{ribbonButton('History', 'history', () => setDrawer(!drawer), !!project, drawer)}<small>{t('History')}</small></div><div className="ribbon-filler"/><div className="ribbon-status"><Icon name="save" size={16}/><span>{t('Saved to workspace')}<small>{project ? `${t('Revision')} ${project.revision}` : '—'}</small></span></div></div></div>
    {error && !newProject && !importDialog && !preview && <div className="error-banner" role="alert"><span>{error}</span><button className="icon-button" aria-label={t('Close')} onClick={() => setError('')}><Icon name="close" size={16}/></button></div>}
    <div className="work-area"><nav className="module-rail" aria-label="Modules">{modules.map((key, index) => <button id={`module-${key}`} key={key} className={module === key ? 'active' : ''} aria-current={module === key ? 'page' : undefined} aria-label={t(labels[index])} title={t(labels[index])} onClick={() => setModule(key)}><Icon name={key} size={22}/><span>{t(labels[index])}</span></button>)}<span className="rail-bottom">MS<span>0.3</span></span></nav>
      <aside className="properties-panel" aria-label={t('Properties')}><div className="panel-heading"><Icon name={module} size={18}/><strong>{t(currentLabel)}</strong><span className="panel-index">{String(modules.indexOf(module) + 1).padStart(2, '0')}</span></div>
        <div className="project-tree"><div className="tree-caption">{t('Project structure')}</div><div className="tree-root"><Icon name="folder" size={15}/><strong>{project?.name ?? '—'}</strong></div><button className={module === 'brief' ? 'tree-row active' : 'tree-row'} onClick={() => setModule('brief')}><Icon name="brief" size={15}/>{t('Customer brief')}<span className={`tree-state ${project && Object.values(project.commercial).some(v => v !== null) ? 'set' : ''}`}/></button><button className={module === 'product' ? 'tree-row active' : 'tree-row'} onClick={() => setModule('product')}><Icon name="product" size={15}/>{project?.asset?.name ?? t('Product')}<span className={`tree-state ${concept ? 'set' : ''}`}/></button></div>
        <div className="properties-scroll">{project ? <><div hidden={module !== 'brief'}><CommercialPanel project={project} t={t} busy={busy} onPreview={patch => { void propose(patch); }}/></div><div hidden={module !== 'product'} className="product-properties"><p className="eyebrow">02 / {t('Product')}</p><h2>{t('Geometry')}</h2><p className="help">{t('Original bytes and units are retained. Bounds describe the mesh, not a solid volume.')}</p><button className="secondary full" disabled={busy} onClick={() => setImportDialog(true)}><Icon name="import" size={16}/>{t('Import mesh')}</button>{project.asset && <><div className="asset-card"><Icon name="product" size={25}/><strong>{project.asset.name}</strong><span>{project.asset.source_units} · {(project.asset.size_bytes / 1024).toFixed(1)} KiB</span>{project.asset.source === 'synthetic_reference' && <span className="badge amber">{t('Synthetic reference')}</span>}</div><p className="section-label">{t('Mesh bounds (mm)')}</p><div className="dimension-grid">{['length', 'width', 'height'].map((key, i) => <div key={key}><small>{['X', 'Y', 'Z'][i]}</small><strong>{dimensions ? dimensions[key as keyof typeof dimensions].toFixed(2) : '—'}</strong></div>)}</div><p className="section-label">{t('Mesh components')}</p>{concept?.components.map(component => <button className={`component-row ${selection === component.name ? 'selected' : ''}`} key={component.name} onClick={() => scene.current?.select(component.name)}><Icon name="product" size={15}/>{component.name}</button>)}<a className="text-link" download={project.asset.name} href={`/api/projects/${project.id}/assets/${project.asset.id}`}><Icon name="download" size={15}/>{t('Download original')}</a><details className="asset-details"><summary>SHA-256</summary><code>{project.asset.sha256}</code></details></>}{!project.asset && <p className="help">{t('No geometry yet')}</p>}</div>{module === 'process' && <ProcessPanel project={project} run={processRun} t={t} busy={busy} onPreview={(s, source) => { void proposeProcess(s, source); }} onRun={() => { void simulateProcess(); }} onError={setError}/>}{module === 'mould' && <LayoutPanel project={project} t={t} busy={busy} onPreview={s=>{void proposeLayout(s);}} onError={setError}/>} {module === 'press' && <LibraryPanel kind="machine" t={t} onError={setError}/>} {module === 'material' && <LibraryPanel kind="material" t={t} onError={setError}/>} {!['brief', 'product', 'process', 'mould', 'press', 'material'].includes(module) && <div className="planned-panel"><span className="badge amber">{t('Planned module')}</span><Icon name={module} size={42}/><h2>{t(currentLabel)}</h2><p>{t('The 3D scene stays available. This module’s engine is on the roadmap.')}</p><ol className="module-roadmap"><li><b>I02</b>{t('Cavity layouts and preliminary press checks')}</li><li><b>I03</b>{t('Resources, material flow and cell movements')}</li><li><b>I04</b>{t('Shared-clock playback and production costs')}</li><li><b>I07</b>{t('Measured data, PCA and PLS validation')}</li></ol></div>}</> : <div className="properties-empty"><Icon name="brief" size={32}/><p>{t('Start with your customer’s requirements.')}</p><button className="secondary full" disabled={loading} onClick={() => setNewProject(true)}>{t('New project')}</button></div>}</div>
      </aside><Separator side="left" value={leftWidth} onChange={n => setLeftWidth(Math.max(250, Math.min(400, n)))} label={t('Resize properties')}/>
      <main className="scene-column"><div className="viewport-header"><span><i className="live-dot"/>{t(currentLabel)} <span className="muted">/ {t(module === 'mould' ? 'Preliminary layout' : module === 'process' ? 'Process simulation' : 'Geometry')}</span></span><span className="viewport-badges">{project?.asset?.source === 'synthetic_reference' && <span className="badge amber">{t('Synthetic reference')}</span>}<span className="badge">{concept ? 'MESH' : '3D'} · mm</span></span></div><div className="viewport"><SceneHost ref={scene} concept={concept} wire={wire} transparent={transparent} grid={grid} onSelection={setSelection} onError={setError}/>
        {module === 'process' && !processRun && <div className="scene-empty"><span className="empty-cube"><Icon name="process" size={48}/></span><h1>{t('Granule to conveyor')}</h1><p>{t('Load a synthetic example in Properties, review it, approve and run.')}</p><button className="secondary" onClick={() => setProperties(true)}>{t('Properties')}</button></div>}{module !== 'process' && !concept && <div className="scene-empty"><span className="empty-cube"><Icon name={project ? 'product' : 'mould'} size={48}/></span><p className="eyebrow">MOULD STUDIO</p><h1>{t(project ? 'No geometry yet' : 'Any product. One connected workspace.')}</h1><p>{t(project ? 'Import your product or explore an original reference mesh.' : 'Create a project, define the business case and bring in your geometry.')}</p><div>{project ? <><button className="primary" disabled={busy} onClick={() => setImportDialog(true)}><Icon name="import" size={17}/>{t('Import mesh')}</button><button className="secondary" disabled={busy} onClick={() => { void importFile(referenceFlange(), 'mm', true); }}>{t('Reference flange')}</button></> : <button className="primary" disabled={loading || busy} onClick={() => setNewProject(true)}><Icon name="plus" size={18}/>{t('New project')}</button>}</div>{project && <small>{t('STEP support is planned with the CAD kernel.')}</small>}</div>}
        {project?.engineering && concept && project.engineering.asset_id === project.asset?.id && <LayoutView controlsRef={layoutScene} layout={project.engineering} concept={concept} active={module === 'mould'} t={t}/>}
        {processRun && <ProcessView controlsRef={processScene} run={processRun} concept={processRun.asset?.id === project?.asset?.id ? concept : null} active={module === 'process'} stale={processRun.project_revision !== project?.revision} t={t}/>}<div className="view-cube"><button onClick={() => view('front')} title={t('Top')}>Z</button><div><button onClick={() => view('side')} title={t('Side')}>X</button><button onClick={() => view('iso')} title={t('Isometric')}>3D</button></div></div><div className="axis-triad" aria-label="World axes"><span className="z">Z</span><span className="y">Y</span><span className="x">X</span></div><div className="viewport-footnote">{t('Not an engineering validation')}</div><div className="viewport-tools"><button title={t('Fit view')} aria-label={t('Fit view')} onClick={() => view('iso')}><Icon name="fit" size={18}/></button><button title={t('Grid')} aria-label={t('Grid')} aria-pressed={grid} disabled={!!overlay} onClick={() => setGrid(!grid)}><Icon name="grid" size={18}/></button><button title={t('Wireframe')} aria-label={t('Wireframe')} aria-pressed={wire} disabled={!!overlay} onClick={() => setWire(!wire)}><Icon name="wire" size={18}/></button></div>
      </div><div className="selection-bar"><span><Icon name="product" size={14}/>{selection ?? t('No selection')}</span><span>{concept?.triangle_count?.toLocaleString(language) ?? '—'} △</span></div>
        <div className={`results-drawer ${drawer ? 'expanded' : ''}`}><div className="drawer-toolbar"><button className={drawer ? 'selected' : ''} onClick={() => setDrawer(!drawer)}><Icon name="history" size={16}/>{t('Revisions')}{project && <span>{project.revision + 1}</span>}</button><div className="header-spacer"/><button className="icon-button" disabled={!processRun} onClick={() => setModule('process')} title={t(processRun ? 'Process simulation' : 'No simulation run')} aria-label={t(processRun ? 'Process simulation' : 'No simulation run')}><Icon name="play" size={16}/></button><span className="muted">{processRun ? `${t('Process')} · r${processRun.project_revision}` : t('No simulation run')}</span></div>{drawer && <div className="revision-list">{history.map(revision => <div key={revision.revision}><span className="revision-number">r{revision.revision}</span><span>{t(revision.source.kind)}<small>{revision.source.model || revision.source.tool || ''}</small></span><time>{new Date(revision.created_at * 1000).toLocaleTimeString(language)}</time></div>)}</div>}</div>
      </main><Separator side="right" value={rightWidth} onChange={n => setRightWidth(Math.max(300, Math.min(520, n)))} label={t('Resize copilot')}/><aside className="copilot-panel" aria-label={t('AI copilot')}><CopilotPanel project={project} t={t} language={language} busy={busy} onPreview={(patch, source) => { void propose(patch, source); }} onProcessPreview={(s, source) => { void proposeProcess(s, source); }} onError={setError}/></aside>
    </div><footer className="status-bar"><span><i className={busy || loading ? 'busy-dot' : 'saved-dot'}/>{t(loading ? 'Connecting to workspace…' : 'Saved to workspace')}{project && ` · r${project.revision}`}</span><span className="status-selection">{t('Select a mesh component in the scene.')}</span><span>{t(hosted ? 'Server storage' : 'Local development')}</span></footer>
    {newProject && <Dialog error={error} closeLabel={t('Close')} title={t('New project')} onClose={() => { if (!busy) setNewProject(false); }}><form onSubmit={createProject}><label className="field"><span>{t('Project name')}</span><input id="new-project-name" autoFocus value={projectName} onChange={e => setProjectName(e.target.value)} required maxLength={120}/></label><p className="help">{t('Start with your customer’s requirements.')}</p><div className="dialog-actions"><button type="button" className="secondary" disabled={busy} onClick={() => setNewProject(false)}>{t('Cancel')}</button><button type="submit" id="create-project" className="primary" disabled={busy || !projectName.trim()}>{t('Create project')}</button></div></form></Dialog>}
    {importDialog && <Dialog error={error} closeLabel={t('Close')} title={t('Import mesh')} onClose={() => { if (!busy) setImportDialog(false); }}><p className="help">{t('OBJ / STL · up to 12 MiB')}</p><p className="help">{t('STEP support is planned with the CAD kernel.')}</p><form onSubmit={e => { e.preventDefault(); if (file && units) void importFile(file, units); }}><label className="file-drop"><Icon name="import" size={32}/><span>{file?.name || t('Choose file')}</span><input id="mesh-file" type="file" accept=".obj,.stl" required onChange={e => setFile(e.target.files?.[0] ?? null)}/></label><label className="field"><span>{t('Original file units')}</span><select id="mesh-units" required value={units} onChange={e => setUnits(e.target.value)}><option value="">{t('Choose units')}</option>{['mm', 'cm', 'm', 'in'].map(unit => <option key={unit}>{unit}</option>)}</select></label><p className="help small">{t('Original bytes and units are retained. Bounds describe the mesh, not a solid volume.')}</p><div className="dialog-actions"><button type="button" className="secondary" disabled={busy} onClick={() => setImportDialog(false)}>{t('Cancel')}</button><button type="submit" className="primary" id="confirm-import" disabled={busy || !file || !units}>{t('Import and save')}</button></div></form></Dialog>}
    {preview && <Dialog error={error} closeLabel={t('Close')} title={t('Review changes')} onClose={() => { if (!busy) setPreview(null); }}><p className="preview-context">{project?.name} <span>r{preview.base_revision}</span><span className="badge">{t('Source')}: {t(preview.source.kind)}</span></p><div className="effect-list">{effects.map(effect => <div key={effect.field}><strong>{t(fieldLabels[effect.field] || scenarioLabels[effect.field] || effect.field)}</strong><div><span><small>{t('Before')}</small>{amount(effect.before)}</span><Icon name="arrow" size={16}/><span className="effect-after"><small>{t('After')}</small>{amount(effect.after)}</span></div></div>)}</div><p className="help small">{t('AI suggestions need your technical review.')}</p><div className="dialog-actions"><button className="secondary" disabled={busy} onClick={() => setPreview(null)}>{t('Discard')}</button><button id="approve-operation" className="primary" disabled={busy} onClick={() => { void apply(); }}><Icon name="check" size={17}/>{t('Approve and apply')}</button></div></Dialog>}
  </div>;
}
