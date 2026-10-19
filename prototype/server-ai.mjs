// Fixed text-in/text-out CPU inference. No generated code or model tools execute.
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pipeline, env } from '@huggingface/transformers';
import { AI_MODEL, AI_MODEL_REVISION, buildAIMessages } from './ai-contract.js';

const cache = resolve(import.meta.dirname, '../.cache/ai/models');
const location = resolve(cache, AI_MODEL, AI_MODEL_REVISION);
const weight = resolve(location, 'onnx/model_q4.onnx');
const expected = '09235a3b1c135cd04ef570e5053b5c079e028078a2cc5f76ba6a251e91bf3296';
async function verify() {
  if ((await stat(weight)).size !== 786156820) throw new Error('Incomplete pinned model. Run python scripts/setup_codespaces.py --with-ai.');
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(weight)) hash.update(chunk);
  if (hash.digest('hex') !== expected) throw new Error('Pinned model checksum failed.');
}
env.cacheDir = cache;
env.allowLocalModels = !process.argv.includes('--prepare');
// Preparation may download pinned files. Inference itself is offline/cache-only.
env.allowRemoteModels = process.argv.includes('--prepare');
if (!env.allowRemoteModels) await verify();
const generator = await pipeline('text-generation', AI_MODEL, { revision: AI_MODEL_REVISION, dtype: 'q4', device: 'cpu',
  local_files_only: !env.allowRemoteModels,
  session_options: { intraOpNumThreads: 2, interOpNumThreads: 1 } });
if (process.argv.includes('--prepare')) {
  await verify();
  process.stdout.write(JSON.stringify({ ready: true, model: AI_MODEL, revision: AI_MODEL_REVISION }) + '\n');
} else {
  let source = '';
  for await (const chunk of process.stdin) { source += chunk; if (source.length > 32768) throw new Error('Input is too large.'); }
  const input = JSON.parse(source);
  let messages;
  if (input.mode === 'process') {
    messages = [{ role: 'system', content: `Extract explicitly requested settings into JSON with keys reply and changes. Every numeric value MUST be a JSON number, never a quoted string and never a unit suffix. Include ONLY requested fields. Allowed fields: ${JSON.stringify(input.fields)}. Times are seconds, masses grams, distances mm. Keep other fields unchanged. No code, markdown, simulation claims or full scenario. Write a brief reply in ${input.language}.` },
      { role: 'user', content: 'Set injection_s to 2 seconds and cycles to 4.' },
      { role: 'assistant', content: '{"reply":"Proposed injection time and cycle count.","changes":{"injection_s":2,"cycles":4}}' },
      { role: 'user', content: input.message }];
  } else if (input.mode === 'chat') {
    messages = [{ role: 'system', content: `You are a requirements assistant for injection moulding. Reply briefly in ${input.language}. Use only supplied project facts: ${JSON.stringify(input.context)}. Process results, if supplied, are L0 configured scheduling, not measured production or polymer physics. Never invent material properties, temperatures, quality validation or capabilities. Ask for missing information. Conversation cannot modify a project.` }, { role: 'user', content: input.message }];
  } else {
    messages = buildAIMessages(input.context, input.language, [{ role: 'user', content: input.message }], input.mode === 'commercial' ? 'changes' : 'chat');
  }
  const output = await generator(messages, { max_new_tokens: input.mode === 'chat' ? 180 : 250, do_sample: false, return_full_text: false });
  const text = output[0].generated_text;
  process.stdout.write(JSON.stringify({ text: Array.isArray(text) ? text.at(-1).content : text, model: AI_MODEL, revision: AI_MODEL_REVISION }) + '\n');
}
await generator.dispose();
