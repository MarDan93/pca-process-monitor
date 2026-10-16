import { AI_MODEL, parseAIResponse } from './ai-contract.js';

// The same strict contract is checked at the mutation boundary, including after inference.
export function applyAIProposal(project, changes, { expectedRevision, wall, validateGeometry }) {
  if (`${project.id}:${project.updated_at}` !== expectedRevision) throw new Error('The project changed after this request. Ask the AI again before applying.');
  const clean = parseAIResponse(JSON.stringify({ reply: 'Reviewed proposal', changes })).changes;
  const next = structuredClone(project);
  const now = new Date().toISOString();
  const record = (path) => { next.sources[path] = { kind: 'ai_proposal', model: AI_MODEL, accepted_by: 'user', recorded_at: now, engineering_validation: 'not_performed' }; };
  for (const group of ['brief', 'part']) for (const [key, value] of Object.entries(clean[group] ?? {})) { next[group][key] = value; record(`${group}.${key}`); }
  if (Object.hasOwn(clean.brief ?? {}, 'unit_cost_target_eur')) { next.brief.cost_target_mode = next.brief.unit_cost_target_eur == null ? 'exploratory' : 'fixed'; record('brief.cost_target_mode'); }
  if (Object.hasOwn(clean.geometry ?? {}, 'corner_radius_mm')) { next.part.corner_radius_mm = clean.geometry.corner_radius_mm; record('part.corner_radius_mm'); }
  const chosenWall = clean.geometry?.wall_mm ?? wall;
  if (clean.geometry?.wall_mm != null) {
    next.part.wall_options_mm = [...new Set([...next.part.wall_options_mm, chosenWall])].sort((a, b) => a - b);
    next.concept_preview.wall_mm = chosenWall; record('part.wall_options_mm'); record('concept_preview.wall_mm');
  }
  const geometryChanged = Object.keys(clean.geometry ?? {}).length || ['length_mm', 'width_mm', 'height_mm'].some((key) => Object.hasOwn(clean.part ?? {}, key));
  if (geometryChanged) validateGeometry(next.part, chosenWall);
  return next;
}
