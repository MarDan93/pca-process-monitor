import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const output = join(root, '.cache/ux/system');
await mkdir(output, { recursive: true });
const temp = await mkdtemp(join(tmpdir(), 'mould-workspace-test-'));
const profile = join(temp, 'chromium');
const database = join(temp, 'projects.sqlite3');
const realAI = process.argv.includes('--ai-real');
const serverAI = process.argv.includes('--server-ai');

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
  async function reloadAndReopen(){const id=await evaluate('document.querySelector("#project-switcher")?.value');await call('Page.reload');await until('document.querySelector("#project-switcher")&&!document.querySelector("#project-switcher").disabled');if(id){await fill('#project-switcher',id);await until('Boolean(document.querySelector(".revision-tag"))');}}
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
  assert.equal(await evaluate('document.querySelector("#project-switcher").value'),'');
  assert.equal(await evaluate('getComputedStyle(document.documentElement).getPropertyValue("--bg").trim().toLowerCase()'),'#fff8f4');
  assert.ok(await evaluate('document.querySelector(".brand").textContent.includes("FABRIVRA")'));
  assert.equal(await evaluate('Boolean(document.querySelector(".workflow-breadcrumb"))'),false);
  await click('#load-system-benchmark');
  await until('document.querySelector("#system-compare")?.disabled===false && document.querySelectorAll(".system-scenarios button").length===2');
  const benchmark=await stored(),id=benchmark.id;
  assert.equal(benchmark.production_system.scenarios.length,2);assert.equal(benchmark.asset.name,'fabrivra-consumer-tray.obj');
  const kit=await fetch(origin+'/api/system/example-kit');assert.equal(kit.status,200);assert.equal(kit.headers.get('content-type'),'application/zip');
  await click('#system-compare');
  await until('document.querySelectorAll(".comparison-card").length===2 && document.querySelector("#process-cell")?.dataset.renderStatus==="ready"');
  const ids=await evaluate('[...document.querySelectorAll(".comparison-card")].map(e=>e.dataset.runId)');
  const runs=await Promise.all(ids.map(r=>evaluate(`fetch('/api/projects/${id}/system/runs/${r}').then(r=>r.json())`)));
  assert.equal(runs[0].summary.output_parts,160);assert.equal(runs[1].summary.output_parts,160);
  assert.ok(runs[0].summary.system_output_per_hour>runs[1].summary.system_output_per_hour);
  await fill('#process-seek',runs[0].duration_s);await until('document.querySelector("#output-count").textContent==="160"');
  assert.equal(await evaluate('document.querySelector("#signal-cursor").dataset.runId'),runs[0].id);
  assert.equal(await evaluate('document.querySelector("#signal-cursor").dataset.time'),await evaluate('document.querySelector("#process-cell").dataset.time'));
  await fill('#signal-select','buffer_parts');
  await fill('#process-seek',runs[0].robot_trips[5].deposit_s+.1);
  assert.ok(Number((await evaluate('document.querySelector("#signal-value").textContent')).split(' ')[0])<=4);
  await screenshot('fabrivra-system-comparison.png');
  await click('#scenario-4');await until('document.querySelector("#system-recipe-cavities").value==="4"');
  await fill('#system-packaging-parts_per_container',48);assert.equal(await evaluate('document.querySelector("#system-compare").disabled'),true);
  await click('#system-preview');await until('Boolean(document.querySelector("#approve-operation"))');
  assert.equal((await stored()).production_system.scenarios[1].configuration.packaging.parts_per_container,12);
  assert.ok((await evaluate('document.querySelector("dialog").textContent')).includes('48'));
  await click('#approve-operation');await until('!document.querySelector("dialog")&&document.querySelector(".revision-tag").textContent==="r1"');
  await until('document.querySelector("#system-compare").disabled===false');
  assert.ok(await evaluate('document.querySelector(".stale-notice").textContent.includes("schedule")'));
  await click('#system-compare');
  await until(`document.querySelector('#result-4')?.dataset.runId!==${JSON.stringify(runs[1].id)} && document.querySelector('#system-compare').disabled===false`);
  const betterId=await evaluate('document.querySelector("#result-4").dataset.runId');
  const improved=await evaluate(`fetch('/api/projects/${id}/system/runs/${betterId}').then(r=>r.json())`);
  assert.ok(improved.summary.system_output_per_hour>runs[1].summary.system_output_per_hour);
  await click('#result-4');await until(`document.querySelector('#process-cell').dataset.runId===${JSON.stringify(betterId)}`);
  const change=improved.events.find(e=>e.phase==='container_change');await fill('#process-seek',(change.start_s+change.end_s)/2);
  await until('document.querySelector("#process-cell").dataset.containerState==="changing"');
  assert.equal(await evaluate('document.querySelector("#signal-cursor").dataset.time'),await evaluate('document.querySelector("#process-cell").dataset.time'));
  await screenshot('fabrivra-system-packaging.png');
  await click('[aria-label="Undo last change"]');await until('document.querySelector(".revision-tag").textContent==="r2"');
  assert.equal((await stored()).production_system.scenarios[1].configuration.packaging.parts_per_container,12);
  assert.deepEqual(await evaluate(`fetch('/api/projects/${id}/system/runs/${runs[1].id}').then(r=>r.json())`),runs[1]);
  pass('synthetic 2/4 cells, finite-buffer backpressure, live packaging, staged edits, invalidation, undo and immutable evidence');
  if(serverAI){
    await evaluate('[...document.querySelectorAll(".server-ai-modes button")].find(b=>b.textContent==="System settings").click()');
    await until('Boolean(document.querySelector("#ai-system-scenario"))');
    await fill('#ai-system-scenario',benchmark.production_system.scenarios[0].id);
    const before=await stored();await fill('#chat-input','Set container_change_s to 5 seconds and parts_per_container to 24.');await click('#send-ai');
    await until('Boolean(document.querySelector("#preview-ai"))',180000);assert.deepEqual(await stored(),before);
    await click('#preview-ai');await until('Boolean(document.querySelector("#approve-operation"))');assert.deepEqual(await stored(),before);
    await click('#approve-operation');await until('!document.querySelector("dialog")&&document.querySelector(".revision-tag").textContent==="r3"');
    const after=await stored();assert.equal(after.production_system.scenarios[0].configuration.packaging.container_change_s,5);assert.equal(after.production_system.scenarios[0].configuration.packaging.parts_per_container,24);
    await click('[aria-label="Undo last change"]');await until('document.querySelector(".revision-tag").textContent==="r4"');
    pass('actual cached CPU model → typed scenario proposal → preview → approval → undo; no inference writes');
  }
  const archive=await evaluate(`fetch('/api/projects/${id}/backup').then(r=>r.json())`);const file=join(temp,'project-backup.json');await writeFile(file,JSON.stringify(archive));
  await click('#module-reports');const {root:backupDoc}=await call('DOM.getDocument');const upload=await call('DOM.querySelector',{nodeId:backupDoc.nodeId,selector:'#restore-project-file'});
  await call('DOM.setFileInputFiles',{nodeId:upload.nodeId,files:[file]});await until('Boolean(document.querySelector("#approve-restore"))');
  assert.equal((await stored()).id,id);await click('#approve-restore');await until(`document.querySelector('#project-switcher').value!==${JSON.stringify(id)}&&!document.querySelector('dialog')`);
  const restored=await stored();assert.equal(restored.asset.sha256,benchmark.asset.sha256);assert.equal(restored.production_system.scenarios.length,2);
  const port=new URL(origin).port;await stop(service);await start(port);await call('Page.reload');
  await until('document.querySelector("#project-switcher")&&!document.querySelector("#project-switcher").disabled');
  assert.equal(await evaluate('document.querySelector("#project-switcher").value'),'');
  await fill('#project-switcher',restored.id);await until('Boolean(document.querySelector(".revision-tag"))');
  assert.equal((await stored()).asset.sha256,benchmark.asset.sha256);
  assert.equal(await evaluate(`document.querySelector('[aria-label="Undo last change"]')?.disabled`),true);
  pass('project JSON restore retains geometry/revisions/runs with fresh IDs; real service restart preserves data; reopen stays explicit');
  await click('#module-process');await until('document.querySelector("#process-cell")?.dataset.renderStatus==="ready"');
  for(const [lang,label] of [['it','Simulazione sistema'],['fr','Simulation du système'],['es','Simulación del sistema'],['en','System Simulation']]){await fill('.language-picker',lang);await until(`document.querySelector('#module-process').getAttribute('aria-label')===${JSON.stringify(label)}`);}
  await click('#module-cae');assert.ok((await evaluate('document.querySelector(".future-module").textContent')).includes('No FEM/FVM solver'));
  await click('#module-forecast');assert.ok((await evaluate('document.querySelector(".future-module").textContent')).includes('not a physical solver'));
  await click('#module-process');
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await screenshot('fabrivra-system-mobile.png');assert.equal(await evaluate('document.documentElement.scrollWidth<=window.innerWidth'),true);
  assert.equal(exceptions.length,0,JSON.stringify(exceptions));
  await writeFile(join(output,'results.json'),JSON.stringify({baseline:runs.map(r=>({cavities:r.scenario.cavities,parts:r.summary.output_parts,duration_s:r.duration_s,parts_per_hour:r.summary.system_output_per_hour,unit_cost:r.economics.unit_cost,input_sha256:r.input_sha256})),improved_packaging:{parts_per_box:48,parts_per_hour:improved.summary.system_output_per_hour},actual_native_ai:serverAI,uncaught_exceptions:exceptions.length},null,2));
  pass('light modular-F brand, four languages, explicit future modules and actual WebGL render without browser exceptions');
} finally {socket?.close();await stop(browser);await stop(service);await rm(temp,{recursive:true,force:true});}
