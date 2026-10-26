import { useEffect, useRef, useState } from 'react';
import { api, type Commercial, type Project, type Source } from '../api';
import type { Language } from '../i18n';
import { Icon } from '../ui/Icon';
import type {SystemScenario} from '../system/types';
import type { AssistantReply, Scenario } from '../simulation/types';

export function ServerCopilotPanel({ project, language, t, busy, onPreview, onProcessPreview, ready, model,onSystemPreview }: {onSystemPreview?:(s:SystemScenario,id:string,source:Source)=>void; project: Project | null; language: Language; t: (s: string) => string; busy: boolean; onPreview: (patch: Partial<Commercial>, source: Source) => void; onProcessPreview: (s: Scenario, source: Source) => void; ready: boolean; model: string }) {
  const [scenarioId,setScenarioId]=useState('');
  useEffect(()=>setScenarioId(old=>project?.production_system?.scenarios.some(s=>s.id===old)?old:project?.production_system?.scenarios[0]?.id??''),[project?.id,project?.production_system]);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]), [draft, setDraft] = useState(''), [mode, setMode] = useState('chat');
  const [answer, setAnswer] = useState<AssistantReply | null>(null), [working, setWorking] = useState(false), [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null), generation = useRef(0), currentId = useRef(project?.id);
  useEffect(() => { currentId.current = project?.id; generation.current++; controller.current?.abort(); setWorking(false); setMessages([]); setAnswer(null); setDraft(''); setError(''); }, [project?.id]);
  useEffect(() => () => { generation.current++; controller.current?.abort(); }, []);
  async function send() {
    if (!project || !draft.trim() || working) return;
    const id = ++generation.current, message = draft.trim(); controller.current = new AbortController();
    setDraft(''); setWorking(true); setError(''); setAnswer(null); setMessages(old => [...old.slice(-8), { role: 'user', content: message }]);
    try {
      const result = await api.assistant(project, message, mode, language, controller.current.signal, messages,mode==='system'?scenarioId:undefined);
      if (id !== generation.current || currentId.current !== project.id) return;
      setAnswer(result); setMessages(old => [...old, { role: 'assistant', content: result.reply }]);
      if (result.validation_error) setError(result.validation_error);
    } catch (e) { if (id === generation.current && (e as Error).name !== 'AbortError') setError((e as Error).message); }
    finally { if (id === generation.current) setWorking(false); }
  }
  function preview() {
    if (!answer || !project) return;
    if (answer.base_revision !== project.revision) { setError(t('The project changed. Ask for a fresh proposal.')); return; }
    if(answer.system&&answer.scenario_id)onSystemPreview?.(answer.system,answer.scenario_id,answer.source);
    else if (answer.process) onProcessPreview(answer.process, answer.source);
    else if (answer.commercial) onPreview(answer.commercial as Partial<Commercial>, answer.source);
  }
  return <><div className="panel-heading copilot-heading"><Icon name="spark" size={20}/><div><strong>{t('AI copilot')}</strong><small>{model.split('/').at(-1)}</small></div><span className={`status-dot ${ready ? 'ready' : ''}`}/></div>
    <div className="server-ai-tag">{t('Server CPU inference · no model download on your PC')}</div><div className="copilot-scope"><span>{project?.name ?? t('No project selected')}</span><span>{project ? `r${project.revision}` : '—'}</span></div>
    <div className="server-ai-modes">{[['chat', 'Conversation'], ['commercial', 'Customer brief'], ['process', 'Legacy cycle'], ['system','System settings']].map(([key, label]) => <button key={key} className={mode === key ? 'selected' : ''} disabled={working} onClick={() => { setMode(key); setAnswer(null); }}>{t(label)}</button>)}</div>
    {mode==='system'&&<label className="ai-scenario-select field"><span>{t("Scenario to modify")}</span><select id="ai-system-scenario" value={scenarioId} onChange={e=>setScenarioId(e.target.value)}>{project?.production_system?.scenarios.map(s=><option key={s.id} value={s.id}>{s.configuration.name}</option>)}</select></label>}
    <div className="chat-messages" aria-live="polite">{!messages.length && <div className="chat-welcome"><span className="ai-orb"><Icon name="spark" size={29}/></span><h2>{t('Plan your next engineering step.')}</h2><p>{t('Use System settings to propose explicit fields for a selected scenario. Review and approve every change.')}</p><p className="server-ai-mode-note">{t('AI selects workflow steps. Advice uses checked templates; no generated specifications or prices.')}</p></div>}{messages.map((m, i) => <article key={i} className={`message ${m.role}`}><small>{t(m.role === 'user' ? 'Request' : 'AI copilot')}</small><p>{m.content}</p></article>)}
      {answer?.response_mode === 'guided_workflow' && <p className="server-ai-mode-note">{t('Guided response: the model routing could not be validated.')}</p>}{working && <div className="ai-progress"><span className="spinner"/>{t('Thinking…')}</div>}{error && <p className="inline-error">{error}</p>}{answer && (answer.process || answer.commercial || answer.system) && <button className="proposal-button" id="preview-ai" disabled={busy || working} onClick={preview}><Icon name="eye" size={16}/>{t('Preview changes')}</button>}
      {!ready && <p className="inline-error">{t('Server AI is not ready. Finish the Codespaces setup with AI enabled.')}</p>}
    </div>
    <div className="server-ai-example"><button id="ai-process-example" disabled={(!project?.process&&!project?.production_system?.scenarios.length)||working} onClick={()=>{setMode(project?.production_system?'system':'process');setAnswer(null);setDraft(project?.production_system?'Set container_change_s to 5 seconds and parts_per_container to 24.':'Set cooling_s to 12 seconds and cycles to 3.');}}>{t(project?.production_system?'Try: container change 5 s, 24 parts/box':'Try: cooling 12 s, three cycles')}</button></div>
    <form className="chat-composer" onSubmit={e => { e.preventDefault(); void send(); }}><textarea id="chat-input" maxLength={2000} value={draft} placeholder={t('Describe the product, demand or commercial goals…')} onChange={e => setDraft(e.target.value)} rows={3}/><div><span className="muted">{t(working ? 'Thinking…' : ready ? 'Ready' : 'Model not loaded')}</span>{working ? <button type="button" className="secondary" onClick={() => { generation.current++; controller.current?.abort(); setWorking(false); }}>{t('Stop')}</button> : <button id="send-ai" type="submit" className="send-button" disabled={!project || !ready || !draft.trim()} aria-label={t('Send message')}><Icon name="arrow" size={18}/></button>}</div></form><p className="ai-disclaimer">{t('AI suggestions need your technical review.')}</p></>;
}
