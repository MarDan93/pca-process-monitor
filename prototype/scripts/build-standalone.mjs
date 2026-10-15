import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const result = await build({ entryPoints: [resolve(root, 'app.js')], bundle: true, write: false, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'inline' });
const [template, css, license] = await Promise.all([
  readFile(resolve(root, 'index.html'), 'utf8'),
  readFile(resolve(root, 'styles.css'), 'utf8'),
  readFile(resolve(root, 'node_modules/three/LICENSE'), 'utf8'),
]);
const javascript = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = template
  .replace('<link rel="stylesheet" href="styles.css">', () => `<style>${css}</style>`)
  .replace(/\s*<script type="importmap">[\s\S]*?<\/script>/, '')
  .replace('<script type="module" src="app.js"></script>', '<meta name="app-start-view" content="concept">')
  .replace('</head>', () => `<!-- Third-party licence: Three.js\n${license}\n-->\n</head>`)
  .replace('</body>', () => `<script>${javascript}</script>\n</body>`);
await mkdir(resolve(root, 'dist'), { recursive: true });
const output = resolve(root, 'dist/Progettazione-stampi.html');
await writeFile(output, html);
process.stdout.write(`Standalone HTML: ${output} (${Buffer.byteLength(html)} bytes)\n`);
