// Deterministic local commands, deliberately separate from future AI services.
export function describePart(text) {
  if (typeof text !== 'string' || text.length > 4000) throw new Error('Usa una descrizione di massimo 4.000 caratteri.');
  const number = '-?\\d+(?:[.,]\\d+)?';
  const value = (s) => Number(s.replace(',', '.'));
  const scale = (unit) => ({ mm: 1, cm: 10, m: 1000 }[unit?.toLowerCase() || 'mm']);
  const changes = {};
  const dimensions = text.match(new RegExp(`(${number})\\s*[x×*]\\s*(${number})\\s*[x×*]\\s*(${number})\\s*(mm|cm|m)?\\b`, 'i'));
  if (dimensions) ['length_mm', 'width_mm', 'height_mm'].forEach((key, i) => { changes[key] = value(dimensions[i + 1]) * scale(dimensions[4]); });
  for (const [pattern, key] of [['(?:spessore|parete)', 'wall_mm'], ['(?:raggio|\\bR)', 'corner_radius_mm']]) {
    const match = text.match(new RegExp(`${pattern}\\s*(?:di|:|=)?\\s*(${number})\\s*(mm|cm|m)?\\b`, 'i'));
    if (match) changes[key] = value(match[1]) * scale(match[2]);
  }
  const material = text.match(/\b(PC\s*[\/-]\s*ABS|ABS|PP|PE(?:-HD|-LD)?|polipropilene|polietilene)\b/i);
  if (material) changes.material = material[1].toUpperCase();
  if (/\blucid[oa]\b/i.test(text)) changes.surface_finish = 'glossy';
  else if (/\bsatinat[oa]\b/i.test(text)) changes.surface_finish = 'satin';
  for (const [key, n] of Object.entries(changes)) {
    if (typeof n === 'number' && (!Number.isFinite(n) || (key === 'corner_radius_mm' ? n < 0 : n <= 0) || n > 10000)) throw new Error('Inserisci quote positive entro 10.000 mm; il raggio può essere zero.');
  }
  if (!Object.keys(changes).length) throw new Error('Non ho riconosciuto parametri. Prova: guscio 140 × 90 × 40 mm, spessore 2 mm, raggio 10 mm, ABS.');
  return changes;
}
