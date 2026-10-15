// Coordinates and exported geometry use millimetres. No shrinkage or draft is applied.
const openingTypes = new Set(['rear_open', 'short_side_open', 'paired_shells']);

function roundedRing(length, width, radius) {
  if (!radius) return [[length / 2, -width / 2], [length / 2, width / 2], [-length / 2, width / 2], [-length / 2, -width / 2]];
  const corners = [[length / 2 - radius, -width / 2 + radius], [length / 2 - radius, width / 2 - radius], [-length / 2 + radius, width / 2 - radius], [-length / 2 + radius, -width / 2 + radius]];
  return corners.flatMap(([x, y], corner) => Array.from({ length: 25 }, (_, step) => {
    const angle = (corner - 1) * Math.PI / 2 + step * Math.PI / 48;
    return [x + radius * Math.cos(angle), y + radius * Math.sin(angle)];
  }));
}
function area(ring) {
  return ring.reduce((sum, [x, y], i) => { const next = ring[(i + 1) % ring.length]; return sum + x * next[1] - y * next[0]; }, 0) / 2;
}
function shell(length, width, depth, wall, radius = 0) {
  if (2 * wall >= Math.min(length, width) || wall >= depth) {
    throw new Error('Lo spessore non lascia una cavità interna per questa apertura e queste dimensioni.');
  }
  if (radius >= Math.min(length, width) / 2) throw new Error('Il raggio deve essere inferiore a metà del lato più corto del profilo.');
  const outer = roundedRing(length, width, radius), inner = roundedRing(length - 2 * wall, width - 2 * wall, Math.max(0, radius - wall));
  const n = outer.length, m = inner.length;
  const vertices = [...outer.map(([x, y]) => [x, y, 0]), ...outer.map(([x, y]) => [x, y, depth]), ...inner.map(([x, y]) => [x, y, 0]), ...inner.map(([x, y]) => [x, y, depth - wall])];
  const triangles = [];
  const quad = (a, b, c, d) => { triangles.push([a, b, c], [a, c, d]); };
  for (let i = 1; i < n - 1; i++) triangles.push([n, n + i, n + i + 1]);
  for (let i = 1; i < m - 1; i++) triangles.push([2 * n + m, 2 * n + m + i + 1, 2 * n + m + i]);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    quad(i, j, j + n, i + n);
    if (n === m) quad(j, i, 2 * n + i, 2 * n + j);
  }
  for (let i = 0; i < m; i++) {
    const j = (i + 1) % m;
    quad(2 * n + j, 2 * n + i, 2 * n + m + i, 2 * n + m + j);
  }
  if (n !== m) {
    // A rounded outer corner can enclose a sharp inner corner when radius <= wall.
    for (let corner = 0; corner < 4; corner++) {
      const start = corner * 25, end = start + 24, next = (corner + 1) % 4;
      for (let i = start; i < end; i++) triangles.push([i + 1, i, 2 * n + corner]);
      quad(next * 25, end, 2 * n + corner, 2 * n + next);
    }
  }
  return { vertices, triangles, volume: area(outer) * depth - area(inner) * (depth - wall) };
}

export function createShellConcept({ length, width, height, wall, opening, frontFraction = 0.5, cornerRadius = 0 }) {
  if (![length, width, height, wall].every((value) => Number.isFinite(value) && value > 0)) {
    throw new Error('Specifica dimensioni e spessore positivi prima di generare il guscio.');
  }
  if (!openingTypes.has(opening)) throw new Error('Scegli come deve essere aperto il guscio per generare l’anteprima.');
  if (!Number.isFinite(cornerRadius) || cornerRadius < 0) throw new Error('Il raggio esterno deve essere un valore positivo o zero.');
  let components;
  if (opening === 'short_side_open') {
    const model = shell(width, height, length, wall, cornerRadius);
    components = [{ ...model, name: 'guscio_lato_corto', vertices: model.vertices.map(([x, y, z]) => [z - length / 2, x, y + height / 2]) }];
  } else if (opening === 'paired_shells') {
    if (!Number.isFinite(frontFraction) || frontFraction <= 0 || frontFraction >= 1) throw new Error('La ripartizione dei gusci deve essere compresa fra 0 e 100%.');
    const backDepth = height * (1 - frontFraction);
    const front = shell(length, width, height * frontFraction, wall, cornerRadius);
    const back = shell(length, width, backDepth, wall, cornerRadius);
    components = [
      { ...front, name: 'guscio_anteriore', vertices: front.vertices.map(([x, y, z]) => [x, y, z + backDepth]) },
      { ...back, name: 'guscio_posteriore', vertices: back.vertices.map(([x, y, z]) => [x, -y, backDepth - z]) },
    ];
  } else {
    components = [{ ...shell(length, width, height, wall, cornerRadius), name: 'guscio_retro_aperto' }];
  }
  const volume = components.reduce((total, component) => total + component.volume, 0);
  if (!Number.isFinite(volume) || volume <= 0) throw new Error('Le dimensioni non consentono un calcolo geometrico valido.');
  return { components, volume_mm3: volume, dimensions_mm: { length, width, height }, wall_mm: wall, corner_radius_mm: cornerRadius, opening, front_fraction: opening === 'paired_shells' ? frontFraction : null, units: 'mm', model_kind: 'preliminary_profile_shell' };
}

export function exportConceptObj(concept) {
  const lines = ['# Concept preliminare del guscio', '# Coordinate in millimetri; nessun ritiro o sformo applicato', '# Agganci, raccordi fuori piano, alimentazione e stampo non inclusi', `# Spessore pareti: ${concept.wall_mm} mm`, `# Raggio esterno profilo: ${concept.corner_radius_mm} mm`, `# Configurazione: ${concept.opening}`];
  let offset = 1;
  for (const component of concept.components) {
    lines.push(`o ${component.name}`);
    for (const vertex of component.vertices) lines.push(`v ${vertex.join(' ')}`);
    for (const triangle of component.triangles) lines.push(`f ${triangle.map((index) => index + offset).join(' ')}`);
    offset += component.vertices.length;
  }
  return lines.join('\n') + '\n';
}
