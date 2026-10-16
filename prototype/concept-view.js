import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function mountConceptViewer(container, concept, { finish = 'unspecified' } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x0b131e);
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
  const material = new THREE.MeshPhysicalMaterial({ color: 0x92c8d3, metalness: 0.12, roughness: finish === 'glossy' ? 0.2 : 0.48, clearcoat: finish === 'glossy' ? 1 : 0, side: concept.model_kind === 'imported_mesh' ? THREE.DoubleSide : THREE.FrontSide });
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x6098ad, transparent: true, opacity: 0.45 });
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
  const grid = new THREE.GridHelper(extent * 5, 40, 0x2d495b, 0x182c3e);
  grid.rotation.x = Math.PI / 2;
  grid.position.z = -extent * 0.16;
  scene.add(grid);
  let disposed = false;
  function draw() {
    if (disposed) return;
    renderer.render(scene, camera);
    container.dataset.renderStatus = 'ready';
    container.dataset.drawCalls = String(renderer.info.render.calls);
  }
  function setView(view = 'iso') {
    const directions = { iso: [1.15, -1.3, 1.2], front: [0, -0.001, 2.1], rear: [0, -0.001, -2.1], side: [-2.1, 0.2, 0.3] };
    const direction = new THREE.Vector3(...(directions[view] ?? directions.iso));
    camera.position.copy(controls.target).add(direction.multiplyScalar(extent));
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
      draw();
    },
    dispose() {
      disposed = true;
      observer.disconnect();
      controls.dispose();
      scene.traverse((object) => { object.geometry?.dispose(); });
      material.dispose();
      edgeMaterial.dispose();
      grid.material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
