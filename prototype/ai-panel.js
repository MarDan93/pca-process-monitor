import { localAI } from './ai-client.js';
import { formatNumber, t } from './i18n.js';
const labels = { project_name: 'Project name', customer: 'Customer', reference: 'Part / enquiry reference', market: 'Target market', commercial_unit: 'Commercial unit', annual_volume: 'Annual demand', lot_size: 'Batch size', program_years: 'Programme duration', unit_cost_target_eur: 'Target manufacturing cost', selling_price_eur: 'Selling price', mould_budget_eur: 'Mould budget', notes: 'Customer request and constraints', name: 'Part name', application: 'Application', material: 'Material', material_grade: 'Material grade', length_mm: 'Length', width_mm: 'Width', height_mm: 'Height', wall_mm: 'Preview wall', corner_radius_mm: 'Radius' };
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function renderAIPanel() {
  return `<section id="ai-panel" class="ai-panel" aria-label="AI assistant"><div class="ai-panel-header"><span class="ai-spark" aria-hidden="true">✧</span><div><strong>AI assistant</strong><small>Qwen2.5 · 0.5B · local inference</small></div><span id="ai-status" class="ai-status">Not loaded</span></div><p class="ai-intro">Discuss customer requirements or ask for a supported model change.</p><div class="ai-loader"><button type="button" class="button primary" id="ai-load">Load AI model</button><button type="button" class="button secondary" id="ai-cancel" hidden>Stop</button><progress id="ai-progress" max="100" hidden aria-label="AI model download progress"></progress><p class="source-help" id="ai-progress-text">First use downloads several hundred MB of open model files. No API key or account is required.</p></div><div id="ai-chat-log" class="ai-chat-log" role="log" aria-label="AI conversation"></div><form id="ai-chat-form"><label for="ai-mode">Assistant mode</label><select id="ai-mode"><option value="chat" ${localAI.state.mode === 'chat' ? 'selected' : ''}>Conversation</option><option value="changes" ${localAI.state.mode === 'changes' ? 'selected' : ''}>Propose changes</option></select><label class="visually-hidden" for="ai-message">Message to the AI assistant</label><textarea id="ai-message" maxlength="2000" rows="3" placeholder="The customer needs 80,000 brackets per year for appliances. What information is missing?">${esc(localAI.state.draft)}</textarea><div class="ai-send-row"><span>Processed on your device</span><button class="button primary compact" id="ai-send" type="submit" disabled>Send</button></div></form><p id="ai-error" class="ai-error" role="status" hidden></p><details id="ai-technical-error" hidden><summary>Technical details</summary><pre id="ai-error-details" data-user-content></pre></details><div id="ai-change-proposal" aria-live="polite"></div><p class="ai-scope">Small local model: review its answers. It cannot run mould or process simulations.</p></section>`;
}

export function updateAIPanel() {
  if (!document.getElementById('ai-panel')) return;
  const state = localAI.state, busy = ['loading', 'generating'].includes(state.status);
  const statusLabels = { idle: 'Not loaded', loading: 'Loading', ready: 'Ready', generating: 'Thinking', error: 'Unavailable' };
  document.getElementById('ai-status').textContent = t(statusLabels[state.status]);
  document.getElementById('ai-load').hidden = busy || state.status === 'ready';
  document.getElementById('ai-cancel').hidden = !busy;
  document.getElementById('ai-mode').disabled = busy;
  document.getElementById('ai-send').disabled = state.status !== 'ready';
  const progress = document.getElementById('ai-progress'); progress.hidden = state.status !== 'loading';
  if (typeof state.progress === 'number') progress.value = state.progress; else progress.removeAttribute('value');
  document.getElementById('ai-progress-text').textContent = state.status === 'loading' ? `${t('Downloading or initialising the model…')} ${state.file} ${state.progress == null ? '' : formatNumber(state.progress) + '%'}` : state.status === 'ready' ? t('AI ready. Model inference runs on this device.') : t('First use downloads several hundred MB of open model files. No API key or account is required.');
  const log = document.getElementById('ai-chat-log');
  log.innerHTML = state.messages.map((message) => `<div class="ai-message ${message.role}"><span>${t(message.role === 'user' ? 'You' : 'Assistant')}</span><p data-user-content>${esc(message.content)}</p></div>`).join('');
  log.scrollTop = log.scrollHeight;
  const error = document.getElementById('ai-error'), technical = document.getElementById('ai-technical-error');
  error.hidden = !state.error; error.textContent = state.error ? t(state.status === 'error' ? 'AI could not run. Check internet access to model files, browser memory and WebAssembly support, then retry.' : state.error) : '';
  technical.hidden = !state.error; document.getElementById('ai-error-details').textContent = state.error;
  document.getElementById('ai-change-proposal').innerHTML = state.proposal ? `<div class="command-proposal"><strong>AI proposed changes</strong><dl>${Object.entries(state.proposal).flatMap(([group, fields]) => Object.entries(fields).map(([key, value]) => `<div><dt>${esc(t(labels[key] ?? key))}</dt><dd data-user-content>${esc(value === null ? '—' : value)}</dd></div>`)).join('')}</dl><p>Review the values before applying them to this project.</p><button class="button primary compact" type="button" id="ai-apply">Apply AI proposal</button><button class="text-button" type="button" id="ai-discard">Discard</button></div>` : '';
}
