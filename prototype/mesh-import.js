import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

export function importMesh(buffer, name, units) {
  const factor = { mm: 1, cm: 10, m: 1000, in: 25.4 }[units];
  if (!factor) throw new Error('Conferma l’unità del file prima di importarlo.');
  if (buffer.byteLength > 12 * 1024 * 1024) throw new Error('Questa demo accetta file fino a 12 MB.');
  const extension = name.split('.').pop().toLowerCase();
  if (!['obj', 'stl'].includes(extension)) throw new Error('Importa una mesh OBJ o STL. STEP richiede il motore CAD, previsto nella prossima fase.');
  const geometries = [];
  let object;
  try {
    if (extension === 'stl') geometries.push(new STLLoader().parse(buffer));
    else {
      object = new OBJLoader().parse(new TextDecoder().decode(buffer));
      object.traverse((node) => { if (node.isMesh) geometries.push(node.geometry); });
    }
    let faces = 0;
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    const components = geometries.map((geometry, part) => {
      const position = geometry.getAttribute('position');
      const count = geometry.index?.count ?? position?.count ?? 0;
      faces += count / 3;
      if (faces > 100000) throw new Error('La demo visualizza fino a 100.000 triangoli. Riduci la mesh prima di importarla.');
      if (!position || count % 3) throw new Error('La mesh non contiene triangoli validi.');
      const vertices = Array.from({ length: position.count }, (_, i) => {
        const vertex = [position.getX(i), position.getY(i), position.getZ(i)].map((v) => v * factor);
        vertex.forEach((v, axis) => {
          if (!Number.isFinite(v) || Math.abs(v) > 10000000) throw new Error('Il file contiene coordinate non valide o troppo grandi.');
          min[axis] = Math.min(min[axis], v); max[axis] = Math.max(max[axis], v);
        });
        return vertex;
      });
      const triangles = Array.from({ length: count / 3 }, (_, i) => [0, 1, 2].map((j) => geometry.index ? geometry.index.getX(i * 3 + j) : i * 3 + j));
      return { name: `mesh_${part + 1}`, vertices, triangles };
    }).filter((part) => part.triangles.length);
    if (!faces || !Number.isFinite(min[0]) || Math.max(...max.map((v, i) => v - min[i])) <= 0) throw new Error('Non sono state trovate superfici 3D utilizzabili.');
    const offset = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, min[2]];
    for (const component of components) component.vertices = component.vertices.map((vertex) => vertex.map((v, i) => v - offset[i]));
    return { components, dimensions_mm: { length: max[0] - min[0], width: max[1] - min[1], height: max[2] - min[2] }, volume_mm3: null, units: 'mm', source_units: units, file_name: name, triangle_count: faces, model_kind: 'imported_mesh' };
  } finally {
    geometries.forEach((geometry) => geometry.dispose());
    object?.traverse((node) => { if (node.material) for (const material of [].concat(node.material)) material.dispose(); });
  }
}
