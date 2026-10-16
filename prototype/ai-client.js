import { AI_MODEL, parseAIResponse, hasAIChanges } from './ai-contract.js';

export class LocalAI {
  constructor(workerFactory = () => {
    if (globalThis.__MOULD_AI_WORKER_SOURCE__) {
      const url = URL.createObjectURL(new Blob([globalThis.__MOULD_AI_WORKER_SOURCE__], { type: 'application/javascript' }));
      const worker = new Worker(url); URL.revokeObjectURL(url); return worker;
    }
    return new Worker(new URL('./ai-worker.js', document.baseURI), { type: 'module' });
  }) {
    this.workerFactory = workerFactory; this.worker = null; this.listeners = new Set();
    this.state = { status: 'idle', model: AI_MODEL, progress: null, file: '', error: '', messages: [], draft: '', mode: 'chat', requestMode: 'chat', proposal: null, baseRevision: null, raw: '' };
  }
  subscribe(callback) { this.listeners.add(callback); return () => this.listeners.delete(callback); }
  emit() { for (const listener of this.listeners) listener(this.state); }
  assetURL(name) {
    const value = globalThis.document?.querySelector(`meta[name="${name}"]`)?.content;
    return value ? new URL(value, document.baseURI).href : null;
  }
  load() {
    if (['loading', 'generating', 'ready'].includes(this.state.status)) return;
    try {
      this.worker?.terminate(); this.worker = this.workerFactory();
      const activeWorker = this.worker;
      this.worker.onmessage = ({ data }) => { if (this.worker === activeWorker) this.receive(data); };
      this.worker.onerror = (event) => { if (this.worker === activeWorker) this.fail(event.message || 'AI worker could not start.'); };
      Object.assign(this.state, { status: 'loading', error: '', progress: null, file: '' }); this.emit();
      this.worker.postMessage({ type: 'load', assets: {
        modelHost: this.assetURL('ai-model-host'),
        wasmBase: this.assetURL('ai-wasm-base'),
      } });
    } catch (error) { this.fail(error.message); }
  }
  send(text, context, language, baseRevision) {
    if (this.state.status !== 'ready') throw new Error('Load the AI model first.');
    if (typeof text !== 'string' || !text.trim() || text.length > 2000) throw new Error('Use a message of up to 2,000 characters.');
    this.state.draft = '';
    this.state.messages.push({ role: 'user', content: text.trim() });
    this.state.messages = this.state.messages.slice(-10);
    Object.assign(this.state, { status: 'generating', error: '', proposal: null, raw: '', baseRevision, requestMode: this.state.mode }); this.emit();
    this.worker.postMessage({ type: 'generate', messages: this.state.messages.slice(-4), context, language, mode: this.state.requestMode });
  }
  receive(data) {
    if (data.type === 'progress') { this.state.progress = data.progress; this.state.file = data.file; this.emit(); }
    else if (data.type === 'ready') { this.state.status = 'ready'; this.state.progress = 100; this.emit(); }
    else if (data.type === 'error') this.fail(data.message);
    else if (data.type === 'result') {
      let reply = data.text;
      if (this.state.requestMode === 'changes') {
      try { const result = parseAIResponse(data.text); reply = result.reply; this.state.proposal = hasAIChanges(result.changes) ? result.changes : null; }
      catch { this.state.error = 'No validated changes were returned. The answer is shown without modifying the project.'; }
      }
      this.state.raw = data.text; this.state.messages.push({ role: 'assistant', content: reply }); this.state.status = 'ready'; this.emit();
    }
  }
  fail(message) { this.worker?.terminate(); this.worker = null; this.state.status = 'error'; this.state.proposal = null; this.state.error = message; this.emit(); }
  cancel() {
    this.worker?.terminate(); this.worker = null;
    Object.assign(this.state, { status: 'idle', error: '', progress: null, proposal: null }); this.emit();
  }
  clear() { this.cancel(); this.state.messages = []; this.state.draft = ''; this.state.raw = ''; this.emit(); }
}

export const localAI = new LocalAI();
