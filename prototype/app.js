'use strict';
import { createShellConcept, exportConceptObj } from './shell-geometry.js';
import { describePart } from './description.js';
import { renderWorkspace, studio } from './workspace.js';
import { localAI } from './ai-client.js';
import { renderAIPanel, updateAIPanel } from './ai-panel.js';
import { applyAIProposal } from './ai-apply.js';
import { mountCADIcons } from './cad-ui.js';
import { t, formatNumber, formatMoney, getLanguage, setLanguage, startLocalization } from './i18n.js';

const STORAGE_KEY = 'injection-moulding-brief-v1';
const BACKUP_KEY = `${STORAGE_KEY}-before-example`;
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const numberFormat = { format: formatNumber };
const moneyFormat = { format: formatMoney };
const displayNumber = (value, suffix = '') => value == null ? t('Not specified') : `${numberFormat.format(value)}${suffix ? ' ' + t(suffix.trim()) : ''}`;
const displayMoney = (value) => value == null ? t('Not specified') : moneyFormat.format(value);

const briefFields = [
  { key: 'project_name', label: 'Project name', placeholder: 'E.g. Device enclosure — new project', full: true },
  { key: 'customer', label: 'Customer', placeholder: 'Customer name or reference', optional: true },
  { key: 'reference', label: 'Part / enquiry reference', placeholder: 'E.g. RFQ-2026-014', optional: true },
  { key: 'market', label: 'Target market', placeholder: 'E.g. Appliances, automotive, medical', optional: true },
  { key: 'commercial_unit', label: 'Commercial unit', type: 'select', choices: [['unspecified', 'Not specified'], ['part', 'Individual part'], ['kit', 'Kit'], ['assembly', 'Assembly']] },
  { key: 'annual_volume', label: 'Annual demand', type: 'number', min: 1, step: 1, placeholder: 'Good parts / year', help: 'Demand guides cavity count and production capacity.' },
  { key: 'lot_size', label: 'Batch size', type: 'number', min: 1, step: 1, optional: true, placeholder: 'Parts / batch' },
  { key: 'program_years', label: 'Programme duration', type: 'number', min: 0.1, step: 'any', placeholder: 'Years', help: 'Time horizon for evaluating investments.' },
  { key: 'cost_target_mode', label: 'Cost target approach', type: 'select', full: true, choices: [['exploratory', 'Estimate cost by comparing alternatives'], ['fixed', 'Compare against a fixed cost target']], help: 'Set a target after comparing configurations.' },
  { key: 'unit_cost_target_eur', label: 'Target manufacturing cost', type: 'number', min: 0, step: 'any', optional: true, placeholder: '€ / good part', help: 'Leave blank while exploring. Entering a value sets a fixed target.' },
  { key: 'selling_price_eur', label: 'Selling price', type: 'number', min: 0, step: 'any', optional: true, placeholder: '€ / part', help: 'Separate from manufacturing cost.' },
  { key: 'mould_budget_eur', label: 'Mould budget', type: 'number', min: 0, step: 'any', optional: true, placeholder: '€', help: 'Mould investment; automation is evaluated separately.' },
  { key: 'notes', label: 'Customer request and constraints', type: 'textarea', full: true, placeholder: 'Product function, deliveries, quality and special requirements…' },
];
const partFields = [
  { key: 'name', label: 'Part name', placeholder: 'E.g. Cosmetic enclosure', full: true },
  { key: 'application', label: 'Application', placeholder: 'E.g. Indoor electronic device', full: true },
  { key: 'material', label: 'Material or alternatives', placeholder: 'E.g. ABS / PC-ABS', help: 'Record alternatives to compare.' },
  { key: 'material_grade', label: 'Material grade', optional: true, placeholder: 'Material manufacturer and grade', help: 'Required for appropriate physical properties.' },
  { key: 'length_mm', label: 'External length', type: 'number', min: 0.01, step: 'any', placeholder: 'mm' },
  { key: 'width_mm', label: 'External width', type: 'number', min: 0.01, step: 'any', placeholder: 'mm' },
  { key: 'height_mm', label: 'External height', type: 'number', min: 0.01, step: 'any', placeholder: 'mm' },
  { key: 'corner_radius_mm', label: 'External profile radius', type: 'number', min: 0, step: 'any', placeholder: 'mm', help: 'Rounds the shell outline; other fillets remain to be designed.' },
  { key: 'nominal_wall_mm', label: 'Nominal wall thickness', type: 'number', min: 0.01, step: 'any', optional: true, placeholder: 'mm' },
  { key: 'surface_finish', label: 'Surface finish', type: 'select', choices: [['unspecified', 'Not specified'], ['glossy', 'Glossy'], ['satin', 'Satin'], ['textured', 'Textured']] },
  { key: 'fastening', label: 'Fastening system', type: 'select', choices: [['unspecified', 'Not specified'], ['snap_only', 'Snap fits only'], ['screws_only', 'Screws only'], ['mixed', 'Screws and snap fits']] },
  { key: 'opening', label: 'Shell configuration', type: 'select', choices: [['unspecified', 'Not specified'], ['paired_shells', 'Two shells: front and rear'], ['rear_open', 'Rear-open shell'], ['short_side_open', 'Shell open on a short side']] },
  { key: 'dimension_basis', label: 'Dimensions refer to', type: 'select', choices: [['unspecified', 'To confirm'], ['assembly', 'Assembled product'], ['per_shell', 'Each shell (two equal halves)']] },
  { key: 'front_share_percent', label: 'Front shell height share', type: 'number', min: 1, max: 99, step: 'any', placeholder: '%', optional: true, help: 'The remaining height belongs to the rear shell.' },
  { key: 'aesthetic_surfaces', label: 'Cosmetic surfaces', type: 'select', choices: [['unspecified', 'Not specified'], ['front_sides', 'Front face and side walls'], ['front_only', 'Front face only'], ['all', 'All surfaces, including internal']] },
  { key: 'snap_service', label: 'Snap-fit disassembly', type: 'select', choices: [['unspecified', 'Not specified'], ['tool', 'With a tool, without damage'], ['manual', 'By hand, frequent opening'], ['permanent', 'Permanent assembly']] },
  { key: 'snap_count', label: 'Snap-fit count', type: 'number', min: 1, step: 1, placeholder: 'Not specified', optional: true, help: 'Snap-fit geometry and sizing are not yet developed.' },
  { key: 'snap_layout', label: 'Snap-fit layout', type: 'select', choices: [['unspecified', 'Not specified'], ['long_sides', 'Three on each long side'], ['distributed', 'Two per long side, one per short side']] },
  { key: 'snap_cycles', label: 'Required assembly cycles', type: 'number', min: 1, step: 1, optional: true, placeholder: 'Not specified', help: 'To verify against material grade and snap-fit geometry.' },
  { key: 'electronics_configuration', label: 'Electronics configuration', type: 'select', choices: [['unspecified', 'Not specified'], ['single_pcb', 'One PCB, no battery'], ['pcb_battery', 'PCB and battery'], ['multiple_pcbs', 'Multiple PCBs']] },
  { key: 'pcb_count', label: 'PCB count', type: 'number', min: 1, step: 1, optional: true, placeholder: 'Not specified' },
  { key: 'external_openings', label: 'Required openings', type: 'select', choices: [['unspecified', 'Not specified'], ['connector', 'Connector opening'], ['connector_vents', 'Connector and ventilation'], ['connector_protected_vent', 'Connector and protected pressure vent'], ['none', 'No openings']] },
  { key: 'ip_target', label: 'Ingress protection target', type: 'select', choices: [['unspecified', 'Not specified'], ['none', 'No IP rating required'], ['IP54', 'IP54 target'], ['IP65', 'IP65 target']], help: 'Design requirement; qualification has not been performed.' },
  { key: 'thermal_strategy', label: 'Thermal / ventilation strategy', type: 'select', choices: [['unspecified', 'Not specified'], ['compare', 'Compare sealed enclosure and protected airflow'], ['sealed', 'Sealed enclosure, pressure vent'], ['protected_airflow', 'Airflow through a protected module']] },
  { key: 'connector_strategy', label: 'Connector sealing', type: 'select', choices: [['unspecified', 'Not specified'], ['panel_sealed', 'Sealed panel connector'], ['sealed_cover', 'Sealed cover'], ['compare', 'Compare alternatives']] },
  { key: 'ip_in_use', label: 'Required IP operating condition', type: 'select', choices: [['unspecified', 'Not specified'], ['with_cable', 'Also while operating with cable connected'], ['closed_only', 'Cover closed, cable disconnected only'], ['compare', 'Compare both conditions']] },
  { key: 'pcb_layout', label: 'PCB layout', type: 'select', choices: [['unspecified', 'Not specified'], ['two_by_two', 'Two by two on one level'], ['two_levels', 'Two levels, two PCBs per level'], ['stacked', 'Four stacked PCBs']] },
  { key: 'pcb_length_mm', label: 'PCB length', type: 'number', min: 0.01, step: 'any', optional: true, placeholder: 'mm' },
  { key: 'pcb_width_mm', label: 'PCB width', type: 'number', min: 0.01, step: 'any', optional: true, placeholder: 'mm' },
  { key: 'pcb_height_mm', label: 'PCB and component height', type: 'number', min: 0.01, step: 'any', optional: true, placeholder: 'mm' },
  { key: 'aesthetic_requirements', label: 'Cosmetic surfaces and quality', type: 'textarea', full: true, placeholder: 'Visible surfaces, finish, colour, permitted marks and tolerances…' },
  { key: 'undercuts', label: 'Fasteners, undercuts and ejection', type: 'textarea', full: true, placeholder: 'Describe clips, bosses, side openings and ejection constraints…' },
];
const machineFields = [
  { key: 'name', label: 'Press name / model', placeholder: 'Manufacturer and model', full: true },
  { key: 'ownership', label: 'Availability', type: 'select', choices: [['existing', 'Already available'], ['purchase', 'To purchase']] },
  { key: 'clamping_force_kn', label: 'Clamping force', type: 'number', min: 0.01, step: 'any', placeholder: 'kN', help: '1 tonne-force = 9.80665 kN.' },
  { key: 'tie_bar_width_mm', label: 'Tie-bar clearance — width', type: 'number', min: 0.01, step: 'any', placeholder: 'mm', optional: true },
  { key: 'tie_bar_height_mm', label: 'Tie-bar clearance — height', type: 'number', min: 0.01, step: 'any', placeholder: 'mm', optional: true },
  { key: 'min_mould_height_mm', label: 'Minimum mould height', type: 'number', min: 0, step: 'any', placeholder: 'mm', optional: true },
  { key: 'max_mould_height_mm', label: 'Maximum mould height', type: 'number', min: 0.01, step: 'any', placeholder: 'mm', optional: true },
  { key: 'opening_stroke_mm', label: 'Opening stroke', type: 'number', min: 0.01, step: 'any', placeholder: 'mm', optional: true },
  { key: 'shot_volume_cm3', label: 'Maximum shot volume', type: 'number', min: 0.01, step: 'any', placeholder: 'cm³', optional: true, help: 'Machine-rated volume, not material-specific shot weight.' },
  { key: 'hourly_rate_eur', label: 'Machine hourly rate', type: 'number', min: 0, step: 'any', placeholder: '€ / hour', optional: true, help: 'Rate inclusions will be defined in the cost model.' },
  { key: 'purchase_cost_eur', label: 'Purchase investment', type: 'number', min: 0, step: 'any', placeholder: '€', optional: true, help: 'Relevant to presses being purchased.' },
];

function blankValues(fields) { return Object.fromEntries(fields.map((f) => [f.key, f.type === 'number' ? null : f.type === 'select' ? f.choices[0][0] : ''])); }
function newProject() {
  const now = new Date().toISOString();
  const part = { ...blankValues(partFields), name: 'Cosmetic shells with snap fits', application: 'Indoor electronic device', material: 'ABS; PC/ABS; PP; PE; copolymer grades to be specified', length_mm: 120, width_mm: 80, height_mm: 35, corner_radius_mm: 8, surface_finish: 'glossy', fastening: 'snap_only', opening: 'paired_shells', dimension_basis: 'assembly', front_share_percent: 50, aesthetic_surfaces: 'front_sides', snap_service: 'tool', snap_count: 6, snap_layout: 'long_sides', snap_cycles: 1000, wall_options_mm: [1.5, 2, 2.5], aesthetic_requirements: 'High appearance requirements for the front face and side walls. Colour, gloss and acceptance criteria are to be defined.', undercuts: 'Six snap fits, three on each long side, removable with a tool without damage. Target: 1,000 cycles. Geometry, forces, ejection directions and slide strokes are to be defined.' };
  const sources = Object.fromEntries(['name', 'application', 'material', 'length_mm', 'width_mm', 'height_mm', 'corner_radius_mm', 'surface_finish', 'fastening', 'opening', 'dimension_basis', 'front_share_percent', 'aesthetic_surfaces', 'snap_service', 'snap_count', 'snap_layout', 'snap_cycles', 'wall_options_mm', 'aesthetic_requirements', 'undercuts'].map((key) => [`part.${key}`, { kind: 'requirement', note: 'Demo-case requirement agreed with the user; not a production measurement.' }]));
  Object.assign(part, { electronics_configuration: 'multiple_pcbs', pcb_count: 4, external_openings: 'connector_protected_vent', ip_target: 'IP65', thermal_strategy: 'sealed', connector_strategy: 'sealed_cover', ip_in_use: 'with_cable', pcb_layout: 'two_by_two', pcb_length_mm: 40, pcb_width_mm: 25, pcb_height_mm: 8 });
  for (const key of ['electronics_configuration', 'pcb_count', 'external_openings', 'ip_target', 'thermal_strategy', 'connector_strategy', 'ip_in_use', 'pcb_layout', 'pcb_length_mm', 'pcb_width_mm', 'pcb_height_mm']) sources[`part.${key}`] = { kind: 'requirement', note: 'Customer requirement; geometry and engineering qualification not yet verified.' };
  sources['brief.program_years'] = { kind: 'requirement', note: 'Initial five-year duration chosen for the demo; editable.' };
  sources['brief.cost_target_mode'] = { kind: 'requirement', note: 'Estimate cost from alternatives, then set a target.' };
  return { schema_version: 4, id: crypto.randomUUID(), created_at: now, updated_at: now, dataset_kind: 'user', currency: 'EUR', units: { length: 'mm', force: 'kN', volume: 'cm3', time: 's' }, brief: { ...blankValues(briefFields), program_years: 5, cost_target_mode: 'exploratory' }, part, concept_preview: { wall_mm: null }, machines: [], sources };
}
let storageAvailable = true;
let initialLoadError = '';
function normalizeStoredProject(parsed) {
  if (![1, 2, 3, 4].includes(parsed?.schema_version) || !parsed.brief || !parsed.part || !Array.isArray(parsed.machines) || !parsed.sources || !parsed.id) throw new Error('Unrecognised project format.');
  parsed.brief.market ??= '';
  parsed.brief.commercial_unit ??= 'unspecified';
  if (!parsed.brief.cost_target_mode) parsed.brief.cost_target_mode = parsed.brief.unit_cost_target_eur == null ? 'exploratory' : 'fixed';
  if (parsed.schema_version === 1) {
    parsed.part.surface_finish ??= 'unspecified';
    parsed.part.fastening ??= 'unspecified';
    if (parsed.part.wall_options_mm == null) {
      parsed.part.wall_options_mm = parsed.part.nominal_wall_mm > 0 ? [parsed.part.nominal_wall_mm] : [];
      if (parsed.part.wall_options_mm.length) parsed.sources['part.wall_options_mm'] = { ...(parsed.sources['part.nominal_wall_mm'] ?? { kind: 'user' }), note: 'Variant derived from the previously recorded nominal wall.' };
    }
    parsed.schema_version = 2;
  }
  if (!Array.isArray(parsed.part.wall_options_mm) || !parsed.part.wall_options_mm.every((v) => Number.isFinite(v) && v > 0)) throw new Error('Invalid wall thickness variants.');
  if (parsed.schema_version < 3) {
    for (const field of partFields.filter((field) => ['opening', 'dimension_basis', 'front_share_percent', 'aesthetic_surfaces', 'snap_service', 'snap_count'].includes(field.key))) parsed.part[field.key] ??= field.type === 'number' ? null : 'unspecified';
    parsed.concept_preview = { wall_mm: null };
    parsed.schema_version = 3;
  }
  if (parsed.schema_version < 4) {
    parsed.part.corner_radius_mm ??= 0;
    parsed.part.snap_layout ??= 'unspecified';
    parsed.part.snap_cycles ??= null;
    parsed.schema_version = 4;
  }
  for (const field of partFields.filter((f) => ['electronics_configuration', 'pcb_count', 'external_openings', 'ip_target', 'thermal_strategy', 'connector_strategy', 'ip_in_use', 'pcb_layout', 'pcb_length_mm', 'pcb_width_mm', 'pcb_height_mm'].includes(f.key))) parsed.part[field.key] ??= field.type === 'number' ? null : 'unspecified';
  return parsed;
}
function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return newProject();
    return normalizeStoredProject(JSON.parse(raw));
  } catch {
    storageAvailable = false;
    initialLoadError = 'The previous project cannot be read and has been preserved. This session uses a new brief.';
    return newProject();
  }
}
let project = loadProject();
let currentView = 'brief';
let editMachineId = null;
let toastTimeout;
const invalidFields = new Set();
let activeViewer = null;
let viewerRequest = 0;
let currentConceptModel = null;
let previewExploded = true;
let previewTransparent = false;
let previewCamera = 'iso';
let previewWireframe = false;
let previewGrid = true;
let assetRequest = 0;

function clearStudioAssets() {
  localAI.clear();
  assetRequest++;
  if (studio.photo) URL.revokeObjectURL(studio.photo);
  Object.assign(studio, { tab: 'ai', draft: 'Shell 120 × 80 × 35 mm, wall 2 mm, radius 8 mm, glossy ABS', imported: null, photo: null, photoName: '', source: 'parametric', proposal: null, previous: null, message: '' });
}

function notify(message) {
  clearTimeout(toastTimeout);
  $('#toast').textContent = t(message);
  $('#toast').hidden = false;
  toastTimeout = setTimeout(() => { $('#toast').hidden = true; }, 5500);
}
function save() {
  project.updated_at = new Date().toISOString();
  if (!storageAvailable) { $('#save-status').textContent = 'Memory only · export the brief'; return false; }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(project)); $('#save-status').textContent = 'Saved in browser'; return true; }
  catch { storageAvailable = false; $('#save-status').textContent = 'Memory only · export the brief'; notify('Local storage unavailable. Export the brief to keep a copy.'); return false; }
}
function fieldMarkup(field, group, values) {
  const id = `${group}-${field.key}`;
  const value = values[field.key] ?? '';
  const common = `id="${id}" name="${field.key}" data-group="${group}" data-key="${field.key}" ${field.help ? `aria-describedby="${id}-help"` : ''}`;
  let input;
  if (field.type === 'textarea') input = `<textarea ${common} placeholder="${esc(field.placeholder)}">${esc(value)}</textarea>`;
  else if (field.type === 'select') input = `<select ${common}>${field.choices.map(([key, label]) => `<option value="${key}" ${key === value ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select>`;
  else input = `<input ${common} type="${field.type ?? 'text'}" value="${esc(value)}" placeholder="${esc(field.placeholder)}" ${field.type === 'number' ? `min="${field.min}" ${field.max != null ? `max="${field.max}"` : ''} step="${field.step}" inputmode="decimal"` : ''} ${group === 'machine' && field.key === 'name' ? 'required' : ''}>`;
  const unit = { annual_volume: 'parts/year', lot_size: 'parts/batch', program_years: 'years', front_share_percent: '%', unit_cost_target_eur: '€/good part', selling_price_eur: '€/part', mould_budget_eur: '€', clamping_force_kn: 'kN', shot_volume_cm3: 'cm³', hourly_rate_eur: '€/h', purchase_cost_eur: '€' }[field.key] ?? (field.key.endsWith('_mm') ? 'mm' : '');
  return `<div class="field ${field.full ? 'full' : ''}"><label for="${id}">${esc(field.label)}${unit ? `<span class="field-unit">${esc(unit)}</span>` : ''}${field.optional ? '<span class="optional">optional</span>' : ''}</label>${input}${field.help ? `<small id="${id}-help">${esc(field.help)}</small>` : ''}</div>`;
}
function card(title, subtitle, number, body) {
  return `<section class="card"><div class="card-heading"><div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div><span class="section-number">${esc(number)}</span></div>${body}</section>`;
}
function grid(fields, group, values) { return `<div class="field-grid">${fields.map((f) => fieldMarkup(f, group, values)).join('')}</div>`; }
function nextButton(view, label) { return `<div class="step-actions"><p>You can complete the remaining fields later.</p><button class="button primary" data-go="${view}">${esc(label)} <span aria-hidden="true">→</span></button></div>`; }

function renderBrief() {
  return card('Discuss the customer request', 'Start with demand, market and commercial requirements.', 'AI', renderAIPanel())
    + card('Enquiry details', 'Organise the project and its references.', '01', grid(briefFields.slice(0, 3), 'brief', project.brief))
    + card('Demand and commercial targets', 'Inputs for comparing configurations.', '02', grid(briefFields.slice(3, -1), 'brief', project.brief) + '<p class="form-note">Annual demand is unrestricted. Good-part cost, selling price and mould investment are separate inputs.</p>')
    + card('Project requirements', 'Capture the requirements driving engineering decisions.', '03', grid(briefFields.slice(-1), 'brief', project.brief))
    + nextButton('part', 'Define part and material');
}
function renderPart() {
  const keys = (names) => partFields.filter((field) => names.includes(field.key));
  return card('Part to manufacture', 'Demo case: enclosure for an indoor electronic device.', '01', grid(partFields.slice(0, 4), 'part', project.part))
    + card('Shell geometry', 'Set assembly dimensions, outline and height split.', '02', grid(keys(['length_mm', 'width_mm', 'height_mm', 'corner_radius_mm', 'nominal_wall_mm', 'opening', 'dimension_basis', 'front_share_percent']), 'part', project.part))
    + card('Appearance and snap fits', 'Requirements remain separate from mechanical verification.', '03', grid(keys(['surface_finish', 'fastening', 'aesthetic_surfaces', 'snap_service', 'snap_count', 'snap_layout', 'snap_cycles', 'aesthetic_requirements', 'undercuts']), 'part', project.part))
    + card('Electronics, openings and protection', 'Define functions that affect part design.', '04', grid(keys(['electronics_configuration', 'pcb_count', 'pcb_layout', 'pcb_length_mm', 'pcb_width_mm', 'pcb_height_mm', 'external_openings', 'ip_target', 'ip_in_use', 'thermal_strategy', 'connector_strategy']), 'part', project.part))
    + card('Wall thickness variants', 'Compare alternatives before selecting the final nominal wall.', '05', '<div id="wall-comparison"></div>')
    + '<div class="summary-note">This demo generates a simplified rectangular shell. STEP and mould modelling are planned modules.</div>'
    + nextButton('concept', 'Open 3D preview');
}
function renderWallComparison() {
  const target = $('#wall-comparison');
  if (!target) return;
  const options = project.part.wall_options_mm;
  const finish = partFields.find((f) => f.key === 'surface_finish').choices.find(([key]) => key === project.part.surface_finish)?.[1] ?? 'Not specified';
  const fastening = partFields.find((f) => f.key === 'fastening').choices.find(([key]) => key === project.part.fastening)?.[1] ?? 'Not specified';
  target.innerHTML = `<div class="wall-chips" aria-label="Configured wall variants">${options.map((v) => `<span class="wall-chip">${displayNumber(v, ' mm')}<button type="button" data-remove-wall="${v}" aria-label="${t('Remove variant')} ${displayNumber(v, ' mm')}">×</button></span>`).join('')}${options.length ? '' : '<p class="muted">No wall thickness variants configured.</p>'}</div><form id="wall-form" class="wall-form"><div><label for="wall-new-value">Add wall thickness <span class="field-unit">mm</span></label><input id="wall-new-value" name="wall" type="number" min="0.01" step="any" inputmode="decimal" placeholder="E.g. 3" required></div><button class="button secondary" type="submit">Add variant</button></form>${options.length ? `<div class="comparison-scroll"><table class="data-table comparison-table"><caption>Configured alternatives · engineering checks pending</caption><thead><tr><th scope="col">Variant</th><th scope="col">Wall thickness</th><th scope="col">Finish</th><th scope="col">Fasteners</th></tr></thead><tbody>${options.map((v, i) => `<tr><th scope="row">S${i + 1}</th><td>${displayNumber(v, ' mm')}</td><td>${esc(finish)}</td><td>${esc(fastening)}</td></tr>`).join('')}</tbody></table></div>` : ''}<p class="form-note">Wall variants are candidates. Material, appearance, warpage and snap-fit performance require engineering verification.</p><button type="button" class="text-button" id="complete-case-requirements">Complete missing requirements from the demo case</button>`;
}
function previewWall() {
  return project.part.wall_options_mm.includes(project.concept_preview.wall_mm) ? project.concept_preview.wall_mm : project.part.wall_options_mm[0] ?? project.part.nominal_wall_mm;
}
function conceptFromProject(p = project.part, wall = previewWall()) {
  if (p.opening === 'paired_shells' && p.dimension_basis === 'unspecified') throw new Error('Confirm whether dimensions refer to the assembly or each shell.');
  if (p.opening === 'paired_shells' && !(p.front_share_percent > 0 && p.front_share_percent < 100)) throw new Error('Define the height split between shells.');
  if (p.opening === 'paired_shells' && p.dimension_basis === 'per_shell' && p.front_share_percent !== 50) throw new Error('For unequal shells, use assembly dimensions and a height split.');
  return createShellConcept({ length: p.length_mm, width: p.width_mm, height: p.opening === 'paired_shells' && p.dimension_basis === 'per_shell' ? p.height_mm * 2 : p.height_mm, wall, opening: p.opening, frontFraction: p.front_share_percent / 100, cornerRadius: p.corner_radius_mm });
}
function renderDescriptionProposal() {
  const target = $('#description-proposal');
  if (!target) return;
  const labels = { length_mm: 'Length', width_mm: 'Width', height_mm: 'Height', wall_mm: 'Preview wall', corner_radius_mm: 'Radius', material: 'Material', surface_finish: 'Finish' };
  target.innerHTML = studio.proposal ? `<div class="command-proposal"><strong>Proposed change</strong><dl>${Object.entries(studio.proposal).map(([key, value]) => `<div><dt>${labels[key]}</dt><dd>${typeof value === 'number' ? displayNumber(value, ' mm') : esc(value === 'glossy' ? 'Glossy' : value === 'satin' ? 'Satin' : value)}</dd></div>`).join('')}</dl><p>Updates the demo shell. The wall remains a candidate variant.</p><div class="proposal-actions"><button class="button primary compact" id="apply-description">Apply to model</button><button class="text-button" id="discard-description">Discard</button></div></div>` : '';
}
function applyDescription() {
  if (!studio.proposal || invalidFields.size) { notify('Correct the highlighted properties before applying.'); return; }
  const changes = studio.proposal, part = structuredClone(project.part);
  for (const [key, value] of Object.entries(changes)) if (key !== 'wall_mm') part[key] = value;
  const wall = changes.wall_mm ?? previewWall();
  if (changes.wall_mm && !part.wall_options_mm.includes(wall)) part.wall_options_mm.push(wall);
  part.wall_options_mm.sort((a, b) => a - b);
  try { conceptFromProject(part, wall); }
  catch (error) { $('#studio-message').textContent = `${t('Change not applied:')} ${t(error.message)}`; return; }
  studio.previous = { part: structuredClone(project.part), concept_preview: structuredClone(project.concept_preview), sources: structuredClone(Object.fromEntries(Object.entries(project.sources).filter(([key]) => key.startsWith('part.')))) };
  project.part = part; project.concept_preview.wall_mm = wall;
  for (const key of Object.keys(changes)) project.sources[`part.${key === 'wall_mm' ? 'wall_options_mm' : key}`] = { kind: 'user', method: 'local_command', raw_text: studio.draft, recorded_at: new Date().toISOString() };
  studio.source = 'parametric'; studio.proposal = null; studio.message = 'Model updated. Continue describing or editing properties.';
  save(); render('concept');
}

document.addEventListener('keydown', (event) => {
  if (!event.target.matches('[role="tab"][data-source-tab]') || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const tabs = [...document.querySelectorAll('[role="tab"][data-source-tab]')], current = tabs.indexOf(event.target);
  tabs[event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length].click();
});
document.addEventListener('change', async (event) => {
  const input = event.target;
  if (!['mesh-file', 'photo-file'].includes(input.id) || !input.files?.length) return;
  if (invalidFields.size) { notify('Correct the highlighted properties before loading a file.'); input.value = ''; return; }
  const request = ++assetRequest, projectId = project.id, file = input.files[0];
  const status = (message) => { studio.message = message; if ($('#studio-message')) $('#studio-message').textContent = message; };
  status('Reading the file locally…');
  let photoUrl;
  try {
    if (input.id === 'mesh-file') {
      const units = $('#mesh-units').value;
      if (!units) throw new Error('Select the file coordinate unit first.');
      if (file.size > 12 * 1024 * 1024) throw new Error('The demo accepts meshes up to 12 MB.');
      const { importMesh } = await import('./mesh-import.js');
      const mesh = importMesh(await file.arrayBuffer(), file.name, units);
      if (request !== assetRequest || projectId !== project.id) return;
      studio.imported = mesh; studio.source = 'imported';
      status('Mesh loaded. Bounds use the selected unit; the brief is unchanged.');
    } else {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) throw new Error('Choose a JPG, PNG or WebP photo up to 8 MB.');
      photoUrl = URL.createObjectURL(file);
      const reference = new Image(); reference.src = photoUrl; await reference.decode().catch(() => { throw new Error('Unable to decode this photo.'); });
      if (reference.naturalWidth * reference.naturalHeight > 25000000) throw new Error('Reduce the photo to fewer than 25 megapixels.');
      if (request !== assetRequest || projectId !== project.id) { URL.revokeObjectURL(photoUrl); return; }
      if (studio.photo) URL.revokeObjectURL(studio.photo);
      studio.photo = photoUrl; studio.photoName = file.name; photoUrl = null;
      status('Reference added. The photo has not changed the 3D geometry.');
    }
    if (currentView === 'concept') render('concept');
  } catch (error) { if (photoUrl) URL.revokeObjectURL(photoUrl); if (request === assetRequest && projectId === project.id) status(error.message || 'Unable to read the file.'); }
  finally { input.value = ''; }
});
function renderConcept() {
  const controls = ['length_mm', 'width_mm', 'height_mm', 'corner_radius_mm', 'opening', 'dimension_basis', 'front_share_percent'];
  return renderWorkspace({ project, wall: previewWall(), properties: grid(partFields.filter((f) => controls.includes(f.key)), 'part', project.part), exploded: previewExploded, transparent: previewTransparent, wireframe: previewWireframe, gridVisible: previewGrid });
}
async function refreshConcept() {
  const container = $('#concept-viewport');
  if (!container) return;
  const request = ++viewerRequest;
  activeViewer?.dispose(); activeViewer = null; currentConceptModel = null;
  $('#concept-download').disabled = true;
  $('#concept-metrics').replaceChildren();
  delete container.dataset.renderStatus;
  try {
    const imported = studio.source === 'imported' && studio.imported;
    const concept = imported || conceptFromProject();
    currentConceptModel = imported ? null : concept;
    $('#concept-download').disabled = Boolean(imported);
    const { length, width, height } = concept.dimensions_mm;
    $('#concept-metrics').innerHTML = `<div><span>${imported ? 'Mesh bounds' : 'Assembly bounds'}</span><strong>${displayNumber(length)} × ${displayNumber(width)} × ${displayNumber(height)} mm</strong></div><div><span>${imported ? 'Triangulated surface' : 'Geometric volume'}</span><strong ${imported ? '' : `data-volume-mm3="${concept.volume_mm3}"`}>${imported ? displayNumber(concept.triangle_count, ' triangles') : displayNumber(concept.volume_mm3 / 1000, ' cm³')}</strong></div><div><span>${imported ? 'Source coordinate unit' : 'External profile'}</span><strong>${imported ? esc(concept.source_units) : `R${displayNumber(concept.corner_radius_mm, ' mm')}`}</strong></div>`;
    const { mountConceptViewer } = await import('./concept-view.js');
    if (request !== viewerRequest || !container.isConnected) return;
    activeViewer = mountConceptViewer(container, concept, { finish: project.part.surface_finish });
    activeViewer.setView(previewCamera);
    activeViewer.setExploded(!imported && previewExploded);
    activeViewer.setTransparent(previewTransparent);
    activeViewer.setWireframe(previewWireframe);
    activeViewer.setGridVisible(previewGrid);
    $('#concept-explode').disabled = Boolean(imported) || concept.components.length !== 2;
  } catch (error) {
    if (request !== viewerRequest || !container.isConnected) return;
    const text = document.createElement('p'); text.className = 'concept-message';
    text.textContent = currentConceptModel || studio.source === 'imported' ? 'The 3D viewer requires a browser with WebGL2 support.' : error.message;
    container.replaceChildren(text);
    container.dataset.renderStatus = 'unavailable';
  }
}
function renderMachines() {
  const list = project.machines.length ? `<div class="machine-list">${project.machines.map((m) => `<article class="machine-item"><div><h3 data-user-content>${esc(m.name)}</h3><p>${t(m.ownership === 'purchase' ? 'To purchase' : 'Already available')} · ${displayNumber(m.clamping_force_kn, ' kN')} · ${displayMoney(m.hourly_rate_eur)} / hour</p></div><div class="actions"><button class="text-button" data-edit-machine="${esc(m.id)}">Edit</button><button class="text-button" data-remove-machine="${esc(m.id)}">Remove</button></div></article>`).join('')}</div>` : '<div class="empty-state"><h3>No presses configured</h3><p>Add available presses and purchase candidates.</p></div>';
  const values = project.machines.find((m) => m.id === editMachineId) ?? blankValues(machineFields);
  return card('Press inventory and new investments', 'Compare existing machines and purchase candidates.', '01', list)
    + card(editMachineId ? 'Edit press' : 'Add a candidate press', 'Use machine specifications and relevant hourly rates.', '02', `<form id="machine-form">${grid(machineFields, 'machine', values)}<p id="machine-error" class="form-note" role="alert" hidden></p><div class="step-actions" style="margin-top:22px"><button class="button secondary" type="button" id="cancel-machine">${editMachineId ? 'Cancel edit' : 'Clear fields'}</button><button class="button primary" type="submit">${editMachineId ? 'Save changes' : 'Add press'}</button></div></form>`)
    + '<div class="summary-note">Listed presses are candidates. Compatibility requires mould geometry, shot requirements and strokes.</div>'
    + nextButton('summary', 'Review the brief');
}
function sourceLabel(path) {
  const kind = project.sources[path]?.kind;
  return kind === 'ai_proposal' ? 'AI proposal accepted by user' : kind === 'demo' ? 'Illustrative example' : kind === 'requirement' ? 'Demo-case requirement' : 'User-provided';
}
function row(label, value, path) {
  const missing = value == null || value === '';
  return `<tr><th scope="row">${esc(label)}</th><td><span ${['brief.project_name','brief.customer','part.name','part.application','part.material','part.material_grade','part.aesthetic_requirements','part.undercuts'].includes(path) ? 'data-user-content' : ''}>${missing ? t('Not specified') : esc(value)}</span>${path && !missing ? `<span class="source-tag">${sourceLabel(path)}</span>` : ''}</td></tr>`;
}
function choiceLabel(key) {
  return partFields.find((f) => f.key === key)?.choices?.find(([value]) => value === project.part[key])?.[1] ?? 'Not specified';
}
function functionalRequirementsCard() {
  const p = project.part;
  const ip65Vents = p.ip_target === 'IP65' && p.external_openings === 'connector_vents';
  const sealedIp65 = p.ip_target === 'IP65' && p.thermal_strategy === 'sealed';
  let note = ip65Vents ? t('IP65 needs qualified protected openings. A pressure vent does not provide cooling airflow.') : sealedIp65 ? t('Pressure equalisation does not cool the enclosure. Seals and thermal performance need verification. IP65 is an unverified target.') : '';
  if (p.ip_target === 'IP65' && p.ip_in_use === 'with_cable') note += ' ' + t('Connected-cable protection requires a dedicated cable seal in addition to the cover.');
  const pcbSize = [p.pcb_length_mm, p.pcb_width_mm, p.pcb_height_mm].every((v) => v > 0) ? [p.pcb_length_mm, p.pcb_width_mm, p.pcb_height_mm].map((v) => displayNumber(v)).join(' × ') + ' mm' : null;
  return card('Openings and functional requirements', 'PCBs, openings and seals are not yet modelled.', 'REQ', `<table class="data-table">${row('Contents', choiceLabel('electronics_configuration'), 'part.electronics_configuration')}${row('Number of PCBs', p.pcb_count, 'part.pcb_count')}${row('Board layout', choiceLabel('pcb_layout'), 'part.pcb_layout')}${row('PCB and component envelope', pcbSize)}${row('Openings', choiceLabel('external_openings'), 'part.external_openings')}${row('Required protection', choiceLabel('ip_target'), 'part.ip_target')}${row('IP operating conditions', choiceLabel('ip_in_use'), 'part.ip_in_use')}${row('Thermal strategy', choiceLabel('thermal_strategy'), 'part.thermal_strategy')}${row('Connector', choiceLabel('connector_strategy'), 'part.connector_strategy')}</table>${note ? `<p class="form-note">${esc(note)}</p>` : ''}`);
}
function renderSummary() {
  const b = project.brief, p = project.part;
  return card('Request and targets', 'Commercial inputs and their sources.', '01', `<table class="data-table">${row('Project', b.project_name, 'brief.project_name')}${row('Customer', b.customer, 'brief.customer')}${row('Annual demand', b.annual_volume == null ? null : displayNumber(b.annual_volume, ' good parts'), 'brief.annual_volume')}${row('Programme length', b.program_years == null ? null : displayNumber(b.program_years, ' years'), 'brief.program_years')}${row('Cost approach', b.cost_target_mode === 'exploratory' ? 'Cost estimated from comparison' : 'Fixed target', 'brief.cost_target_mode')}${row('Target manufacturing cost', b.cost_target_mode === 'exploratory' ? 'To set after comparison' : b.unit_cost_target_eur == null ? null : displayMoney(b.unit_cost_target_eur), b.cost_target_mode === 'exploratory' ? null : 'brief.unit_cost_target_eur')}${row('Selling price', b.selling_price_eur == null ? null : displayMoney(b.selling_price_eur), 'brief.selling_price_eur')}${row('Mould budget', b.mould_budget_eur == null ? null : displayMoney(b.mould_budget_eur), 'brief.mould_budget_eur')}</table>`)
    + card('Part and resources', 'Inputs for mould concepts and press comparison.', '02', `<table class="data-table">${row('Part', p.name, 'part.name')}${row('End use', p.application, 'part.application')}${row('Material / alternatives', p.material, 'part.material')}${row('Material grade', p.material_grade, 'part.material_grade')}${row('Length', p.length_mm == null ? null : displayNumber(p.length_mm, ' mm'), 'part.length_mm')}${row('Width', p.width_mm == null ? null : displayNumber(p.width_mm, ' mm'), 'part.width_mm')}${row('Height', p.height_mm == null ? null : displayNumber(p.height_mm, ' mm'), 'part.height_mm')}${row('Existing presses', project.machines.filter((m) => m.ownership === 'existing').length)}${row('Presses to purchase', project.machines.filter((m) => m.ownership === 'purchase').length)}</table>`)
    + card('Appearance, fastening and variants', 'Design requirements and alternatives to verify.', '03', `<table class="data-table">${row('Finish', partFields.find((f) => f.key === 'surface_finish').choices.find(([key]) => key === p.surface_finish)?.[1], 'part.surface_finish')}${row('Fasteners', partFields.find((f) => f.key === 'fastening').choices.find(([key]) => key === p.fastening)?.[1], 'part.fastening')}${row('Wall candidates', p.wall_options_mm.length ? p.wall_options_mm.map((v) => displayNumber(v, ' mm')).join(' / ') : null, 'part.wall_options_mm')}${row('Selected nominal wall', p.nominal_wall_mm == null ? null : displayNumber(p.nominal_wall_mm, ' mm'), 'part.nominal_wall_mm')}${row('Appearance requirements', p.aesthetic_requirements, 'part.aesthetic_requirements')}</table>`)
    + card('Enclosure configuration', 'Assembly and shell connection requirements.', '04', `<table class="data-table">${row('Opening / components', choiceLabel('opening'), 'part.opening')}${row('Dimension reference', choiceLabel('dimension_basis'), 'part.dimension_basis')}${row('Front height share', p.front_share_percent == null ? null : displayNumber(p.front_share_percent, '%'), 'part.front_share_percent')}${row('Profile radius', p.corner_radius_mm == null ? null : displayNumber(p.corner_radius_mm, ' mm'), 'part.corner_radius_mm')}${row('Cosmetic surfaces', choiceLabel('aesthetic_surfaces'), 'part.aesthetic_surfaces')}${row('Disassembly', choiceLabel('snap_service'), 'part.snap_service')}${row('Number of snap fits', p.snap_count, 'part.snap_count')}${row('Clip layout', choiceLabel('snap_layout'), 'part.snap_layout')}${row('Required cycles', p.snap_cycles, 'part.snap_cycles')}</table>`)
    + functionalRequirementsCard()
    + '<div class="summary-note">This is a simplified geometric preview. Mould concepts, cost comparison and press compatibility are not yet implemented.</div>'
    + '<div class="step-actions"><button class="button secondary" data-go="brief">Back to brief</button><button class="button primary" data-export>Export requirements JSON</button></div>';
}
const viewDefinitions = {
  brief: ['Customer brief', 'Capture the targets, demand and constraints for mould and press decisions.', renderBrief],
  part: ['Part and material', 'Capture geometry, appearance and ejection requirements.', renderPart],
  concept: ['3D part preview', 'Explore the demo geometry before developing detailed features.', renderConcept],
  machines: ['Candidate presses', 'Compare available presses and purchase candidates.', renderMachines],
  summary: ['Requirements summary', 'Review inputs and build a shared project brief.', renderSummary],
};
function render(view = currentView) {
  if (!viewDefinitions[view]) return;
  if (invalidFields.size) {
    notify('Correct highlighted numbers before changing views. Invalid changes have not been saved.');
    document.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  currentView = view;
  document.body.classList.toggle('is-cad', view === 'concept');
  viewerRequest++;
  activeViewer?.dispose(); activeViewer = null; currentConceptModel = null;
  invalidFields.clear();
  const [title, subtitle, content] = viewDefinitions[view];
  $('#page-title').textContent = title;
  $('#page-subtitle').textContent = subtitle;
  document.title = `Mould Studio · ${t(title)}`;
  $('#content').innerHTML = content();
  renderWallComparison();
  updateAIPanel();
  mountCADIcons();
  if (view === 'concept') refreshConcept();
  if (view === 'concept') renderDescriptionProposal();
  document.querySelectorAll('[data-view]').forEach((button) => {
    const selected = button.dataset.view === view;
    button.classList.toggle('active', selected);
    if (selected) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  });
  updateInspector();
}
function checklist() {
  return [
    { label: 'Project identity', done: Boolean(project.brief.project_name.trim()), view: 'brief', field: 'brief-project_name', title: 'What is the project?', copy: 'Name the enquiry to organise the project.' },
    { label: 'Demand and duration', done: project.brief.annual_volume > 0 && project.brief.program_years > 0, view: 'brief', field: project.brief.annual_volume > 0 ? 'brief-program_years' : 'brief-annual_volume', title: 'What demand must be met?', copy: 'Annual demand and programme duration guide capacity and investment.' },
    { label: 'Cost approach', done: project.brief.cost_target_mode === 'exploratory' || project.brief.unit_cost_target_eur != null, view: 'brief', field: 'brief-unit_cost_target_eur', title: 'What is the cost target?', copy: 'Enter the fixed target or return to exploring alternatives.' },
    { label: 'Material / alternatives', done: Boolean(project.part.material.trim()), view: 'part', field: 'part-material', title: 'Which materials should be considered?', copy: 'Record materials or alternatives; simulations require a material grade.' },
    { label: 'Part envelope', done: ['length_mm', 'width_mm', 'height_mm'].every((key) => project.part[key] > 0), view: 'part', field: `part-${['length_mm', 'width_mm', 'height_mm'].find((key) => !(project.part[key] > 0)) ?? 'length_mm'}`, title: 'What are the overall dimensions?', copy: 'Set the three external dimensions in millimetres.' },
    { label: 'Candidate presses', done: project.machines.length > 0, view: 'machines', field: 'machine-name', title: 'Which presses should be evaluated?', copy: 'Add an available press or a purchase candidate.' },
  ];
}
function updateInspector() {
  const name = project.brief.project_name.trim() || t('New project');
  $('#sidebar-project').textContent = name;
  $('#breadcrumb-project').textContent = name;
  const items = checklist(), done = items.filter((i) => i.done).length;
  $('#progress-value').textContent = `${done} / ${items.length}`;
  $('#progress-fill').style.width = `${done / items.length * 100}%`;
  $('#checklist').innerHTML = items.map((i) => `<li class="${i.done ? 'done' : ''}"><span class="check-indicator" aria-hidden="true">${i.done ? '✓' : ''}</span>${esc(i.label)}<span class="visually-hidden">${i.done ? ': complete' : ': incomplete'}</span></li>`).join('');
  const next = items.find((i) => !i.done);
  $('#next-question-title').textContent = next?.title ?? 'The basic brief is complete';
  $('#next-question-copy').textContent = next?.copy ?? 'Review appearance, material grade and machine data before engineering checks.';
  $('#next-question-button').textContent = next ? 'Complete the field ↗' : 'Review summary ↗';
  $('#next-question-button').onclick = () => { render(next?.view ?? 'summary'); if (next) document.getElementById(next.field)?.focus(); };
  const demo = project.dataset_kind === 'demo';
  $('#data-badge').textContent = demo ? 'UX example · illustrative values' : 'User-provided data';
  $('#data-badge').classList.toggle('demo', demo);
  let canRestore = false;
  try { canRestore = Boolean(localStorage.getItem(BACKUP_KEY)); } catch { /* Export remains available. */ }
  $('#example-button').textContent = canRestore ? 'Restore your project' : 'Load example brief';
}
function exportProject() {
  if (invalidFields.size) { notify('Correct highlighted numbers before exporting.'); return; }
  const data = { ...project, exported_at: new Date().toISOString(), prototype_capabilities: ['brief_capture', 'machine_catalogue', 'wall_variant_configuration', 'parametric_shell_preview', 'local_commands', 'browser_ai_proposals', 'obj_stl_viewer', 'photo_reference', 'local_persistence'], session_assets: { mesh: studio.imported ? { name: studio.imported.file_name, dimensions_mm: studio.imported.dimensions_mm, source_units: studio.imported.source_units } : null, photo_name: studio.photoName || null, persistence: 'metadata_only_reload_original_files' }, engineering_validation: 'not_performed' };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `brief-${project.id.slice(0, 8)}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('Brief exported as JSON with units and sources.');
}
function demoProject() {
  const data = newProject();
  data.dataset_kind = 'demo';
  Object.assign(data.brief, { project_name: 'Electronic enclosure · UX example', customer: 'Demo customer', reference: 'DEMO-001', annual_volume: 250000, lot_size: 10000, unit_cost_target_eur: null, selling_price_eur: 1.8, mould_budget_eur: 85000, notes: 'Illustrative demand, price and budget for UX testing. Manufacturing cost has not been calculated.' });
  data.machines = [ { id: crypto.randomUUID(), ...blankValues(machineFields), name: 'Press A · example', ownership: 'existing', clamping_force_kn: 2000, tie_bar_width_mm: 500, tie_bar_height_mm: 500, min_mould_height_mm: 200, max_mould_height_mm: 550, opening_stroke_mm: 450, shot_volume_cm3: 400, hourly_rate_eur: 65 }, { id: crypto.randomUUID(), ...blankValues(machineFields), name: 'Press B · example', ownership: 'purchase', clamping_force_kn: 2500, purchase_cost_eur: 180000 } ];
  for (const group of ['brief', 'part']) for (const field of Object.keys(data[group])) if (!data.sources[`${group}.${field}`]) data.sources[`${group}.${field}`] = { kind: 'demo', note: 'Illustrative value for UX testing' };
  for (const machine of data.machines) data.sources[`machines.${machine.id}`] = { kind: 'demo', note: 'Illustrative specification; compatibility not verified' };
  return data;
}

document.addEventListener('input', (event) => {
  const field = event.target;
  if (field.id === 'ai-mode') { localAI.state.mode = field.value; return; }
  if (field.id === 'ai-message') { localAI.state.draft = field.value; return; }
  if (field.id === 'part-description') { studio.draft = field.value; studio.proposal = null; renderDescriptionProposal(); return; }
  const group = field.dataset.group;
  if (!['brief', 'part'].includes(group)) return;
  studio.previous = null;
  if ($('#undo-description')) $('#undo-description').hidden = true;
  const path = `${group}.${field.dataset.key}`;
  if (!field.validity.valid) {
    invalidFields.add(path); field.setAttribute('aria-invalid', 'true');
    if (currentView === 'concept') {
      viewerRequest++; activeViewer?.dispose(); activeViewer = null; currentConceptModel = null;
      $('#concept-download').disabled = true;
      $('#concept-viewport').innerHTML = '<p class="concept-message">Correct highlighted geometry values to update the preview.</p>';
      $('#concept-viewport').dataset.renderStatus = 'invalid';
      $('#concept-metrics').replaceChildren();
    }
    return;
  }
  invalidFields.delete(path); field.removeAttribute('aria-invalid');
  project[group][field.dataset.key] = field.type === 'number' ? field.value === '' ? null : field.valueAsNumber : field.value;
  project.sources[path] = { kind: 'user', recorded_at: new Date().toISOString() };
  if (group === 'brief' && field.dataset.key === 'unit_cost_target_eur' && project.brief.unit_cost_target_eur != null) {
    project.brief.cost_target_mode = 'fixed';
    project.sources['brief.cost_target_mode'] = { kind: 'user', recorded_at: new Date().toISOString() };
    $('#brief-cost_target_mode').value = 'fixed';
  }
  save(); updateInspector();
  if (group === 'part' && ['surface_finish', 'fastening'].includes(field.dataset.key)) renderWallComparison();
  if (currentView === 'concept') refreshConcept();
});
localAI.subscribe(updateAIPanel);
document.addEventListener('click', (event) => {
  if (event.target.closest('#ai-load')) { localAI.load(); return; }
  if (event.target.closest('#ai-cancel')) { localAI.cancel(); return; }
  if (event.target.closest('#ai-discard')) { localAI.state.proposal = null; localAI.emit(); return; }
  if (event.target.closest('#ai-apply') && localAI.state.proposal) {
    if (invalidFields.size) { notify('Correct the highlighted properties before applying.'); return; }
    try {
      project = applyAIProposal(project, localAI.state.proposal, { expectedRevision: localAI.state.baseRevision, wall: previewWall(), validateGeometry: conceptFromProject });
      studio.previous = null; studio.proposal = null;
      localAI.state.proposal = null; localAI.state.error = '';
      save(); render(currentView); notify('AI proposal applied. Engineering validation has not been performed.');
    } catch (error) { notify(error.message); }
    return;
  }
  if (event.target.closest('#concept-wireframe')) { previewWireframe = !previewWireframe; $('#concept-wireframe').setAttribute('aria-pressed', String(previewWireframe)); activeViewer?.setWireframe(previewWireframe); return; }
  if (event.target.closest('#concept-grid')) { previewGrid = !previewGrid; $('#concept-grid').setAttribute('aria-pressed', String(previewGrid)); activeViewer?.setGridVisible(previewGrid); return; }
  if (event.target.closest('#concept-fit')) { previewCamera = 'iso'; activeViewer?.setView('iso'); return; }

  const sourceTab = event.target.closest('[data-source-tab]');
  if (sourceTab) { if (invalidFields.size) { notify('Correct the highlighted properties.'); return; } studio.tab = sourceTab.dataset.sourceTab; render('concept'); $(`#source-tab-${studio.tab}`)?.focus(); return; }
  const modelSource = event.target.closest('[data-model-source]');
  if (modelSource) { if (invalidFields.size) { notify('Correct the highlighted properties.'); return; } studio.source = modelSource.dataset.modelSource; studio.message = ''; render('concept'); return; }
  if (event.target.closest('#apply-description')) { applyDescription(); return; }
  if (event.target.closest('#discard-description')) { studio.proposal = null; renderDescriptionProposal(); return; }
  if (event.target.closest('#undo-description') && studio.previous) {
    if (invalidFields.size) { notify('Correct highlighted properties before undoing.'); return; }
    project.part = studio.previous.part; project.concept_preview = studio.previous.concept_preview;
    project.sources = { ...Object.fromEntries(Object.entries(project.sources).filter(([key]) => !key.startsWith('part.'))), ...studio.previous.sources };
    studio.previous = null; studio.proposal = null; studio.source = 'parametric'; save(); render('concept'); notify('Last text change undone.'); return;
  }
  if (event.target.closest('#adopt-mesh-dimensions') && studio.imported) {
    if (invalidFields.size) { notify('Correct the highlighted properties.'); return; }
    const d = studio.imported.dimensions_mm;
    if (![d.length, d.width, d.height].every((v) => v > 0)) { notify('A planar surface does not define three part dimensions.'); return; }
    for (const [key, value] of Object.entries({ length_mm: d.length, width_mm: d.width, height_mm: d.height })) { project.part[key] = value; project.sources[`part.${key}`] = { kind: 'user', method: 'mesh_bounds', file: studio.imported.file_name, source_units: studio.imported.source_units }; }
    project.part.dimension_basis = 'assembly'; project.sources['part.dimension_basis'] = { kind: 'user', method: 'mesh_bounds' }; studio.previous = null; save(); render('concept'); notify('Mesh bounds copied to the brief. Geometry and requirements remain separate.'); return;
  }
  if (event.target.closest('#remove-photo')) { assetRequest++; URL.revokeObjectURL(studio.photo); studio.photo = null; studio.photoName = ''; render('concept'); return; }
  const camera = event.target.closest('[data-concept-camera]');
  if (camera) { previewCamera = camera.dataset.conceptCamera; activeViewer?.setView(previewCamera); return; }
  const wall = event.target.closest('[data-preview-wall]');
  if (wall) {
    if (invalidFields.size) { notify('Correct highlighted values before changing variants.'); return; }
    project.concept_preview.wall_mm = Number(wall.dataset.previewWall);
    studio.previous = null; if ($('#undo-description')) $('#undo-description').hidden = true;
    save();
    document.querySelectorAll('[data-preview-wall]').forEach((button) => { const selected = Number(button.dataset.previewWall) === previewWall(); button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); });
    refreshConcept(); return;
  }
  if (event.target.closest('#concept-explode')) { previewExploded = !previewExploded; $('#concept-explode').setAttribute('aria-pressed', String(previewExploded)); activeViewer?.setExploded(previewExploded); return; }
  if (event.target.closest('#concept-transparent')) { previewTransparent = !previewTransparent; $('#concept-transparent').setAttribute('aria-pressed', String(previewTransparent)); activeViewer?.setTransparent(previewTransparent); return; }
  if (event.target.closest('#concept-download') && currentConceptModel) {
    const url = URL.createObjectURL(new Blob([exportConceptObj(currentConceptModel)], { type: 'text/plain' }));
    const link = document.createElement('a'); link.href = url; link.download = `shell-concept-${currentConceptModel.wall_mm}mm.obj`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); notify('Preliminary geometry exported. OBJ coordinates are in millimetres.'); return;
  }
  const removeWall = event.target.closest('[data-remove-wall]');
  if (removeWall) {
    studio.previous = null;
    project.part.wall_options_mm = project.part.wall_options_mm.filter((v) => v !== Number(removeWall.dataset.removeWall));
    project.sources['part.wall_options_mm'] = { kind: 'user', recorded_at: new Date().toISOString() };
    save(); renderWallComparison(); return;
  }
  if (event.target.closest('#complete-case-requirements')) {
    studio.previous = null;
    const defaults = newProject(), keys = ['surface_finish', 'fastening', 'wall_options_mm', 'opening', 'dimension_basis', 'front_share_percent', 'aesthetic_surfaces', 'snap_service', 'snap_count', 'corner_radius_mm', 'snap_layout', 'snap_cycles', 'electronics_configuration', 'pcb_count', 'external_openings', 'ip_target', 'thermal_strategy', 'connector_strategy', 'ip_in_use', 'pcb_layout', 'pcb_length_mm', 'pcb_width_mm', 'pcb_height_mm'];
    let changes = 0;
    for (const key of keys) {
      const missing = Array.isArray(project.part[key]) ? !project.part[key].length : project.part[key] == null || project.part[key] === '' || project.part[key] === 'unspecified';
      if (missing && defaults.sources[`part.${key}`]) { project.part[key] = defaults.part[key]; project.sources[`part.${key}`] = defaults.sources[`part.${key}`]; changes++; }
    }
    save(); render('part'); notify(changes ? 'Missing requirements completed; existing choices preserved.' : 'Requirements were already complete; your choices were preserved.'); return;
  }
  const nav = event.target.closest('[data-view], [data-go]');
  if (nav) { render(nav.dataset.view ?? nav.dataset.go); return; }
  if (event.target.closest('[data-export]')) { exportProject(); return; }
  const edit = event.target.closest('[data-edit-machine]');
  if (edit) { editMachineId = edit.dataset.editMachine; render('machines'); $('#machine-name').focus(); return; }
  const remove = event.target.closest('[data-remove-machine]');
  if (remove) {
    const id = remove.dataset.removeMachine;
    project.machines = project.machines.filter((m) => m.id !== id);
    delete project.sources[`machines.${id}`];
    if (editMachineId === id) editMachineId = null;
    save(); render('machines'); notify('Press removed from comparison.'); return;
  }
  if (event.target.closest('#cancel-machine')) { editMachineId = null; render('machines'); }
});
document.addEventListener('submit', (event) => {
  if (event.target.id === 'ai-chat-form') {
    event.preventDefault();
    if (invalidFields.size) { notify('Correct the highlighted properties before applying.'); return; }
    const input = $('#ai-message');
    const { name, application, material, length_mm, width_mm, height_mm } = project.part;
    try {
      localAI.send(input.value, { brief: project.brief, part: { name, application, material, length_mm, width_mm, height_mm }, preview_shape: 'reference rectangular shell only' }, getLanguage(), `${project.id}:${project.updated_at}`);
      input.value = '';
    } catch (error) { notify(error.message); }
    return;
  }

    if (event.target.id === 'description-form') {
    event.preventDefault();
    if (invalidFields.size) { notify('Correct highlighted properties before preparing a change.'); return; }
    try { studio.proposal = describePart(studio.draft); studio.message = ''; $('#studio-message').textContent = ''; renderDescriptionProposal(); }
    catch (error) { studio.proposal = null; renderDescriptionProposal(); $('#studio-message').textContent = error.message; }
    return;
  }
  if (event.target.id === 'wall-form') {
    event.preventDefault();
    if (!event.target.reportValidity()) return;
    const input = $('#wall-new-value'), value = input.valueAsNumber;
    if (project.part.wall_options_mm.includes(value)) { notify('This variant already exists.'); return; }
    project.part.wall_options_mm = [...project.part.wall_options_mm, value].sort((a, b) => a - b);
    studio.previous = null;
    project.sources['part.wall_options_mm'] = { kind: 'user', recorded_at: new Date().toISOString() };
    save(); renderWallComparison(); notify('Wall thickness variant added.'); return;
  }
  if (event.target.id !== 'machine-form') return;
  event.preventDefault();
  const form = event.target;
  if (!form.reportValidity()) return;
  const machine = { id: editMachineId ?? crypto.randomUUID() };
  for (const field of machineFields) {
    const input = form.elements.namedItem(field.key);
    machine[field.key] = field.type === 'number' ? input.value === '' ? null : input.valueAsNumber : input.value.trim();
  }
  const error = $('#machine-error');
  if (!machine.name) { error.hidden = false; error.textContent = 'Name the press.'; return; }
  if (machine.min_mould_height_mm != null && machine.max_mould_height_mm != null && machine.min_mould_height_mm > machine.max_mould_height_mm) { error.hidden = false; error.textContent = 'Minimum mould height must not exceed maximum height.'; return; }
  const index = project.machines.findIndex((m) => m.id === machine.id);
  if (index >= 0) project.machines[index] = machine; else project.machines.push(machine);
  project.sources[`machines.${machine.id}`] = { kind: 'user', recorded_at: new Date().toISOString() };
  editMachineId = null; save(); render('machines'); notify('Press saved as a candidate.');
});
$('#export-button').addEventListener('click', exportProject);
$('#example-button').addEventListener('click', () => {
  if (invalidFields.size) { notify('Correct highlighted numbers before opening another project.'); return; }
  if (!storageAvailable) { notify('Export your project first; local backup is unavailable.'); return; }
  try { if (localStorage.getItem(BACKUP_KEY)) $('#reset-dialog').showModal(); else $('#example-dialog').showModal(); }
  catch { notify('Unable to back up the project. Export it before opening the example.'); }
});
$('#example-dialog').addEventListener('close', () => {
  if ($('#example-dialog').returnValue !== 'load') return;
  try { localStorage.setItem(BACKUP_KEY, JSON.stringify(project)); }
  catch { notify('Unable to back up the project; the example was not opened.'); return; }
  clearStudioAssets(); project = demoProject(); editMachineId = null; save(); render('brief'); notify('Example opened with illustrative values; your project is backed up.');
});
$('#reset-dialog').addEventListener('close', () => {
  if ($('#reset-dialog').returnValue !== 'restore') return;
  try {
    const backup = normalizeStoredProject(JSON.parse(localStorage.getItem(BACKUP_KEY)));
    clearStudioAssets(); project = backup; editMachineId = null;
    if (!save()) return;
    localStorage.removeItem(BACKUP_KEY); render('brief'); notify('Your project has been restored.');
  } catch { notify('Restore failed; the backed-up project was preserved.'); }
});
$('#ui-language').value = getLanguage();
$('#ui-language').addEventListener('change', () => {
  const fields = [...document.querySelectorAll('#content input:not([type=file]), #content textarea, #content select')].map((input) => ({ id: input.id, value: input.value, invalid: input.getAttribute('aria-invalid') }));
  const details = [...document.querySelectorAll('#content details')].map((node) => node.open);
  const invalid = [...invalidFields];
  setLanguage($('#ui-language').value);
  $('#toast').hidden = true;
  invalidFields.clear();
  render(currentView);
  for (const field of fields) { const input = document.getElementById(field.id); if (input) { input.value = field.value; if (field.invalid) input.setAttribute('aria-invalid', field.invalid); } }
  for (const path of invalid) invalidFields.add(path);
  document.querySelectorAll('#content details').forEach((node, i) => { node.open = details[i]; });
  if (invalid.length && currentView === 'concept') { viewerRequest++; activeViewer?.dispose(); activeViewer = null; currentConceptModel = null; $('#concept-download').disabled = true; $('#concept-viewport').textContent = t('Correct highlighted geometry values to update the preview.'); $('#concept-viewport').dataset.renderStatus = 'invalid'; $('#concept-metrics').replaceChildren(); }
});
startLocalization();
const startView = document.querySelector('meta[name="app-start-view"]')?.content;
render(viewDefinitions[startView] ? startView : 'concept');
if (initialLoadError) notify(initialLoadError);
if (!storageAvailable) $('#save-status').textContent = 'Memory only · export the brief';
