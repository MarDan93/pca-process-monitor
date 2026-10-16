import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseAIResponse } from '../ai-contract.js';
import { LocalAI } from '../ai-client.js';
import { applyAIProposal } from '../ai-apply.js';

const response = (changes) => JSON.stringify({ reply: 'Please review these values.', changes });
test('AI contract accepts typed proposals and rejects unsupported tools and invalid quantities', () => {
  assert.equal(parseAIResponse(response({ brief: { annual_volume: 80000, commercial_unit: 'kit' }, part: { material: 'PP' } })).changes.brief.annual_volume, 80000);
  for (const changes of [{ brief: { annual_volume: -1 } }, { brief: { annual_volume: 1.5 } }, { brief: { annual_volume: '80000' } }, { brief: { selling_price_eur: -5 } }, { robot: { speed: 2 } }, { part: { name: { html: 'x' } } }, { geometry: { cooling: true } }, { brief: { commercial_unit: 'boxes' } }]) assert.throws(() => parseAIResponse(response(changes)));
  assert.throws(() => parseAIResponse('I made a mould.'));
  assert.equal(parseAIResponse(response({ brief: { selling_price_eur: 0, mould_budget_eur: null } })).changes.brief.selling_price_eur, 0);
});
test('reviewed AI changes are atomic, sourced and reject stale project revisions', () => {
  const original = { id: 'a', updated_at: 'r1', brief: { customer: 'Original' }, part: { length_mm: 120, wall_options_mm: [2] }, concept_preview: { wall_mm: null }, sources: {} };
  const options = { expectedRevision: 'a:r1', wall: 2, validateGeometry: () => {} };
  const next = applyAIProposal(original, { brief: { market: 'Medical', unit_cost_target_eur: 1.2 } }, options);
  assert.equal(original.brief.market, undefined); assert.equal(next.brief.market, 'Medical');
  assert.equal(next.brief.cost_target_mode, 'fixed'); assert.equal(next.sources['brief.market'].kind, 'ai_proposal');
  assert.throws(() => applyAIProposal(original, { brief: { customer: 'Changed' } }, { ...options, expectedRevision: 'a:r0' }), /project changed/);
  assert.throws(() => applyAIProposal(original, { brief: { customer: 'Changed' }, geometry: { wall_mm: 100 } }, { ...options, validateGeometry: () => { throw new Error('Impossible shell'); } }), /Impossible shell/);
  assert.equal(original.brief.customer, 'Original'); assert.deepEqual(original.part.wall_options_mm, [2]);
});
test('AI client uses a worker and exposes errors without substituting local commands', () => {
  let worker;
  const ai = new LocalAI(() => worker = { postMessage(message) { this.last = message; }, terminate() { this.stopped = true; } });
  ai.load(); assert.equal(worker.last.type, 'load'); assert.equal(ai.state.status, 'loading');
  worker.onmessage({ data: { type: 'ready' } });
  ai.state.mode = 'changes';
  ai.send('Customer needs 80,000 parts', {}, 'en', 'a:r1'); assert.equal(worker.last.type, 'generate');
  worker.onmessage({ data: { type: 'result', text: response({ brief: { annual_volume: 80000 } }) } });
  assert.equal(ai.state.proposal.brief.annual_volume, 80000); assert.equal(ai.state.baseRevision, 'a:r1');
  ai.send('What next?', {}, 'en', 'a:r1'); worker.onmessage({ data: { type: 'result', text: 'Unstructured answer' } });
  assert.equal(ai.state.proposal, null); assert.match(ai.state.error, /No validated changes/);
  ai.state.mode = 'chat'; ai.send('What material is needed?', {}, 'en', 'a:r1');
  worker.onmessage({ data: { type: 'result', text: 'Please provide the resin grade.' } });
  assert.equal(ai.state.proposal, null); assert.equal(ai.state.error, '');
  assert.equal(ai.state.messages.at(-1).content, 'Please provide the resin grade.');
  worker.onmessage({ data: { type: 'error', message: 'Download blocked' } });
  assert.equal(ai.state.status, 'error'); assert.equal(ai.state.error, 'Download blocked');
  ai.cancel(); assert.equal(worker.stopped, true); assert.equal(ai.state.status, 'idle');
});
