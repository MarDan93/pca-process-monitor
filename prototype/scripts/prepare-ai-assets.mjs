// Prepare a static, same-origin deployment from verified npm runtime files and pinned cached weights.
import { mkdir, copyFile, link, readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { AI_MODEL, AI_MODEL_REVISION } from '../ai-contract.js';
const root = resolve(import.meta.dirname, '..');
const base = resolve(root, '../.cache/ai');
const model = resolve(base, 'models', AI_MODEL, AI_MODEL_REVISION);
const staticRoot = resolve(base, 'static');
const output = resolve(staticRoot, 'ai-assets', AI_MODEL, 'resolve', AI_MODEL_REVISION);
if ((await stat(resolve(model, 'onnx/model_q4.onnx'))).size !== 786156820) throw new Error('Pinned weights are missing or incomplete. Run npm run test:ai-model first.');
const hash = createHash('sha256');
for await (const chunk of createReadStream(resolve(model, 'onnx/model_q4.onnx'))) hash.update(chunk);
if (hash.digest('hex') !== '09235a3b1c135cd04ef570e5053b5c079e028078a2cc5f76ba6a251e91bf3296') throw new Error('Pinned model SHA-256 does not match its upstream LFS ETag.');
for (const name of ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'generation_config.json', 'onnx/model_q4.onnx']) {
  const target = resolve(output, name); await mkdir(dirname(target), { recursive: true });
  try { await link(resolve(model, name), target); } catch (error) { if (error.code !== 'EEXIST') throw error; }
}
for (const name of ['ort-wasm-simd-threaded.jsep.mjs', 'ort-wasm-simd-threaded.jsep.wasm']) {
  const source = resolve(root, 'node_modules/@huggingface/transformers/dist', name);
  for (const directory of [resolve(base, 'runtime'), resolve(staticRoot, 'ai-runtime')]) { await mkdir(directory, { recursive: true }); await copyFile(source, resolve(directory, name)); }
}
const html = (await readFile(resolve(root, 'dist/Mould-Studio.html'), 'utf8')).replace('</head>', '<meta name="ai-model-host" content="/ai-assets/"><meta name="ai-wasm-base" content="/ai-runtime/"></head>');
await writeFile(resolve(staticRoot, 'index.html'), html);
process.stdout.write(`Prepared static AI application: ${staticRoot}\nServe this directory over HTTP/HTTPS. Do not commit weights or include them in the demo ZIP.\n`);
