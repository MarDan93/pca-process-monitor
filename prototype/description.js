// Deterministic local commands, deliberately separate from future AI services.
export function describePart(text) {
  if (typeof text !== 'string' || text.length > 4000) throw new Error('Use a description of up to 4,000 characters.');
  const number = '-?\\d+(?:[.,]\\d+)?';
  const value = (s) => Number(s.replace(',', '.'));
  const scale = (unit) => ({ mm: 1, cm: 10, m: 1000 }[unit?.toLowerCase() || 'mm']);
  const changes = {};
  const dimensions = text.match(new RegExp(`(${number})\\s*[x×*]\\s*(${number})\\s*[x×*]\\s*(${number})\\s*(mm|cm|m)?\\b`, 'i'));
  if (dimensions) ['length_mm', 'width_mm', 'height_mm'].forEach((key, i) => { changes[key] = value(dimensions[i + 1]) * scale(dimensions[4]); });
  for (const [pattern, key] of [['(?:wall|thickness|spessore|parete|épaisseur|epaisseur|paroi|espesor|pared)', 'wall_mm'], ['(?:radius|raggio|rayon|radio|\\bR)', 'corner_radius_mm']]) {
    const match = text.match(new RegExp(`${pattern}\\s*(?:di|de|of|:|=)?\\s*(${number})\\s*(mm|cm|m)?\\b`, 'i'));
    if (match) changes[key] = value(match[1]) * scale(match[2]);
  }
  const material = text.match(/\b(PC\s*[\/-]\s*ABS|ABS|PP|PE(?:-HD|-LD)?|polypropylene|polyethylene|polipropilene|polietilene|polypropylène|polyéthylène|polipropileno|polietileno)\b/i);
  if (material) changes.material = material[1].toUpperCase();
  if (/\b(?:glossy|lucid[oa]|brillant[eo]?)\b/i.test(text)) changes.surface_finish = 'glossy';
  else if (/\b(?:satin|satinat[oa]|satiné|satinado)(?!\p{L})/iu.test(text)) changes.surface_finish = 'satin';
  for (const [key, n] of Object.entries(changes)) {
    if (typeof n === 'number' && (!Number.isFinite(n) || (key === 'corner_radius_mm' ? n < 0 : n <= 0) || n > 10000)) throw new Error('Use positive dimensions up to 10,000 mm; radius may be zero.');
  }
  if (!Object.keys(changes).length) throw new Error('No supported parameters found. Try: shell 140 × 90 × 40 mm, wall 2 mm, radius 10 mm, ABS.');
  return changes;
}
