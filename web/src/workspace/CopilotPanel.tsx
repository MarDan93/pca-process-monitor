import { useEffect, useRef, useState } from 'react';
import { LocalAI } from '../../../prototype/ai-client.js';
import { AI_MODEL, AI_MODEL_REVISION } from '../../../prototype/ai-contract.js';
import { api, type Commercial, type Project, type Source } from '../api';
import type { Scenario } from '../simulation/types';
import type {SystemScenario} from '../system/types';
import { ServerCopilotPanel } from './ServerCopilotPanel';
import type { Language } from '../i18n';
import { Icon } from '../ui/Icon';
type AIState = { status: string; messages: { role: string; content: string }[]; mode: string; progress: number | null; file: string; error: string; proposal: Record<string, Record<string, unknown>> | null; baseRevision: number | null };
type Props = {onSystemPreview?:(s:SystemScenario,id:string,source:Source)=>void; project: Project | null; t: (s: string) => string; language: Language; busy: boolean; onPreview: (patch: Partial<Commercial>, source: Source) => void; onError: (error: string) => void; onProcessPreview: (s: Scenario, source: Source) => void };
export function CopilotPanel(props: Props) {
  const [server, setServer] = useState<{ enabled: boolean; ready: boolean; model?: string } | null>(null);
  useEffect(() => { let active = true; api.assistantStatus().then(s => { if (active) setServer(s); }).catch(() => { if (active) setServer({ enabled: false, ready: false }); }); return () => { active = false; }; }, []);
  if (server === null) return <div className="help">{props.t('Connecting to workspace…')}</div>;
  return server.enabled ? <ServerCopilotPanel {...props} ready={server.ready} model={server.model ?? 'CPU'}/> : <BrowserCopilotPanel {...props}/>;
}
function BrowserCopilotPanel({ project, t, language, busy, onPreview, onError }: Props) {
  const client = useRef<LocalAI | null>(null);
  if (!client.current) client.current = new LocalAI(() => new Worker('/ai-worker.js'));
  const ai = client.current;
  const [state, setState] = useState<AIState>({ ...ai.state } as AIState);
  const [draft, setDraft] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const previousId = useRef(project?.id);
  useEffect(() => { const unsubscribe = ai.subscribe((value: AIState) => setState({ ...value, messages: [...value.messages] })); return () => { unsubscribe(); ai.cancel(); }; }, [ai]);
  useEffect(() => { if (previousId.current !== project?.id) { ai.clear(); setDraft(''); previousId.current = project?.id; } }, [project?.id, ai]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [state.messages.length, state.status]);
  function send() {
    if (!project) return;
    try {
      const c = project.commercial;
      const brief = { ...c, unit_cost_target_eur: c.currency === 'EUR' ? c.unit_cost_target : null, selling_price_eur: c.currency === 'EUR' ? c.selling_price : null, mould_budget_eur: c.currency === 'EUR' ? c.mould_budget : null };
      ai.send(draft, { brief, part: {}, geometry: {}, capabilities: 'Commercial updates only; geometry operations unavailable.' }, language, project.revision);
      setDraft('');
    } catch (error) { onError((error as Error).message); }
  }
  function preview() {
    if (!project || !state.proposal) return;
    try {
      if (state.baseRevision !== project.revision) throw new Error('The project changed after this AI request. Ask for a fresh proposal.');
      if (Object.entries(state.proposal).some(([key, values]) => key !== 'brief' && Object.keys(values).length)) throw new Error('This increment supports commercial updates only. Product and geometry changes are not executable yet.');
      const mapping: Record<string, string> = { unit_cost_target_eur: 'unit_cost_target', selling_price_eur: 'selling_price', mould_budget_eur: 'mould_budget' };
      const allowed = new Set(Object.keys(project.commercial));
      const patch: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(state.proposal.brief ?? {})) {
        const field = mapping[key] || key;
        if (!allowed.has(field)) throw new Error(`The proposed field ${key} is not supported by this commercial tool.`);
        if (mapping[key] && project.commercial.currency && project.commercial.currency !== 'EUR') throw new Error('This browser model proposes amounts in EUR only. Use the commercial properties for this currency.');
        if (mapping[key] && value !== null) patch.currency = 'EUR';
        patch[field] = value === 'unspecified' && key === 'commercial_unit' ? null : value;
      }
      onPreview(patch as Partial<Commercial>, { kind: 'ai', request: [...state.messages].reverse().find(m => m.role === 'user')?.content ?? '', model: AI_MODEL, model_revision: AI_MODEL_REVISION });
    } catch (error) { onError((error as Error).message); }
  }
  const active = ['loading', 'generating'].includes(state.status);
  return <><div className="panel-heading copilot-heading"><span className="heading-icon"><Icon name="spark" size={19}/></span><div><strong>{t('AI copilot')}</strong><small>Qwen 2.5 · 0.5B</small></div><span className={`status-dot ${state.status === 'ready' ? 'ready' : ''}`}/></div>
    <div className="copilot-scope"><span>{project?.name ?? t('No project selected')}</span><span>{project ? `r${project.revision}` : '—'}</span></div>
    <div className="ai-modes" role="group" aria-label={t('AI copilot')}>{['chat', 'changes'].map(mode => <button key={mode} className={state.mode === mode ? 'selected' : ''} disabled={active} onClick={() => { ai.state.mode = mode; ai.emit(); }}>{t(mode === 'chat' ? 'Conversation' : 'Propose changes')}</button>)}</div>
    <div className="chat-messages" aria-live="polite">
      {!state.messages.length && <div className="chat-welcome"><span className="ai-orb"><Icon name="spark" size={29}/></span><h2>{t('Your brief, in your own words.')}</h2><p>{t('Discuss your requirements or propose a commercial update. You review every change before it is saved.')}</p><div className="capability"><Icon name="check" size={14}/>{t('Commercial updates only in this increment.')}</div></div>}
      {state.messages.map((message, index) => <article key={index} className={`message ${message.role}`}><small>{message.role === 'user' ? project?.name : t('AI copilot')}</small><p>{message.content}</p></article>)}
      {active && <div className="ai-progress" role="status"><span className="spinner"/>{t(state.status === 'loading' ? 'Loading model…' : 'Thinking…')}{state.status === 'loading' && state.progress !== null && <span>{Math.round(state.progress)}%</span>}</div>}
      {state.error && <div className="inline-error"><p>{t('AI suggestions need your technical review.')}</p><details><summary>{t('Technical details')}</summary><p>{state.error}</p></details></div>}
      {state.proposal && <button className="proposal-button" id="preview-ai" disabled={busy} onClick={preview}><Icon name="eye" size={17}/>{t('Preview changes')}<Icon name="arrow" size={16}/></button>}
      <div ref={end}/>
    </div>
    {['idle', 'error'].includes(state.status) && <div className="model-loader"><button id="load-ai" className="secondary full" disabled={!project} onClick={() => ai.load()}><Icon name="spark" size={17}/>{t('Load AI model')}</button><small>{t('Browser inference · about 800 MB on first load.')}</small></div>}
    <form className="chat-composer" onSubmit={e => { e.preventDefault(); send(); }}><textarea id="chat-input" maxLength={2000} value={draft} placeholder={t('Describe the product, demand or commercial goals…')} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (state.status === 'ready' && draft.trim()) send(); } }} rows={3}/><div><span className="muted">{t(state.status === 'ready' ? 'Ready' : active ? state.status === 'loading' ? 'Loading model…' : 'Thinking…' : 'Model not loaded')}</span>{active ? <button type="button" className="secondary" onClick={() => ai.cancel()}>{t('Stop')}</button> : <button type="submit" id="send-ai" className="send-button" disabled={!project || state.status !== 'ready' || !draft.trim()} aria-label={t('Send message')}><Icon name="arrow" size={18}/></button>}</div></form><p className="ai-disclaimer">{t('AI suggestions need your technical review.')}</p>
  </>;
}
