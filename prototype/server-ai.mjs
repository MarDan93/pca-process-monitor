// Fixed text-in/text-out CPU inference. No generated code or model tools execute.
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pipeline, env } from '@huggingface/transformers';
import { buildAIMessages } from './ai-contract.js';
const models = JSON.parse(await readFile(new URL('../server/app/model-manifest.json', import.meta.url), 'utf8'));
const selected = models[process.env.MOULD_AI_PROFILE || 'compact'];
if (!selected) throw new Error('Unknown AI profile.');
const { model: AI_MODEL, revision: AI_MODEL_REVISION } = selected;

const cache = resolve(import.meta.dirname, '../.cache/ai/models');
const location = resolve(cache, AI_MODEL, AI_MODEL_REVISION);
const weight = resolve(location, 'onnx/model_q4.onnx');
const expected = selected.sha256;
async function verify() {
  if ((await stat(weight)).size !== selected.bytes) throw new Error('Incomplete pinned model. Run python scripts/setup_codespaces.py --with-ai.');
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
  async function infer(input){
  let messages;
  if (input.mode === 'process'||input.mode==='system') {
    messages = [{ role: 'system', content: `Extract explicitly requested settings into JSON with keys reply and changes. Every numeric value MUST be a JSON number, never a quoted string and never a unit suffix. Include ONLY requested fields. Allowed fields: ${JSON.stringify(input.fields)}. Times are seconds, masses grams, distances mm. Keep other fields unchanged. No code, markdown, simulation claims or full scenario. Write a brief reply in ${input.language}.` },
      { role: 'user', content: input.mode==='system'?'Set container_change_s to 5 seconds and parts_per_container to 24.':'Set injection_s to 2 seconds and cycles to 4.' },
      { role: 'assistant', content: input.mode==='system'?'{"reply":"Proposed container settings.","changes":{"container_change_s":5,"parts_per_container":24}}':'{"reply":"Proposed injection time and cycle count.","changes":{"injection_s":2,"cycles":4}}' },
      { role: 'user', content: input.message }];
  } else if (input.mode === 'chat') {
    messages = [{ role: 'system', content: `You route an injection moulding workflow. Return ONLY JSON: {"actions":[...]}. Choose 1 to 4 UNIQUE actions from: demand, geometry, material, machines, layout, simulation, costs. Do not write facts, prices, recommendations, prose or new action names. Demand means annual versus total quantity and duration; geometry means part dimensions/mass; machines means real press specifications; layout means cavity layout; simulation means timing and curves; costs means economic comparison. Project facts: ${JSON.stringify(input.context)}.` },
      ...(input.history || []).slice(-6), { role: 'user', content: input.message }];
  } else {
    messages = buildAIMessages(input.context, input.language, [{ role: 'user', content: input.message }], input.mode === 'commercial' ? 'changes' : 'chat');
  }
  const output = await generator(messages, { max_new_tokens: input.mode === 'chat' ? 90 : 250, do_sample: false, return_full_text: false });
  const text = output[0].generated_text;
  return {text:Array.isArray(text)?text.at(-1).content:text,model:AI_MODEL,revision:AI_MODEL_REVISION};
  }
  if(process.argv.includes('--evaluate')){
    const path=process.argv[process.argv.indexOf('--evaluate')+1];
    const cases=JSON.parse(await readFile(path,'utf8')).cases;const results=[];
    for(const c of cases){const began=Date.now();results.push({id:c.id,...await infer({mode:'system',message:c.message,language:c.language,fields:{cavities:{type:'number'},cycles:{type:'number'},cooling_s:{type:'number'},robot_pick_s:{type:'number'},robot_transfer_s:{type:'number'},robot_return_s:{type:'number'},eoat_slots:{type:'number'},reindex_s:{type:'number'},capacity_parts:{type:'number'},parts_per_container:{type:'number'},handling_s_per_part:{type:'number'},container_change_s:{type:'number'}}}),latency_ms:Date.now()-began});process.stderr.write(`EVAL ${results.length}/${cases.length} ${c.id}\n`);}
    process.stdout.write(JSON.stringify({model:AI_MODEL,revision:AI_MODEL_REVISION,results})+'\n');
  }else{
    let source='';for await(const chunk of process.stdin){source+=chunk;if(source.length>131072)throw new Error('Input is too large.');}
    process.stdout.write(JSON.stringify(await infer(JSON.parse(source)))+'\n');
  }
}
await generator.dispose();
