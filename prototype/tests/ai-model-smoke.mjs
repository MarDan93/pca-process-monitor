// Optional real-model check, distinct from the browser-worker integration test.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { pipeline, env } from '@huggingface/transformers';
import { AI_MODEL, AI_MODEL_REVISION, buildAIMessages, parseAIResponse } from '../ai-contract.js';
import { applyAIProposal } from '../ai-apply.js';

const artifacts = resolve(import.meta.dirname, '../../.cache/ai');
await mkdir(artifacts, { recursive: true });
env.cacheDir = resolve(artifacts, 'models');
env.allowLocalModels = false;
const progressByFile = new Map();
const started = performance.now();
const generator = await pipeline('text-generation', AI_MODEL, {
  revision: AI_MODEL_REVISION, dtype: 'q4', device: 'cpu',
  session_options: { intraOpNumThreads: 2, interOpNumThreads: 1 },
  progress_callback: ({ file, status, progress }) => {
    const step = progress == null ? status : Math.floor(progress / 25) * 25;
    if (file && progressByFile.get(file) !== step) { progressByFile.set(file, step); process.stdout.write(`${file}: ${step}\n`); }
  },
});
const loaded = performance.now();
const request = 'Set annual_volume to 80000 and market to Appliances. Reply briefly in English.';
const result = await generator(buildAIMessages({ brief: { annual_volume: 250000 }, part: { name: 'Reference shell', material: 'ABS' } }, 'en', [{ role: 'user', content: request }]), { max_new_tokens: 320, do_sample: false, return_full_text: false });
const generated = result[0]?.generated_text;
const text = Array.isArray(generated) ? generated.at(-1).content : generated;
const evidence = { model: AI_MODEL, revision: AI_MODEL_REVISION, runtime: 'ONNX Runtime Node CPU (not a browser-worker test)', request, response: text, loading_ms: Math.round(loaded-started), generation_ms: Math.round(performance.now()-loaded) };
await writeFile(resolve(artifacts, 'real-model-check.json'), JSON.stringify(evidence, null, 2));
const proposal = parseAIResponse(text);
assert.equal(proposal.changes.brief.annual_volume, 80000);
assert.equal(proposal.changes.brief.market, 'Appliances');
const initial = { id: 'real-model-check', updated_at: 'v1', brief: {}, part: { wall_options_mm: [] }, concept_preview: {}, sources: {} };
const accepted = applyAIProposal(initial, proposal.changes, { expectedRevision: 'real-model-check:v1', wall: null, validateGeometry() { throw new Error('Unexpected geometry modification'); } });
assert.equal(accepted.brief.annual_volume, 80000);
assert.equal(accepted.sources['brief.annual_volume'].model, AI_MODEL);
assert.equal(initial.brief.annual_volume, undefined);
process.stdout.write(`PASS REAL model inference + typed proposal + apply; loading ${evidence.loading_ms}ms, generation ${evidence.generation_ms}ms\n${text}\n`);
const question = await generator(buildAIMessages({ brief: { annual_volume: 80000, market: 'Appliances' }, part: {} }, 'en', [{ role: 'user', content: 'What material information is needed before a mould concept? Do not change any project values.' }], 'chat'), { max_new_tokens: 240, do_sample: false, return_full_text: false });
const questionText = Array.isArray(question[0].generated_text) ? question[0].generated_text.at(-1).content : question[0].generated_text;
await writeFile(resolve(artifacts, 'real-question-check.json'), JSON.stringify({ response: questionText }, null, 2));
assert.equal(typeof questionText, 'string');
assert.match(questionText, /material|grade|manufacturer|supplier|resin/i);
assert.ok(!questionText.trim().startsWith('{'), 'Conversation should be plain text');
process.stdout.write(`PASS REAL question answered without field changes\n${questionText}\n`);
await generator.dispose();
