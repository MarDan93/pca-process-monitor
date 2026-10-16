import assert from 'node:assert/strict';
import { test } from 'node:test';
import { describePart } from '../description.js';
import { importMesh } from '../mesh-import.js';

const buffer = (text) => new TextEncoder().encode(text).buffer;
const tetrahedron = 'v 0 0 0\nv 10 0 0\nv 0 20 0\nv 0 0 30\nf 1 3 2\nf 1 2 4\nf 2 3 4\nf 3 1 4\n';

test('description extracts Italian decimal units without inventing unspecified fields', () => {
  assert.deepEqual(describePart('14 × 9 × 4 cm, parete 0,2 cm, R 1 cm PP lucido'), { length_mm: 140, width_mm: 90, height_mm: 40, wall_mm: 2, corner_radius_mm: 10, material: 'PP', surface_finish: 'glossy' });
  assert.deepEqual(describePart('raggio 0 mm, PC/ABS'), { corner_radius_mm: 0, material: 'PC/ABS' });
  assert.deepEqual(describePart('materiale PE-HD'), { material: 'PE-HD' });
});
test('unsupported free text and negative or oversized dimensions are rejected', () => {
  for (const text of ['Un dispositivo con forma organica', 'guscio -10 x 20 x 30 mm', 'spessore -2 mm', 'raggio -1', 'spessore 0 mm', '100 x 20 x 30 m']) assert.throws(() => describePart(text));
  assert.throws(() => describePart('A'.repeat(4001)));
});
test('OBJ bounds are converted using explicit units, centred and kept separate from a solid', () => {
  const mesh = importMesh(buffer(tetrahedron), 'part.obj', 'cm');
  assert.deepEqual(mesh.dimensions_mm, { length: 100, width: 200, height: 300 });
  assert.equal(mesh.triangle_count, 4);
  assert.equal(mesh.volume_mm3, null);
  assert.equal(mesh.model_kind, 'imported_mesh');
  assert.deepEqual(mesh.components[0].vertices[0], [-50, -100, 0]);
});
test('STL binary triangle is read with millimetre bounds', () => {
  const data = new ArrayBuffer(134), view = new DataView(data);
  view.setUint32(80, 1, true);
  [[0, 0, 0], [10, 0, 0], [0, 20, 30]].flat().forEach((coordinate, i) => view.setFloat32(96 + i * 4, coordinate, true));
  const mesh = importMesh(data, 'surface.stl', 'mm');
  assert.deepEqual(mesh.dimensions_mm, { length: 10, width: 20, height: 30 });
  assert.equal(mesh.triangle_count, 1);
  assert.equal(mesh.volume_mm3, null);
});
test('invalid formats, missing units, empty and nonfinite meshes are rejected', () => {
  assert.throws(() => importMesh(buffer(tetrahedron), 'part.step', 'mm'), /STEP/);
  assert.throws(() => importMesh(buffer(tetrahedron), 'part.obj', ''), /units/);
  assert.throws(() => importMesh(buffer(''), 'part.obj', 'mm'), /surfaces/);
  assert.throws(() => importMesh(buffer(tetrahedron.replace('v 10', 'v NaN')), 'part.obj', 'mm'), /coordinates/);
  assert.throws(() => importMesh(new ArrayBuffer(13 * 1024 * 1024), 'part.obj', 'mm'), /12 MB/);
});
