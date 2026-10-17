import { Shape, Path, ExtrudeGeometry } from 'three';

// Original synthetic visual fixture, not a validated mouldable product.
export function referenceFlange() {
  const shape = new Shape();
  shape.absarc(0, 0, 38, 0, Math.PI * 2, false);
  for (const [x, y, radius] of [[0, 0, 14], [25, 0, 3.5], [-25, 0, 3.5], [0, 25, 3.5], [0, -25, 3.5]]) {
    const hole = new Path(); hole.absarc(x, y, radius, 0, Math.PI * 2, true); shape.holes.push(hole);
  }
  const neck = new Shape(); neck.absarc(0, 0, 19, 0, Math.PI * 2, false);
  const hole = new Path(); hole.absarc(0, 0, 14, 0, Math.PI * 2, true); neck.holes.push(hole);
  const geometries = [new ExtrudeGeometry(shape, { depth: 7, bevelEnabled: false, curveSegments: 48 }), new ExtrudeGeometry(neck, { depth: 17, bevelEnabled: false, curveSegments: 48 })];
  const lines = ['# Mould Studio original synthetic reference, millimetres'];
  let offset = 0;
  geometries.forEach((geometry, index) => {
    lines.push(`o ${index ? 'neck' : 'flange'}`);
    const positions = geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) lines.push(`v ${positions.getX(i)} ${positions.getY(i)} ${positions.getZ(i) + (index ? 7 : 0)}`);
    for (let i = 0; i < positions.count; i += 3) lines.push(`f ${offset + i + 1} ${offset + i + 2} ${offset + i + 3}`);
    offset += positions.count; geometry.dispose();
  });
  return new File([lines.join('\n')], 'reference-flange.obj', { type: 'text/plain' });
}
