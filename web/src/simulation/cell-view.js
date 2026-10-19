// Illustrative functional envelopes. Positions sample the stored L0 run only.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const mix = (a, b, u) => a.map((v, i) => v + (b[i] - v) * Math.max(0, Math.min(1, u)));
export function robotPosition(run, time) {
  for (const c of run.cycles) {
    if (time >= c.pick_start_s && time < c.pick_end_s) return mix([0, 0, 0], [0, 0, 220], (time - c.pick_start_s) / (c.pick_end_s - c.pick_start_s || 1));
    if (time >= c.pick_end_s && time < c.transfer_end_s) return mix([0, 0, 220], [900, 0, 20], (time - c.pick_end_s) / (c.transfer_end_s - c.pick_end_s));
    if (time >= c.transfer_end_s && time < c.deposit_s) return [900, 0, 20];
    if (time >= c.deposit_s && time < c.return_end_s) return mix([900, 0, 20], [0, 0, 350], (time - c.deposit_s) / (c.return_end_s - c.deposit_s || 1));
  }
  return [0, 0, 350];
}
export function partPosition(run, cycle, lane, time) {
  const s = run.scenario;
  if (time < cycle.injection_start_s + s.injection_s || time >= cycle.exit_s) return null;
  const y = (lane - (s.cavities - 1) / 2) * 80;
  if (time < cycle.pick_start_s) return [0, y, 0];
  if (time < cycle.deposit_s) { const p = robotPosition(run, time); return [p[0], p[1] + y, p[2]]; }
  return [900 + (time - cycle.deposit_s) * s.belt_speed_mm_s, y, 20];
}

export function mountProcessCell(container, run, concept, t) {
  const s = run.scenario, span = Math.max(240, s.cavities * 80 + 80);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x111c28); renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement; canvas.setAttribute('aria-label', t('Process cell animation')); container.replaceChildren(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-2000, 2000, 1500, -1500, 1, 100000); camera.up.set(0, 0, 1);
  const controls = new OrbitControls(camera, canvas); controls.target.set(300, 0, 80);
  scene.add(new THREE.HemisphereLight(0xd9eaff, 0x203044, 3));
  const light = new THREE.DirectionalLight(0xffffff, 4); light.position.set(500, -1000, 2000); scene.add(light);
  const materials = [];
  const material = (color, opacity = 1) => { const m = new THREE.MeshStandardMaterial({ color, metalness: .3, roughness: .5, transparent: opacity < 1, opacity }); materials.push(m); return m; };
  const steel = material(0x647e96), frame = material(0x253c50), belt = material(0x203e43), amber = material(0xba8448), teal = material(0x65d6bd), violet = material(0xa692d7);
  function box(x, y, z, a, b, c, mat, parent = scene) { const mesh = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), mat); mesh.position.set(x, y, z); parent.add(mesh); return mesh; }
  function cylinder(x, y, z, radius, length, mat, horizontal = false) { const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 24), mat); mesh.rotation.x = Math.PI / 2; if (horizontal) mesh.rotation.z = Math.PI / 2; mesh.position.set(x, y, z); scene.add(mesh); return mesh; }
  const textures = [];
  function label(text, x, y, z) {
    const image = document.createElement('canvas'); image.width = 512; image.height = 96;
    const ctx = image.getContext('2d'); ctx.fillStyle = '#182b3c'; ctx.fillRect(0, 0, 512, 96); ctx.fillStyle = '#d4e5f2'; ctx.textAlign = 'center'; ctx.font = '40px Segoe UI, sans-serif'; ctx.fillText(text, 256, 64);
    const texture = new THREE.CanvasTexture(image); textures.push(texture);
    const m = new THREE.SpriteMaterial({ map: texture, depthTest: false }); materials.push(m);
    const sprite = new THREE.Sprite(m); sprite.position.set(x, y, z); sprite.scale.set(440, 83, 1); scene.add(sprite);
  }
  box(-150, 0, -160, 1200, span + 180, 110, frame);
  cylinder(-430, 0, 0, 65, 700, amber, true);
  cylinder(-740, 0, 230, 110, 260, steel);
  cylinder(-1250, 0, 80, 160, 440, frame);
  box(-1020, 0, 340, 470, 40, 40, steel);
  box(75, 0, -5, 100, span, 240, steel);
  const moving = box(-100, 0, -5, 100, span, 240, frame);
  box(900 + s.belt_length_mm / 2, 0, -35, s.belt_length_mm, span, 45, belt);
  for (const x of [930, 900 + s.belt_length_mm - 30]) box(x, 0, -150, 55, span, 200, frame);
  box(450, span / 2 + 90, 250, 70, 70, 700, frame);
  box(450, 0, 600, 1200, 65, 60, steel);
  const tool = new THREE.Group(); scene.add(tool);
  box(0, 0, 45, 35, span - 40, 25, violet, tool);
  const ram = box(0, 0, 350, 25, 25, 400, steel);
  const grid = new THREE.GridHelper(6000, 50, 0x3c5267, 0x243547); grid.rotation.x = Math.PI / 2; grid.position.z = -230; scene.add(grid);
  label(t('Drying'), -1250, 0, 430); label(t('Feeding'), -740, 0, 480); label(t('Plasticising'), -430, 0, 160);
  label(t('Press'), 0, span / 2, 260); label(t('XYZ robot'), 500, 0, 740); label(t('Conveyor'), 1500, 0, 130);
  let geometry;
  if (concept?.components.length) {
    const positions = [];
    for (const component of concept.components) for (const tri of component.triangles) for (const i of tri) positions.push(...component.vertices[i]);
    geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.computeVertexNormals(); geometry.center();
  } else geometry = new THREE.BoxGeometry(70, 45, 18);
  const pieces = new THREE.InstancedMesh(geometry, teal, Math.max(1, run.cycles.length * s.cavities)); pieces.frustumCulled = false; scene.add(pieces);
  const transform = new THREE.Object3D();
  const granule = new THREE.Mesh(new THREE.SphereGeometry(18, 12, 8), amber); scene.add(granule);
  let disposed = false;
  function draw() { if (!disposed) renderer.render(scene, camera); }
  function sample(time) {
    let index = 0;
    for (const cycle of run.cycles) for (let lane = 0; lane < s.cavities; lane++) {
      const position = partPosition(run, cycle, lane, time);
      transform.position.set(...(position || [0, 0, -1000])); transform.scale.setScalar(position ? 1 : 0); transform.rotation.z = s.mould_orientation_deg * Math.PI / 180; transform.updateMatrix();
      pieces.setMatrixAt(index++, transform.matrix);
    }
    if (!index) { transform.scale.setScalar(0); transform.updateMatrix(); pieces.setMatrixAt(0, transform.matrix); }
    pieces.instanceMatrix.needsUpdate = true;
    const p = robotPosition(run, time); tool.position.set(...p); ram.position.set(p[0], 0, (p[2] + 600) / 2); ram.scale.z = (600 - p[2]) / 400;
    let openness = 0;
    for (const e of run.events) {
      if (e.phase === 'closing' && time >= e.start_s) openness = time >= e.end_s ? 0 : 1 - (time - e.start_s) / (e.end_s - e.start_s || 1);
      if (e.phase === 'opening' && time >= e.start_s) openness = time >= e.end_s ? 1 : (time - e.start_s) / (e.end_s - e.start_s || 1);
    }
    moving.position.x = -100 - openness * 230;
    const active = run.events.filter(e => e.start_s <= time && time < e.end_s);
    for (const [mat, phase] of [[amber, 'plasticising'], [steel, 'injection'], [violet, 'pickup'], [belt, 'conveying']]) {
      mat.emissive.set(active.some(e => e.phase === phase) ? 0x183d3b : 0x000000);
    }
    const feeding = active.find(e => e.phase === 'feeding'); granule.visible = Boolean(feeding);
    if (feeding) granule.position.set(...mix([-1250, 0, 340], [-740, 0, 340], (time - feeding.start_s) / (feeding.end_s - feeding.start_s)));
    container.dataset.time = time.toFixed(3); container.dataset.renderStatus = 'ready'; draw();
  }
  function resize() {
    const r = container.getBoundingClientRect(); if (!r.width || !r.height) return; renderer.setSize(r.width, r.height, false);
    camera.updateMatrixWorld();
    const bounds = new THREE.Box3(new THREE.Vector3(-1450, -span / 2, -230), new THREE.Vector3(950 + s.belt_length_mm, span / 2 + 160, 850)).applyMatrix4(camera.matrixWorldInverse);
    const size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3()), aspect = r.width / r.height;
    const half = Math.max(size.y, size.x / aspect) * .54;
    camera.left = center.x - half * aspect; camera.right = center.x + half * aspect; camera.top = center.y + half; camera.bottom = center.y - half;
    camera.updateProjectionMatrix(); draw();
  }
  controls.addEventListener('change', draw);
  const observer = new ResizeObserver(resize); observer.observe(container);
  camera.position.set(3100, -3600, 2600); controls.update(); resize(); sample(0);
  return { sample, dispose() { disposed = true; observer.disconnect(); controls.dispose(); scene.traverse(o => o.geometry?.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); renderer.dispose(); renderer.forceContextLoss(); } };
}
