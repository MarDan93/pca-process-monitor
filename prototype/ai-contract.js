export const AI_MODEL = 'onnx-community/Qwen2.5-0.5B-Instruct';
export const AI_MODEL_REVISION = '22942cb7d7ba4cc81bb4673549ca4d4614469b5e';
export const AI_SYSTEM_PROMPT = `You collect requirements for injection moulding. Reply concisely in the UI language.
Output valid JSON only, with two keys: "reply" (a text string) and "changes" (an object).
Put ONLY user-supplied updates in changes. Never invent values. Questions have empty changes {}.
Allowed changes groups and keys:
brief: project_name, customer, reference, market, commercial_unit, annual_volume, lot_size, program_years, unit_cost_target_eur, selling_price_eur, mould_budget_eur, notes.
part: name, application, material, material_grade, length_mm, width_mm, height_mm.
geometry: wall_mm, corner_radius_mm.
Use numbers for quantities/costs/dimensions; dimensions in mm, costs in EUR. Ask if units are unclear. commercial_unit: part, kit, assembly or unspecified.
Do not change unrelated fields or repeat current values. Do not infer material from market.
For unsupported shapes/operations, explain the limitation. Only reference-shell geometry can be generated. No photo reconstruction, mould design, robot, cooling or process simulation is implemented. Never claim engineering validation. Proposed changes require user Apply.`;

export function buildAIMessages(context, language, history, mode = 'changes') {
  const examples = [
    { role: 'user', content: 'Set annual demand to 50000 and market to Automotive.' },
    { role: 'assistant', content: '{"reply":"Review the proposed demand and market.","changes":{"brief":{"annual_volume":50000,"market":"Automotive"}}}' },
  ];
  const recent = (history ?? []).slice(-4).filter((message) => ['user', 'assistant'].includes(message.role)).map(({ role, content }) => ({ role, content: String(content).slice(0, 2000) }));
  if (mode === 'chat') return [{ role: 'system', content: `You are an injection-moulding feasibility assistant. Respond in ${language}. Give a short plain-text answer, at most three sentences. Help collect customer demand, market, costs and product/material requirements. Ask one useful question if information is missing. Do not invent measurements, material properties, costs or simulation results. You cannot modify project fields in conversation mode. No mould or process solver is available. Current project: ${JSON.stringify(context).slice(0, 2500)}` }, ...recent];
  return [{ role: 'system', content: AI_SYSTEM_PROMPT + `\nUI language: ${language}. Current project (context only, not new updates): ${JSON.stringify(context).slice(0, 2500)}` }, ...examples, ...recent];
}

const strings = new Set(['project_name', 'customer', 'reference', 'market', 'notes', 'name', 'application', 'material', 'material_grade']);
const brief = new Set(['project_name', 'customer', 'reference', 'market', 'commercial_unit', 'annual_volume', 'lot_size', 'program_years', 'unit_cost_target_eur', 'selling_price_eur', 'mould_budget_eur', 'notes']);
const part = new Set(['name', 'application', 'material', 'material_grade', 'length_mm', 'width_mm', 'height_mm']);
const geometry = new Set(['wall_mm', 'corner_radius_mm']);
const optionalNumbers = new Set(['lot_size', 'unit_cost_target_eur', 'selling_price_eur', 'mould_budget_eur']);
const costs = new Set(['unit_cost_target_eur', 'selling_price_eur', 'mould_budget_eur']);

export function parseAIResponse(text) {
  if (typeof text !== 'string' || text.length > 16000) throw new Error('The model response is too long.');
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const parsed = JSON.parse(trimmed);
  if (!parsed || typeof parsed.reply !== 'string' || !parsed.reply.trim() || parsed.reply.length > 8000) throw new Error('The model did not return a valid reply.');
  if (!parsed.changes || typeof parsed.changes !== 'object' || Array.isArray(parsed.changes) || Object.keys(parsed.changes).some((key) => !['brief', 'part', 'geometry'].includes(key))) throw new Error('The model proposed unsupported changes.');
  const changes = {};
  for (const [group, allowed] of [['brief', brief], ['part', part], ['geometry', geometry]]) {
    const values = parsed.changes?.[group] ?? {};
    if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error('The model proposed invalid fields.');
    const clean = {};
    for (const [key, value] of Object.entries(values)) {
      if (!allowed.has(key)) throw new Error('The model proposed an unsupported field.');
      if (strings.has(key)) {
        if (typeof value !== 'string' || value.length > (key === 'notes' ? 4000 : 300)) throw new Error('The model proposed invalid text.');
        clean[key] = value; continue;
      }
      if (key === 'commercial_unit') {
        if (!['part', 'kit', 'assembly', 'unspecified'].includes(value)) throw new Error('The model proposed an invalid commercial unit.');
      } else if (value === null && optionalNumbers.has(key)) {
        // Clearing optional numeric fields is explicit, not a guessed zero.
      } else {
        const zeroAllowed = costs.has(key) || key === 'corner_radius_mm';
        if (typeof value !== 'number' || !Number.isFinite(value) || (zeroAllowed ? value < 0 : value <= 0)) throw new Error('The model proposed an invalid number.');
        if (key === 'program_years' && value < 0.1) throw new Error('Programme duration must be at least 0.1 years.');
        if (group === 'part' && value < 0.01) throw new Error('Dimensions must be at least 0.01 mm.');
        if (['annual_volume', 'lot_size'].includes(key) && !Number.isSafeInteger(value)) throw new Error('Quantities must be positive whole numbers.');
        if ((group === 'part' || group === 'geometry') && value > 10000) throw new Error('The demo accepts dimensions up to 10,000 mm.');
      }
      clean[key] = value;
    }
    if (Object.keys(clean).length) changes[group] = clean;
  }
  return { reply: parsed.reply, changes };
}

export function hasAIChanges(changes) { return Object.values(changes ?? {}).some((group) => Object.keys(group).length); }
