import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/** @type {(name: string | null) => void} */
const ignoreSelection = () => {};
export function mountConceptViewer(container, concept, { finish = 'unspecified', dark = false, onSelection = ignoreSelection } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(dark ? 0x151f2b : 0xFFF8F4);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', '3D model. Drag to rotate, scroll to zoom, or use the view buttons.');
  container.replaceChildren(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10000);
  camera.up.set(0, 0, 1);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.listenToKeyEvents(canvas);
  const { length, width, height } = concept.dimensions_mm;
  const extent = Math.max(length, width, height);
  camera.near = extent / 1000;
  camera.far = extent * 100;
  controls.minDistance = extent / 4;
  controls.maxDistance = extent * 15;
  controls.target.set(0, 0, height / 2);
  scene.add(new THREE.HemisphereLight(0xddeeff, 0x243b48, 3));
  for (const [position, intensity] of [[[1, 1, -1], 4], [[-1, 0.5, 1], 3], [[0, -1, -0.5], 1.5]]) {
    const light = new THREE.DirectionalLight(0xffffff, intensity);
    light.position.set(...position).multiplyScalar(extent * 2);
    scene.add(light);
  }
  const group = new THREE.Group();
  scene.add(group);
  const material = new THREE.MeshPhysicalMaterial({ color: dark ? 0x9cb9d1 : 0xF4A483, metalness: dark ? 0.32 : 0.12, roughness: finish === 'glossy' ? 0.2 : 0.48, clearcoat: finish === 'glossy' ? 1 : 0, side: concept.model_kind === 'imported_mesh' ? THREE.DoubleSide : THREE.FrontSide });
  const edgeMaterial = new THREE.LineBasicMaterial({ color: dark ? 0x233b51 : 0x334b68, transparent: true, opacity: 0.7 });
  const meshes = [];
  for (const component of concept.components) {
    const indexed = new THREE.BufferGeometry();
    indexed.setAttribute('position', new THREE.Float32BufferAttribute(component.vertices.flat(), 3));
    indexed.setIndex(component.triangles.flat());
    const geometry = indexed.toNonIndexed();
    indexed.dispose();
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 12), edgeMaterial);
    mesh.add(edges);
    mesh.name = component.name;
    group.add(mesh);
    meshes.push(mesh);
  }
  const grid = new THREE.GridHelper(extent * 5, 40, dark ? 0x3c5267 : 0xd8c7bd, dark ? 0x243547 : 0xefe1d8);
  grid.rotation.x = Math.PI / 2;
  grid.position.z = -extent * 0.16;
  scene.add(grid);
  let disposed = false;
  let selection = null;
  const selectionBox = new THREE.Box3Helper(new THREE.Box3(), 0xC9684E);
  selectionBox.visible = false;
  scene.add(selectionBox);
  function select(name) {
    selection = meshes.find((mesh) => mesh.name === name) ?? null;
    selectionBox.visible = Boolean(selection);
    if (selection) selectionBox.box.setFromObject(selection);
    container.dataset.selection = selection?.name ?? '';
    onSelection(selection?.name ?? null);
    draw();
  }
  const raycaster = new THREE.Raycaster();
  let pointerStart;
  function pointerDown(event) { pointerStart = [event.clientX, event.clientY]; }
  function pointerUp(event) {
    if (!pointerStart || Math.hypot(event.clientX - pointerStart[0], event.clientY - pointerStart[1]) > 4) return;
    const bounds = canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1), camera);
    select(raycaster.intersectObjects(meshes, false)[0]?.object.name);
  }
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointerup', pointerUp);
  function draw() {
    if (disposed) return;
    renderer.render(scene, camera);
    container.dataset.renderStatus = 'ready';
    container.dataset.drawCalls = String(renderer.info.render.calls);
    container.dataset.camera = JSON.stringify([...camera.position.toArray(), ...controls.target.toArray()]);
  }
  function setView(view = 'iso') {
    const directions = { iso: [1.15, -1.3, 1.2], front: [0, -0.001, 2.1], rear: [0, -0.001, -2.1], side: [-2.1, 0.2, 0.3] };
    const direction = new THREE.Vector3(...(directions[view] ?? directions.iso));
    const sphere = meshes.length ? new THREE.Box3().setFromObject(group).getBoundingSphere(new THREE.Sphere()) : new THREE.Sphere(new THREE.Vector3(0, 0, 0), extent * 0.5);
    const verticalHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    const horizontalHalf = Math.atan(Math.tan(verticalHalf) * camera.aspect);
    const distance = sphere.radius / Math.sin(Math.min(verticalHalf, horizontalHalf)) * 1.08;
    controls.target.copy(sphere.center);
    camera.position.copy(controls.target).add(direction.normalize().multiplyScalar(distance));
    camera.lookAt(controls.target);
    controls.update();
    draw();
  }
  function resize() {
    const bounds = container.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    renderer.setSize(bounds.width, bounds.height, false);
    camera.aspect = bounds.width / bounds.height;
    camera.updateProjectionMatrix();
    draw();
  }
  controls.addEventListener('change', draw);
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  setView();
  return {
    setView,
    select,
    setWireframe(value) { material.wireframe = value; material.needsUpdate = true; container.dataset.wireframe = String(value); draw(); },
    setGridVisible(value) { grid.visible = value; container.dataset.gridVisible = String(value); draw(); },
    setTransparent(value) {
      material.transparent = value;
      material.opacity = value ? 0.35 : 1;
      material.depthWrite = !value;
      material.needsUpdate = true;
      draw();
    },
    setExploded(value) {
      const gap = value && concept.components.length === 2 ? extent * 0.18 : 0;
      meshes.forEach((mesh, i) => { mesh.position.z = i === 0 ? gap / 2 : -gap / 2; });
      if (selection) selectionBox.box.setFromObject(selection);
      draw();
    },
    dispose() {
      disposed = true;
      observer.disconnect();
      controls.dispose();
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointerup', pointerUp);
      scene.traverse((object) => { object.geometry?.dispose(); });
      material.dispose();
      edgeMaterial.dispose();
      grid.material.dispose();
      selectionBox.material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
