import test from 'node:test';
import assert from 'node:assert/strict';
import { createShellConcept, exportConceptObj } from '../shell-geometry.js';

const base = { length: 120, width: 80, height: 35 };
function signedVolume({ vertices, triangles }) {
  return triangles.reduce((sum, [a, b, c]) => {
    const [x, y, z] = vertices[a], [u, v, w] = vertices[b], [p, q, r] = vertices[c];
    return sum + (x * (v * r - w * q) + y * (w * p - u * r) + z * (u * q - v * p)) / 6;
  }, 0);
}
function assertClosedOrientedMesh(component) {
  const edges = new Map();
  for (const face of component.triangles) {
    for (let i = 0; i < 3; i++) {
      const a = face[i], b = face[(i + 1) % 3];
      const key = [Math.min(a, b), Math.max(a, b)].join(':');
      const value = edges.get(key) ?? { count: 0, direction: 0 };
      value.count++; value.direction += a < b ? 1 : -1; edges.set(key, value);
    }
  }
  for (const edge of edges.values()) assert.deepEqual(edge, { count: 2, direction: 0 });
  assert.ok(signedVolume(component) > 0);
}

for (const opening of ['rear_open', 'short_side_open', 'paired_shells']) {
  for (const wall of [1.5, 2, 2.5]) {
    test(`${opening}, ${wall} mm: closed oriented solids, bounding box and volume`, () => {
      const concept = createShellConcept({ ...base, wall, opening });
      assert.equal(concept.components.length, opening === 'paired_shells' ? 2 : 1);
      const points = concept.components.flatMap((component) => component.vertices);
      for (let axis = 0; axis < 3; axis++) {
        assert.equal(Math.min(...points.map((v) => v[axis])), [-60, -40, 0][axis]);
        assert.equal(Math.max(...points.map((v) => v[axis])), [60, 40, 35][axis]);
      }
      for (const component of concept.components) assertClosedOrientedMesh(component);
      const [a, b, depth, count] = opening === 'short_side_open' ? [80, 35, 120, 1] : [120, 80, opening === 'paired_shells' ? 17.5 : 35, opening === 'paired_shells' ? 2 : 1];
      const expected = count * (a * b * wall + 2 * wall * (depth - wall) * (a + b - 2 * wall));
      const measured = concept.components.reduce((sum, component) => sum + signedVolume(component), 0);
      assert.ok(Math.abs(measured - expected) < 1e-7);
      assert.ok(Math.abs(concept.volume_mm3 - expected) < 1e-7);
    });
  }
}
test('invalid dimensions, unknown opening and impossible cavities are rejected', () => {
  for (const value of [0, -1, null, NaN, Infinity, '120']) assert.throws(() => createShellConcept({ ...base, length: value, wall: 2, opening: 'rear_open' }));
  assert.throws(() => createShellConcept({ ...base, wall: 2, opening: 'unspecified' }));
  assert.throws(() => createShellConcept({ ...base, wall: 20, opening: 'paired_shells' }));
  assert.throws(() => createShellConcept({ ...base, wall: 40, opening: 'rear_open' }));
  assert.throws(() => createShellConcept({ ...base, wall: 18, opening: 'short_side_open' }));
});
test('unequal shells preserve assembly height, seam position and distinct component volumes', () => {
  const concept = createShellConcept({ ...base, wall: 2, opening: 'paired_shells', frontFraction: 0.7 });
  const [front, back] = concept.components;
  assert.ok(Math.abs(Math.min(...front.vertices.map((v) => v[2])) - 10.5) < 1e-10);
  assert.ok(Math.abs(Math.max(...back.vertices.map((v) => v[2])) - 10.5) < 1e-10);
  assert.ok(front.volume > back.volume);
  for (const component of concept.components) {
    assertClosedOrientedMesh(component);
    assert.ok(Math.abs(signedVolume(component) - component.volume) < 1e-7);
  }
  for (const frontFraction of [0, 1, NaN, 0.99]) assert.throws(() => createShellConcept({ ...base, wall: 2, opening: 'paired_shells', frontFraction }));
});
test('OBJ export retains separate components and valid face indices in millimetres', () => {
  const concept = createShellConcept({ ...base, wall: 2, opening: 'paired_shells' });
  const obj = exportConceptObj(concept);
  assert.match(obj, /millimetri/);
  assert.equal(obj.split('\n').filter((line) => line.startsWith('o ')).length, 2);
  const vertices = obj.split('\n').filter((line) => line.startsWith('v '));
  const faces = obj.split('\n').filter((line) => line.startsWith('f ')).map((line) => line.slice(2).split(' ').map(Number));
  assert.equal(vertices.length, 32);
  assert.ok(faces.flat().every((index) => index > 0 && index <= vertices.length));
  assert.ok(faces.slice(faces.length / 2).flat().every((index) => index > 16));
});
for (const wall of [1.5, 2, 2.5]) {
  test(`rounded paired shells, R8 and ${wall} mm: closed solids and polygonal volume`, () => {
    const concept = createShellConcept({ ...base, wall, opening: 'paired_shells', cornerRadius: 8 });
    for (const component of concept.components) {
      assertClosedOrientedMesh(component);
      assert.ok(Math.abs(signedVolume(component) - component.volume) < 1e-6);
    }
    const outerArea = 120 * 80 - (4 - Math.PI) * 8 ** 2;
    const innerArea = (120 - 2 * wall) * (80 - 2 * wall) - (4 - Math.PI) * (8 - wall) ** 2;
    const exact = outerArea * 35 - innerArea * (35 - 2 * wall);
    assert.ok(Math.abs(concept.volume_mm3 - exact) / exact < 0.0001);
    assert.equal(concept.corner_radius_mm, 8);
  });
}
test('rounded outer profiles with sharp inner corners remain closed and oriented', () => {
  for (const cornerRadius of [0.5, 2]) {
    const concept = createShellConcept({ ...base, wall: 2, opening: 'rear_open', cornerRadius });
    assertClosedOrientedMesh(concept.components[0]);
    assert.ok(Math.abs(signedVolume(concept.components[0]) - concept.volume_mm3) < 1e-6);
  }
  for (const cornerRadius of [-1, NaN, 40]) assert.throws(() => createShellConcept({ ...base, wall: 2, opening: 'rear_open', cornerRadius }));
});
