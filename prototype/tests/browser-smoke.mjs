import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const standalone = process.argv.includes('--standalone');
const artifacts = resolve(root, '../.cache/ux');
await mkdir(artifacts, { recursive: true });
const downloadDir = await mkdtemp(join(artifacts, 'browser-run-'));
const profile = await mkdtemp(join(tmpdir(), 'mould-browser-'));
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = createServer(async (request, response) => {
  try {
    const path = resolve(root, '.' + (new URL(request.url, 'http://localhost').pathname === '/' ? '/index.html' : decodeURIComponent(new URL(request.url, 'http://localhost').pathname)));
    if (!path.startsWith(root + sep)) throw new Error('Invalid path');
    const data = await readFile(path);
    response.writeHead(200, { 'Content-Type': mime[extname(path)] ?? 'application/octet-stream' });
    response.end(data);
  } catch { response.writeHead(404); response.end(); }
});
await new Promise((accept) => server.listen(0, '127.0.0.1', accept));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = spawn(process.env.CHROMIUM_BINARY || 'chromium', ['--headless', '--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, XDG_CACHE_HOME: join(profile, 'cache'), XDG_CONFIG_HOME: join(profile, 'config') } });
let browserLog = '', spawnError;
browser.stderr.on('data', (chunk) => { browserLog = (browserLog + chunk.toString()).slice(-2500); });
browser.on('error', (error) => { spawnError = error; });
let socket;
const pause = (ms) => new Promise((accept) => setTimeout(accept, ms));
try {
  let port;
  for (let i = 0; i < 100; i++) {
    if (spawnError) throw spawnError;
    if (browser.exitCode != null) throw new Error(`Chromium exited: ${browserLog}`);
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; } catch { await pause(100); }
  }
  if (!port) throw new Error(`Chromium did not start: ${browserLog}`);
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(pages.find((page) => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((accept, reject) => { socket.addEventListener('open', accept, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let sequence = 0;
  const pending = new Map(), exceptions = [], requests = [];
  socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.exceptionThrown') exceptions.push(data.params.exceptionDetails);
    if (data.method === 'Network.requestWillBeSent') requests.push(data.params);
    if (pending.has(data.id)) { const handler = pending.get(data.id); pending.delete(data.id); clearTimeout(handler.timer); if (data.error) handler.reject(data.error); else handler.accept(data.result); }
  });
  function call(method, params = {}) {
    return new Promise((accept, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
      pending.set(id, { accept, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async function until(expression) {
    for (let i = 0; i < 150; i++) { if (await evaluate(expression)) return; await pause(100); }
    const details = await evaluate('JSON.stringify({ title: document.querySelector("#page-title")?.textContent, content: document.querySelector("#content")?.textContent?.slice(0, 2500), ready: document.readyState })');
    throw new Error(`Page condition not met: ${expression}\n${details}\nRuntime exceptions: ${JSON.stringify(exceptions)}`);
  }
  const click = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const fill = (id, value) => evaluate(`{ const el=document.getElementById(${JSON.stringify(id)});el.value=${JSON.stringify(String(value))};el.dispatchEvent(new Event('input',{bubbles:true})); }`);
  const stored = () => evaluate('JSON.parse(localStorage.getItem("injection-moulding-brief-v1"))');
  const ready = async () => {
    await until('Boolean(document.querySelector("#content .card"))');
    if (!await evaluate('Boolean(document.querySelector("#brief-project_name"))')) await click('[data-view="brief"]');
    await until('Boolean(document.querySelector("#brief-project_name"))');
  };
  const rendered = () => until('document.querySelector("#concept-viewport")?.dataset.renderStatus === "ready"');
  const setOffline = (offline) => call('Network.emulateNetworkConditions', { offline, latency: 0, downloadThroughput: offline ? 0 : -1, uploadThroughput: offline ? 0 : -1 });
  const reload = async () => {
    // The cloud browser blocks file:// URLs by policy. Load the single HTML
    // over loopback, then disconnect it to test the entire offline workflow.
    if (standalone) await setOffline(false);
    await call('Page.reload'); await ready();
    if (standalone) await setOffline(true);
  };
  const pass = (message) => process.stdout.write(`PASS ${message}\n`);
  const idealRoundedVolume = (wall) => (120 * 80 - (4 - Math.PI) * 8 ** 2) * 35 - ((120 - 2 * wall) * (80 - 2 * wall) - (4 - Math.PI) * (8 - wall) ** 2) * (35 - 2 * wall);
  await call('Runtime.enable'); await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await call('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir });
  if (standalone) await call('Network.enable');
  await call('Page.navigate', { url: standalone ? `${origin}/dist/Progettazione-stampi.html` : origin });
  if (standalone) {
    await rendered();
    await setOffline(true);
    pass('single HTML opens directly in 3D; network disconnected for subsequent interactions');
  }
  await ready();
  await fill('brief-project_name', 'Gusci elettronica · concept');
  await fill('brief-annual_volume', 1234567890);
  assert.equal((await stored()).brief.annual_volume, 1234567890);
  await fill('brief-annual_volume', -1);
  await click('[data-view="part"]');
  assert.equal(await evaluate('document.querySelector("#page-title").textContent'), 'Brief cliente');
  await fill('brief-annual_volume', 250000);
  await click('[data-view="concept"]'); await rendered();
  assert.ok(await evaluate('Number(document.querySelector("#concept-viewport").dataset.drawCalls) > 0'));
  assert.ok(Math.abs(await evaluate('Number(document.querySelector("[data-volume-mm3]").dataset.volumeMm3)') - idealRoundedVolume(1.5)) < 10);
  assert.equal((await stored()).part.snap_count, 6);
  assert.equal((await stored()).part.snap_layout, 'long_sides');
  assert.equal((await stored()).part.snap_cycles, 1000);
  assert.equal((await stored()).part.corner_radius_mm, 8);
  assert.equal((await stored()).part.pcb_count, 4);
  assert.equal((await stored()).part.ip_target, 'IP65');
  assert.equal((await stored()).part.thermal_strategy, 'sealed');
  assert.equal((await stored()).part.ip_in_use, 'with_cable');
  assert.equal((await stored()).part.pcb_layout, 'two_by_two');
  assert.deepEqual([(await stored()).part.pcb_length_mm, (await stored()).part.pcb_width_mm, (await stored()).part.pcb_height_mm], [40, 25, 8]);
  pass('3D renders the R8 paired-shell case; six snaps and 1,000 service cycles are requirements');
  await click('[data-preview-wall="2.5"]'); await rendered();
  assert.ok(Math.abs(await evaluate('Number(document.querySelector("[data-volume-mm3]").dataset.volumeMm3)') - idealRoundedVolume(2.5)) < 10);
  assert.equal((await stored()).part.nominal_wall_mm, null);
  assert.equal((await stored()).concept_preview.wall_mm, 2.5);
  await click('#concept-explode'); assert.equal(await evaluate('document.querySelector("#concept-explode").getAttribute("aria-pressed")'), 'false');
  await click('#concept-explode');
  await click('[data-concept-camera="front"]');
  const frontImage = (await call('Page.captureScreenshot', { format: 'png' })).data;
  await click('[data-concept-camera="rear"]');
  const backImage = (await call('Page.captureScreenshot', { format: 'png' })).data;
  assert.notEqual(frontImage, backImage);
  pass('thickness updates volume without selecting a final wall; exploded and camera views respond');
  await click('#concept-download');
  let files = [];
  for (let i = 0; i < 30; i++) { files = (await readdir(downloadDir)).filter((file) => file.endsWith('.obj')); if (files.length) break; await pause(100); }
  assert.equal(files.length, 1);
  const obj = await readFile(join(downloadDir, files[0]), 'utf8');
  assert.match(obj, /millimetri/); assert.match(obj, /Spessore pareti: 2.5 mm/); assert.match(obj, /Raggio esterno profilo: 8 mm/);
  assert.equal(obj.split('\n').filter((line) => line.startsWith('o ')).length, 2);
  pass('actual OBJ download contains both separate shells and the displayed wall thickness');
  await fill('part-length_mm', -1);
  assert.equal(await evaluate('document.querySelector("#concept-download").disabled'), true);
  assert.equal(await evaluate('document.querySelector("#concept-viewport canvas") === null'), true);
  await fill('part-length_mm', 120); await rendered();
  await fill('part-front_share_percent', 99);
  await until('document.querySelector("#concept-viewport").dataset.renderStatus === "unavailable"');
  assert.equal(await evaluate('document.querySelector("#concept-download").disabled'), true);
  await fill('part-front_share_percent', 50); await rendered();
  pass('invalid dimensions and impossible shell splits disable stale geometry and export');
  await click('[data-view="summary"]');
  assert.match(await evaluate('document.querySelector("#content").textContent'), /Con attrezzo, senza danni/);
  assert.match(await evaluate('document.querySelector("#content").textContent'), /IP65 è un obiettivo non ancora verificato/);
  await click('[data-export]');
  let jsonFiles = [];
  for (let i = 0; i < 30; i++) { jsonFiles = (await readdir(downloadDir)).filter((file) => file.endsWith('.json')); if (jsonFiles.length) break; await pause(100); }
  assert.equal(jsonFiles.length, 1);
  const exported = JSON.parse(await readFile(join(downloadDir, jsonFiles[0]), 'utf8'));
  assert.equal(exported.part.ip_target, 'IP65');
  assert.equal(exported.part.connector_strategy, 'sealed_cover');
  assert.equal(exported.part.ip_in_use, 'with_cable');
  assert.equal(exported.part.pcb_height_mm, 8);
  assert.equal(exported.engineering_validation, 'not_performed');
  pass('functional requirements export IP65 as an unverified target, four PCBs and sealed cover');
  await reload();
  await click('[data-view="concept"]'); await rendered();
  assert.equal((await stored()).concept_preview.wall_mm, 2.5);
  pass('preview selection and service requirements survive navigation and reload');
  const legacy = await stored(); legacy.schema_version = 2;
  for (const key of ['opening', 'dimension_basis', 'front_share_percent', 'aesthetic_surfaces', 'snap_service', 'snap_count', 'corner_radius_mm', 'snap_layout', 'snap_cycles']) delete legacy.part[key];
  legacy.part.nominal_wall_mm = 3; legacy.brief.customer = 'Cliente da conservare'; delete legacy.concept_preview;
  await evaluate(`localStorage.setItem('injection-moulding-brief-v1', ${JSON.stringify(JSON.stringify(legacy))})`);
  await reload();
  await click('[data-view="part"]');
  assert.equal(await evaluate('document.querySelector("#part-opening").value'), 'unspecified');
  await click('#complete-case-requirements');
  assert.equal((await stored()).brief.customer, 'Cliente da conservare');
  assert.equal((await stored()).part.nominal_wall_mm, 3);
  assert.equal((await stored()).part.opening, 'paired_shells');
  assert.equal((await stored()).schema_version, 4);
  assert.equal((await stored()).part.corner_radius_mm, 0);
  pass('legacy project preserves prior customer, wall choice and variants when completed');
  await click('[data-view="concept"]'); await rendered();
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await pause(150);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true);
  pass('3D workspace stays within a mobile viewport');
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await click('#example-button');
  await click('#example-dialog button[value="load"]');
  await until('document.querySelector("#data-badge").classList.contains("demo")');
  await click('[data-view="concept"]'); await rendered();
  await click('[data-preview-wall="2"]'); await rendered();
  await click('[data-concept-camera="iso"]');
  await evaluate('window.scrollTo(0,0);document.querySelector("#toast").hidden=true');
  await pause(150);
  const screenshot = await call('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(artifacts, standalone ? 'concept-standalone.png' : 'concept-3d.png'), Buffer.from(screenshot.data, 'base64'));
  if (standalone) {
    assert.deepEqual(requests.filter((request) => !['Document', 'Other'].includes(request.type)).map((request) => request.request.url), []);
    pass('no external scripts, stylesheets, fonts, images or data requests');
  }
  assert.deepEqual(exceptions, []);
  pass('no JavaScript runtime exceptions');
  process.stdout.write(`Artifacts: ${downloadDir}\n`);
} finally {
  socket?.close();
  browser.kill('SIGTERM');
  await new Promise((accept) => { if (browser.exitCode != null || spawnError) accept(); else { browser.once('exit', accept); setTimeout(() => { browser.kill('SIGKILL'); accept(); }, 2000).unref(); } });
  server.closeAllConnections(); await new Promise((accept) => server.close(accept));
  await rm(profile, { recursive: true, force: true });
}
