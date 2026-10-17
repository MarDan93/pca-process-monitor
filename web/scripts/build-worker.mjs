import { build } from '../../prototype/node_modules/esbuild/lib/main.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
await mkdir(new URL('../public/', import.meta.url), { recursive: true });
await build({ entryPoints: [new URL('../../prototype/ai-worker.js', import.meta.url).pathname], outfile: new URL('../public/ai-worker.js', import.meta.url).pathname, bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'eof' });
const notices = ['Mould Studio workspace — third-party browser runtime notices\nOriginal workspace glyphs/layout: project MIT licence. Model weights are not included.\n'];
for (const [name, path] of [
  ['React (MIT)', '../node_modules/react/LICENSE'],
  ['React DOM (MIT)', '../node_modules/react-dom/LICENSE'],
  ['Scheduler (MIT)', '../node_modules/scheduler/LICENSE'],
  ['Three.js (MIT)', '../../prototype/node_modules/three/LICENSE'],
  ['Transformers.js (Apache-2.0)', '../../prototype/node_modules/@huggingface/transformers/LICENSE'],
  ['ONNX Runtime (MIT)', '../../prototype/licenses/ONNXRuntime.txt'],
]) notices.push(`\n${name}\n${await readFile(new URL(path, import.meta.url), 'utf8')}`);
await writeFile(new URL('../public/THIRD_PARTY_NOTICES.txt', import.meta.url), notices.join('\n'));
