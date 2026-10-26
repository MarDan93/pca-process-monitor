// Illustrative functional envelopes. Positions sample the stored L0 run only.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { robotPosition, partPosition, mouldOpenness } from './kinematics.js';
export { robotPosition, partPosition } from './kinematics.js';
const mix = (a, b, u) => a.map((v, i) => v + (b[i] - v) * Math.max(0, Math.min(1, u)));

export function mountProcessCell(container, run, concept, t) {
  const s = run.scenario, layout = run.engineering, span = Math.max(240, layout?.mould.width_mm ?? s.cavities * 80 + 80), plateHeight = layout?.mould.height_mm ?? 240, plate = layout?.spec.plate_thickness_mm ?? 100, partDepth = layout?.part_cell_bounds_mm[0] ?? 50;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0xFFF8F4); renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement; canvas.setAttribute('aria-label', t('Process cell animation')); container.replaceChildren(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-2000, 2000, 1500, -1500, 1, 100000); camera.up.set(0, 0, 1);
  const controls = new OrbitControls(camera, canvas); controls.target.set(300, 0, 80);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xdec6ba, 3));
  const light = new THREE.DirectionalLight(0xffffff, 4); light.position.set(500, -1000, 2000); scene.add(light);
  const materials = [];
  const material = (color, opacity = 1) => { const m = new THREE.MeshStandardMaterial({ color, metalness: .3, roughness: .5, transparent: opacity < 1, opacity }); materials.push(m); return m; };
  const steel = material(0xa8aaa9), frame = material(0x676460), belt = material(0x8d938f), amber = material(0xe0a263), teal = material(0xEF7860), violet = material(0xAA9CE3);
  function box(x, y, z, a, b, c, mat, parent = scene) { const mesh = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), mat); mesh.position.set(x, y, z); parent.add(mesh); return mesh; }
  function cylinder(x, y, z, radius, length, mat, horizontal = false) { const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 24), mat); mesh.rotation.x = Math.PI / 2; if (horizontal) mesh.rotation.z = Math.PI / 2; mesh.position.set(x, y, z); scene.add(mesh); return mesh; }
  const textures = [];
  function label(text, x, y, z) {
    const image = document.createElement('canvas'); image.width = 512; image.height = 96;
    const ctx = image.getContext('2d'); ctx.fillStyle = '#FFF8F4'; ctx.fillRect(0, 0, 512, 96); ctx.fillStyle = '#3C2D2A'; ctx.textAlign = 'center'; ctx.font = '40px Segoe UI, sans-serif'; ctx.fillText(text, 256, 64);
    const texture = new THREE.CanvasTexture(image); textures.push(texture);
    const m = new THREE.SpriteMaterial({ map: texture, depthTest: false }); materials.push(m);
    const sprite = new THREE.Sprite(m); sprite.position.set(x, y, z); sprite.scale.set(440, 83, 1); scene.add(sprite);
  }
  box(-150, 0, -160, 1200, span + 180, 110, frame);
  cylinder(-430, 0, 0, 65, 700, amber, true);
  cylinder(-740, 0, 230, 110, 260, steel);
  cylinder(-1250, 0, 80, 160, 440, frame);
  box(-1020, 0, 340, 470, 40, 40, steel);
  box(partDepth / 2 + plate / 2, 0, 0, plate, span, plateHeight, steel);
  const moving = box(-partDepth / 2 - plate / 2, 0, 0, plate, span, plateHeight, frame);
  const transfer=run.system_configuration?.robot.transfer_distance_mm??900;
  box(transfer + s.belt_length_mm / 2, 0, -35, s.belt_length_mm, span, 45, belt);
  for (const x of [transfer+30, transfer+s.belt_length_mm-30]) box(x, 0, -150, 55, span, 200, frame);
  box(450, span / 2 + 90, 250, 70, 70, 700, frame);
  box(450, 0, 600, 1200, 65, 60, steel);
  const tool = new THREE.Group(); scene.add(tool);
  box(0, 0, 45, 35, span - 40, 25, violet, tool);
  const ram = box(0, 0, 350, 25, 25, 400, steel);
  const packaging=run.system_configuration?.packaging?.enabled;
  let containerFill=null,containerWalls=[];
  if(packaging){
    const cx=transfer+s.belt_length_mm+200,cardboard=material(0xd9b891,.6),contents=material(0xEF7860);
    box(cx,0,-110,260,span,35,frame);
    for(const side of [-1,1])containerWalls.push(box(cx+side*130,0,-20,12,span,165,cardboard));
    for(const side of [-1,1])containerWalls.push(box(cx,side*span/2,-20,260,12,165,cardboard));
    containerFill=box(cx,0,-85,230,Math.max(30,span-25),15,contents);
    label(t('Packaging'),cx,0,190);
  }
  const grid = new THREE.GridHelper(6000, 50, 0xd8c7bd, 0xefe1d8); grid.rotation.x = Math.PI / 2; grid.position.z = -230; scene.add(grid);
  label(t('Drying'), -1250, 0, 430); label(t('Feeding'), -740, 0, 480); label(t('Plasticising'), -430, 0, 160);
  label(t('Press'), 0, span / 2, 260); label(t('XYZ robot'), 500, 0, 740); label(t('Conveyor'), transfer+s.belt_length_mm/2, 0, 130);
  let geometry;
  if (concept?.components.length) {
    const positions = [];
    for (const component of concept.components) for (const tri of component.triangles) for (const i of tri) positions.push(...component.vertices[i]);
    geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.computeVertexNormals(); geometry.center();
    if (layout?.spec.ejection_axis === "y") geometry.rotateZ(-Math.PI / 2);
    if (layout?.spec.ejection_axis === "z") geometry.rotateY(Math.PI / 2);
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
    if(containerFill){
      const records=run.part_records??[],done=records.filter(p=>p.packaging_end_s<=time),changing=run.events.find(e=>e.phase==='container_change'&&e.start_s<=time&&time<e.end_s),last=done.at(-1),box=changing?null:last?.container;
      const count=box?done.filter(p=>p.container===box).length:0;
      containerFill.visible=count>0;containerFill.scale.z=Math.max(.1,count/run.system_configuration.packaging.parts_per_container*8);
      containerWalls.forEach(m=>m.material.opacity=changing ? .25 : .6);
      container.dataset.packaged=String(done.length);container.dataset.containerState=changing?'changing':'receiving';
    }
    const p = robotPosition(run, time); tool.position.set(...p); ram.position.set(p[0], 0, (p[2] + 600) / 2); ram.scale.z = (600 - p[2]) / 400;
    moving.position.x = -partDepth / 2 - plate / 2 - mouldOpenness(run, time) * (layout?.spec.opening_mm ?? 230);
    const active = run.events.filter(e => e.start_s <= time && time < e.end_s);
    for (const [mat, phase] of [[amber, 'plasticising'], [steel, 'injection'], [violet, 'pickup'], [belt, 'conveying']]) {
      mat.emissive.set(active.some(e => e.phase === phase) ? 0x3d1910 : 0x000000);
    }
    const feeding = active.find(e => e.phase === 'feeding'); granule.visible = Boolean(feeding);
    if (feeding) granule.position.set(...mix([-1250, 0, 340], [-740, 0, 340], (time - feeding.start_s) / (feeding.end_s - feeding.start_s)));
    container.dataset.time = time.toFixed(3); container.dataset.renderStatus = 'ready'; draw();
  }
  function resize() {
    const r = container.getBoundingClientRect(); if (!r.width || !r.height) return; renderer.setSize(r.width, r.height, false);
    camera.updateMatrixWorld();
    const bounds = new THREE.Box3(new THREE.Vector3(-1450, -span / 2, -230), new THREE.Vector3(transfer+400+s.belt_length_mm, span / 2 + 160, 850)).applyMatrix4(camera.matrixWorldInverse);
    const size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3()), aspect = r.width / r.height;
    const half = Math.max(size.y, size.x / aspect) * .54;
    camera.left = center.x - half * aspect; camera.right = center.x + half * aspect; camera.top = center.y + half; camera.bottom = center.y - half;
    camera.updateProjectionMatrix(); draw();
  }
  controls.addEventListener('change', draw);
  const observer = new ResizeObserver(resize); observer.observe(container);
  camera.position.set(3100, -3600, 2600); controls.update(); resize(); sample(0);
  function setView(view='iso') {
    const directions = {iso:[3100,-3600,2600],front:[0,-1,6000],side:[-6000,0,1]};
    camera.position.copy(controls.target).add(new THREE.Vector3(...(directions[view] || directions.iso)));
    controls.update(); resize();
  }
  return { sample, setView, dispose() { disposed = true; observer.disconnect(); controls.dispose(); scene.traverse(o => o.geometry?.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); renderer.dispose(); renderer.forceContextLoss(); } };
}
