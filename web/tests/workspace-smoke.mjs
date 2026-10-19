import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const output = join(root, '.cache/ux/workspace');
await mkdir(output, { recursive: true });
const temp = await mkdtemp(join(tmpdir(), 'mould-workspace-test-'));
const profile = join(temp, 'chromium');
const database = join(temp, 'projects.sqlite3');
const realAI = process.argv.includes('--ai-real');
const serverAI = process.argv.includes('--server-ai');
const processFlow = process.argv.includes('--process') || serverAI;
let service, browser, socket, origin, serviceLog = '', browserLog = '';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const pass = text => process.stdout.write(`PASS ${text}\n`);
async function start(port = 0) {
  serviceLog = '';
  service = spawn(join(root, '.venv-app/bin/python'), ['-m', 'uvicorn', 'app.main:app', '--app-dir', 'server', '--host', '127.0.0.1', '--port', String(port), '--no-use-colors'], { cwd: root, env: { ...process.env, MOULD_WORKSPACE_DB: database, MOULD_SERVER_AI: serverAI ? '1' : '0' }, stdio: ['ignore', 'ignore', 'pipe'] });
  service.stderr.on('data', data => { serviceLog = (serviceLog + data).slice(-4000); });
  for (let i = 0; i < 100; i++) {
    if (service.exitCode !== null) throw new Error(`API exited: ${serviceLog}`);
    const match = serviceLog.match(/http:\/\/127\.0\.0\.1:(\d+)/);
    if (match) {
      const address = `http://127.0.0.1:${match[1]}`;
      try { if ((await fetch(address + '/api/health')).ok) { origin = address; return; } } catch { /* Wait for actual health request. */ }
    }
    await pause(100);
  }
  throw new Error(`API failed to start: ${serviceLog}`);
}
async function stop(process) {
  if (!process || process.exitCode !== null) return;
  await new Promise(resolve => { process.once('exit', resolve); process.kill('SIGTERM'); });
}
try {
  await start();
  browser = spawn(process.env.CHROMIUM_BINARY || 'chromium', ['--headless', '--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, XDG_DATA_HOME: join(temp, 'data'), XDG_CACHE_HOME: join(temp, 'cache'), XDG_CONFIG_HOME: join(temp, 'config') } });
  browser.stderr.on('data', data => { browserLog = (browserLog + data).slice(-2000); });
  let debugPort;
  for (let i = 0; i < 100; i++) {
    if (browser.exitCode !== null) throw new Error(`Chromium exited: ${browserLog}`);
    try { debugPort = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; } catch { await pause(100); }
  }
  if (!debugPort) throw new Error(`Chromium did not start: ${browserLog}`);
  const pages = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
  socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let sequence = 0;
  const pending = new Map(), exceptions = [];
  socket.addEventListener('message', ({ data: raw }) => {
    const data = JSON.parse(raw);
    if (data.method === 'Runtime.exceptionThrown') exceptions.push(data.params.exceptionDetails);
    if (pending.has(data.id)) {
      const handler = pending.get(data.id); pending.delete(data.id); clearTimeout(handler.timer);
      data.error ? handler.reject(data.error) : handler.resolve(data.result);
    }
  });
  function call(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 20000);
      pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async function until(expression, timeout = 20000) {
    const start = Date.now();
    while (Date.now() - start < timeout) { if (await evaluate(`Boolean(${expression})`)) return; await pause(120); }
    const details = await evaluate('JSON.stringify({body:document.body.innerText.slice(-4000),error:document.querySelector("[role=alert]")?.textContent})');
    throw new Error(`Condition failed: ${expression}\n${details}\n${JSON.stringify(exceptions)}`);
  }
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const fill = (selector, value) => evaluate(`{ const element=document.querySelector(${JSON.stringify(selector)});const prototype=element.tagName==='SELECT'?HTMLSelectElement.prototype:element.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(element,${JSON.stringify(String(value))});element.dispatchEvent(new Event(element.tagName==='SELECT'?'change':'input',{bubbles:true})); }`);
  const stored = () => evaluate(`fetch('/api/projects/'+document.querySelector('#project-switcher').value).then(r=>r.json())`);
  async function screenshot(name) { const result = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); await writeFile(join(output, name), Buffer.from(result.data, 'base64')); }
  async function create(name) {
    await click('.new-project'); await fill('#new-project-name', name); await click('#create-project');
    await until(`document.querySelector('#project-switcher')?.selectedOptions[0]?.textContent===${JSON.stringify(name)} && !document.querySelector('dialog')`);
  }
  await call('Runtime.enable'); await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: origin });
  await until('document.querySelector(".new-project") && !document.querySelector(".new-project").disabled');
  await create('Flange feasibility');
  assert.ok(Object.values((await stored()).commercial).every(value => value === null));
  const firstId = (await stored()).id;
  pass('new server project has no enclosure, material, quantity or monetary defaults');
  await fill('#field-customer', 'Example customer'); await fill('#field-market', 'Consumer electronics');
  await fill('#field-commercial_unit', 'part'); await fill('#field-annual_volume', 50000);
  await fill('#field-program_years', 5); await fill('#field-currency', 'EUR');
  await fill('#field-notes', 'Original synthetic feasibility fixture. No private data.');
  await click('#preview-manual'); await until('Boolean(document.querySelector("#approve-operation"))');
  assert.equal((await stored()).revision, 0);
  assert.ok((await evaluate('document.querySelector("dialog").innerText')).includes('50,000'));
  await click('#approve-operation'); await until('!document.querySelector("dialog") && document.querySelector(".revision-tag").textContent==="r1"');
  assert.equal((await stored()).commercial.annual_volume, 50000);
  await click('[aria-label="Undo last change"]'); await until('document.querySelector(".revision-tag").textContent==="r2"');
  assert.equal((await stored()).commercial.annual_volume, null);
  pass('manual preview does not mutate; approval persists; undo appends a compensating revision');
  await fill('#field-customer', 'Example customer'); await fill('#field-market', 'Consumer electronics');
  await fill('#field-commercial_unit', 'part'); await fill('#field-annual_volume', 50000);
  await fill('#field-program_years', 5); await fill('#field-currency', 'EUR');
  await fill('#field-notes', 'Original synthetic feasibility fixture. No private data.');
  await click('#preview-manual'); await until('Boolean(document.querySelector("#approve-operation"))'); await click('#approve-operation');
  await until('!document.querySelector("dialog") && document.querySelector(".revision-tag").textContent==="r3"');
  await click('[aria-label="Reference flange"]');
  await until('document.querySelector("#scene-host")?.dataset.renderStatus==="ready" && document.querySelectorAll(".component-row").length===2');
  assert.equal((await stored()).asset.source, 'synthetic_reference');
  await click('.component-row'); await click('[aria-label="Side"]');
  await fill('#chat-input', 'Keep this draft while I inspect the cell.');
  await evaluate('window.testCanvas=document.querySelector("#scene-host canvas");window.testCamera=document.querySelector("#scene-host").dataset.camera;window.testSelection=document.querySelector("#scene-host").dataset.selection');
  for (const module of ['brief','product','mould','press','automation','material','process','quality','costs','reports']) {
    await click(`#module-${module}`);
    assert.equal(await evaluate('document.querySelector("#scene-host canvas")===window.testCanvas'), true, module);
    assert.equal(await evaluate('document.querySelector("#scene-host").dataset.camera===window.testCamera'), true, module);
    assert.equal(await evaluate('document.querySelector("#scene-host").dataset.selection===window.testSelection'), true, module);
    assert.equal(await evaluate('document.querySelector("#chat-input").value'), 'Keep this draft while I inspect the cell.');
  }
  pass('same WebGL canvas, camera, selection and copilot draft survive all ten module switches');
  const widthBefore = await evaluate('document.querySelector(".properties-panel").getBoundingClientRect().width');
  await evaluate('document.querySelector(".resize-handle.left").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true}))');
  assert.ok(await evaluate('document.querySelector(".properties-panel").getBoundingClientRect().width') > widthBefore);
  await click('[aria-label="Toggle copilot"]'); await click('[aria-label="Toggle copilot"]');
  assert.equal(await evaluate('document.querySelector("#chat-input").value'), 'Keep this draft while I inspect the cell.');
  for (const [language, brief] of [['it','Richiesta cliente'],['fr','Demande client'],['es','Solicitud del cliente'],['en','Customer brief']]) {
    await fill('.language-picker', language); await until(`document.documentElement.lang===${JSON.stringify(language)}`);
    assert.equal(await evaluate('document.querySelector("#module-brief").getAttribute("aria-label")'), brief);
    assert.equal((await stored()).name, 'Flange feasibility');
  }
  pass('resizable/collapsible panels and EN/IT/FR/ES preserve project data');
  await call('Page.reload'); await until('document.querySelectorAll(".component-row").length===2');
  assert.equal((await stored()).asset.name, 'reference-flange.obj');
  await create('Bracket feasibility');
  assert.equal((await stored()).asset, null);
  assert.equal((await stored()).commercial.annual_volume, null);
  const fixture = join(temp, 'bracket.obj');
  const original = 'o bracket\nv 2 4 6\nv 4 4 6\nv 2 5 6\nf 1 2 3\n';
  await writeFile(fixture, original);
  await click('[aria-label="Import mesh"]');
  const { root: doc } = await call('DOM.getDocument');
  const { nodeId } = await call('DOM.querySelector', { nodeId: doc.nodeId, selector: '#mesh-file' });
  await call('DOM.setFileInputFiles', { nodeId, files: [fixture] });
  await fill('#mesh-units', 'in'); await click('#confirm-import');
  await until('!document.querySelector("dialog") && document.querySelectorAll(".component-row").length===1');
  assert.ok(await evaluate('document.querySelector(".dimension-grid").textContent.includes("50.80")'));
  const second = await stored();
  const downloaded = await evaluate(`fetch('/api/projects/${second.id}/assets/${second.asset.id}').then(r=>r.text())`);
  assert.equal(downloaded, original);
  await click('#module-brief'); await fill('#field-commercial_unit', 'kit'); await fill('#field-currency', 'USD'); await fill('#field-annual_volume', 1000);
  await click('#preview-manual'); await until('Boolean(document.querySelector("#approve-operation"))'); await click('#approve-operation');
  await until('!document.querySelector("dialog")');
  assert.equal((await stored()).commercial.commercial_unit, 'kit');
  await call('Page.reload'); await until(`document.querySelector('.revision-tag')?.textContent==='r2' && document.querySelector('[aria-label="Undo last change"]')?.disabled===false`);
  assert.equal((await stored()).commercial.commercial_unit, 'kit');
  await fill('#project-switcher', firstId); await until('document.querySelectorAll(".component-row").length===2');
  assert.equal((await stored()).commercial.currency, 'EUR');
  assert.equal((await stored()).commercial.annual_volume, 50000);
  pass('two generic projects retain distinct units, business cases and exact original mesh bytes');
  const servicePort = new URL(origin).port;
  await stop(service); await start(servicePort); await call('Page.reload');
  await until('document.querySelectorAll(".component-row").length===2');
  assert.equal((await stored()).id, firstId);
  assert.equal((await stored()).commercial.annual_volume, 50000);
  pass('actual API process restart and browser reload restore the project and geometry');

  if (processFlow) {
    await click('#module-process'); await click('#load-process-example');
    await until('Boolean(document.querySelector("#process-cycles"))');
    const before = await stored();
    assert.equal(before.process, null);
    await click('#preview-process'); await until('Boolean(document.querySelector("#approve-operation"))');
    assert.equal((await stored()).process, null);
    await click('#approve-operation'); await until('!document.querySelector("dialog") && !document.querySelector("#run-process").disabled');
    await click('#run-process'); await until('document.querySelector("#process-cell")?.dataset.renderStatus==="ready"');
    let run = await evaluate(`fetch('/api/projects/${firstId}/process/latest').then(r=>r.json())`);
    assert.equal(run.summary.output_parts, 10); assert.equal(run.duration_s, 126);
    await fill('#process-seek', 46); await until('document.querySelector("#process-cell").dataset.time==="46.000"');
    assert.equal(await evaluate('document.querySelector("#deposited-count").textContent'), '2');
    assert.equal(await evaluate('document.querySelector("#output-count").textContent'), '0');
    await fill('#process-seek', 58); await until('document.querySelector("#output-count").textContent==="2"');
    await click('#process-play'); await pause(250); await click('#process-play');
    const paused = await evaluate('document.querySelector("#process-cell").dataset.time');
    await pause(200); assert.equal(await evaluate('document.querySelector("#process-cell").dataset.time'), paused);
    await fill('#process-seek', 126); await until('document.querySelector("#output-count").textContent==="10"');
    await screenshot('process-cycle.png');
    pass('actual L0 run drives WebGL, shared-clock seek/play/pause, material ledger and deposited/output counts');
    if (serverAI) {
      await click('#ai-process-example'); const originalProject = await stored(), started = Date.now();
      await click('#send-ai'); await until('Boolean(document.querySelector("#preview-ai"))', 180000);
      assert.deepEqual(await stored(), originalProject);
      await click('#preview-ai'); await until('Boolean(document.querySelector("#approve-operation"))');
      assert.deepEqual(await stored(), originalProject);
      await click('#approve-operation'); await until('!document.querySelector("dialog")');
      const changed = await stored();
      assert.deepEqual(changed.process, { ...originalProject.process, cooling_s: 12, cycles: 3 });
      assert.deepEqual(changed.commercial, originalProject.commercial);
      assert.equal(changed.asset.sha256, originalProject.asset.sha256);
      const revisions = await evaluate(`fetch('/api/projects/${firstId}/revisions').then(r=>r.json())`);
      assert.equal(revisions[0].source.kind, 'ai'); assert.equal(revisions[0].source.tool, 'configure_process');
      await writeFile(join(output, 'process-ai.json'), JSON.stringify({ actual_server_cpu_inference: true, generation_ms: Date.now()-started, source: revisions[0].source, old_revision: originalProject.revision, new_revision: changed.revision, nonmutating_until_approval: true }, null, 2));
      pass('real server CPU model proposes only cooling/cycles; reviewed approval records provenance without browser weights');
    } else {
      await evaluate('document.querySelectorAll(".process-group").forEach(e=>e.open=true)');
      await fill('#process-cooling_s', 12); await fill('#process-cycles', 3);
      await click('#preview-process'); await until('Boolean(document.querySelector("#approve-operation"))'); await click('#approve-operation'); await until('!document.querySelector("dialog")');
    }
    assert.ok((await evaluate('document.querySelector(".process-results").innerText')).includes('Outdated result'));
    await click('#run-process'); await until('document.querySelector("#process-seek")?.max==="104"');
    run = await evaluate(`fetch('/api/projects/${firstId}/process/latest').then(r=>r.json())`);
    assert.equal(run.summary.output_parts, 6); assert.equal(run.duration_s, 104);
    await fill('#process-seek', 92); await until('document.querySelector("#deposited-count").textContent==="6"');
    await screenshot('process-updated.png');
    await stop(service); await start(servicePort); await call('Page.reload'); await until('Boolean(document.querySelector("#module-process"))'); await click('#module-process');
    await until('document.querySelector("#process-seek")?.max==="104"');
    assert.deepEqual(await evaluate(`fetch('/api/projects/${firstId}/process/latest').then(r=>r.json())`), run);
    pass('changed settings mark the old result stale; rerun changes timing/output and survives actual service replacement');
    await evaluate('document.querySelectorAll(".process-group").forEach(e=>e.open=true)');
    await fill('#process-belt_orientation_deg', 180); await click('#preview-process'); await until('Boolean(document.querySelector("#approve-operation"))'); await click('#approve-operation'); await until('!document.querySelector("dialog")');
    await click('#run-process'); await until('document.querySelector(".process-results")?.innerText.includes("cannot change orientation")');
    assert.equal((await evaluate(`fetch('/api/projects/${firstId}/process/latest').then(r=>r.json())`)).status, 'blocked');
    for (const language of ['it','fr','es','en']) { await fill('.language-picker', language); await until(`document.documentElement.lang===${JSON.stringify(language)}`); }
    pass('XYZ orientation mismatch blocks the run; new process screens switch across all four languages');
  }

  if (realAI) {
    assert.equal(await evaluate('document.querySelector("meta[name=ai-model-host]")?.content'), '/ai-assets/');
    await click('#load-ai'); await until('document.querySelector(".chat-composer .muted").textContent==="Ready"', 240000);
    await click('.ai-modes button:nth-child(2)');
    await fill('#chat-input', 'Set annual demand to 80000 and market to Appliances.');
    const before = await stored(), started = Date.now();
    await click('#send-ai'); await until('Boolean(document.querySelector("#preview-ai"))', 180000);
    const generationMs = Date.now() - started;
    assert.deepEqual(await stored(), before);
    await click('#preview-ai'); await until('Boolean(document.querySelector("#approve-operation"))');
    assert.deepEqual(await stored(), before);
    await click('#approve-operation'); await until('!document.querySelector("dialog")');
    const after = await stored();
    assert.equal(after.commercial.annual_volume, 80000); assert.equal(after.commercial.market, 'Appliances');
    assert.equal(after.asset.sha256, before.asset.sha256); assert.equal(after.commercial.notes, before.commercial.notes);
    const revisions = await evaluate(`fetch('/api/projects/${firstId}/revisions').then(r=>r.json())`);
    assert.equal(revisions[0].source.kind, 'ai');
    assert.equal(revisions[0].source.model_revision, '22942cb7d7ba4cc81bb4673549ca4d4614469b5e');
    await click('.ai-modes button:first-child'); await fill('#chat-input', 'What information do you need before selecting a polymer grade?');
    await click('#send-ai'); await until('document.querySelectorAll(".message.assistant").length===2 && document.querySelector(".chat-composer .muted").textContent==="Ready"', 180000);
    assert.deepEqual(await stored(), after);
    assert.equal(await evaluate('Boolean(document.querySelector("#preview-ai"))'), false);
    await writeFile(join(output, 'ai-result.json'), JSON.stringify({ model: revisions[0].source.model, revision: revisions[0].source.model_revision, generation_ms: generationMs, actual_browser_inference: true, preview_before_write: true, approved_revision: after.revision, conversation_nonmutating: true, answer: await evaluate('[...document.querySelectorAll(".message.assistant p")].at(-1).textContent') }, null, 2));
    pass(`real pinned browser AI → server preview → approval → durable revision (${generationMs} ms); conversation does not mutate`);
  } else if (!serverAI) {
    assert.equal(await evaluate('document.querySelector("#send-ai").disabled'), true);
    pass('AI remains explicitly unloaded and send is disabled until actual inference is ready');
  }
  await click('#module-brief'); await click('[aria-label="Isometric"]');
  await screenshot(realAI ? 'workspace-ai.png' : 'workspace-desktop.png');
  await click('#module-product'); await screenshot('workspace-product.png');
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await call('Page.reload'); await until('document.querySelector("#scene-host")?.dataset.renderStatus==="ready" && document.querySelector(".revision-tag")');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'), true);
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".copilot-panel")).visibility'), 'hidden');
  await screenshot('workspace-mobile.png');
  await click('[aria-label="Toggle copilot"]');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".copilot-panel")).visibility'), 'visible');
  await screenshot('workspace-mobile-chat.png');
  assert.equal(exceptions.length, 0, JSON.stringify(exceptions));
  pass('desktop/mobile layouts render without horizontal overflow or uncaught runtime exceptions');
} finally {
  socket?.close(); await stop(browser); await stop(service); await rm(temp, { recursive: true, force: true });
}
