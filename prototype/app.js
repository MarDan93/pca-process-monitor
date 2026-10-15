'use strict';
import { createShellConcept, exportConceptObj } from './shell-geometry.js';
import { describePart } from './description.js';
import { renderWorkspace, studio } from './workspace.js';

const STORAGE_KEY = 'injection-moulding-brief-v1';
const BACKUP_KEY = `${STORAGE_KEY}-before-example`;
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const numberFormat = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 });
const moneyFormat = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
const displayNumber = (value, suffix = '') => value == null ? 'Da definire' : `${numberFormat.format(value)}${suffix}`;
const displayMoney = (value) => value == null ? 'Da definire' : moneyFormat.format(value);

const briefFields = [
  { key: 'project_name', label: 'Nome del progetto', placeholder: 'Es. Guscio dispositivo — nuova commessa', full: true },
  { key: 'customer', label: 'Cliente', placeholder: 'Nome o riferimento cliente', optional: true },
  { key: 'reference', label: 'Codice articolo / richiesta', placeholder: 'Es. RFQ-2026-014', optional: true },
  { key: 'annual_volume', label: 'Quantità annua', type: 'number', min: 1, step: 1, placeholder: 'Pezzi conformi / anno', help: 'Il fabbisogno guida cavità e capacità produttiva.' },
  { key: 'lot_size', label: 'Dimensione del lotto', type: 'number', min: 1, step: 1, optional: true, placeholder: 'Pezzi / lotto' },
  { key: 'program_years', label: 'Durata prevista della commessa', type: 'number', min: 0.1, step: 'any', placeholder: 'Anni', help: 'Orizzonte da usare per valutare gli investimenti.' },
  { key: 'cost_target_mode', label: 'Impostazione del costo obiettivo', type: 'select', full: true, choices: [['exploratory', 'Ricavare il costo dal confronto delle alternative'], ['fixed', 'Confrontare con un costo obiettivo fissato']], help: 'Puoi fissare un obiettivo dopo aver confrontato le configurazioni.' },
  { key: 'unit_cost_target_eur', label: 'Costo industriale obiettivo', type: 'number', min: 0, step: 'any', optional: true, placeholder: '€ / pezzo conforme', help: 'Lascia vuoto durante l’esplorazione. Compilandolo passi a un obiettivo fissato.' },
  { key: 'selling_price_eur', label: 'Prezzo di vendita', type: 'number', min: 0, step: 'any', optional: true, placeholder: '€ / pezzo', help: 'Distinto dal costo industriale.' },
  { key: 'mould_budget_eur', label: 'Budget stampo', type: 'number', min: 0, step: 'any', optional: true, placeholder: '€', help: 'Importo per lo stampo; automazione da valutare separatamente.' },
  { key: 'notes', label: 'Richiesta del cliente e vincoli', type: 'textarea', full: true, placeholder: 'Funzione del prodotto, consegne, qualità attesa e richieste particolari…' },
];
const partFields = [
  { key: 'name', label: 'Nome del pezzo', placeholder: 'Es. Guscio estetico', full: true },
  { key: 'application', label: 'Destinazione d’uso', placeholder: 'Es. Dispositivo elettronico da interno', full: true },
  { key: 'material', label: 'Materiale o alternative', placeholder: 'Es. ABS / PC-ABS', help: 'Puoi registrare alternative da confrontare.' },
  { key: 'material_grade', label: 'Grado commerciale', optional: true, placeholder: 'Produttore e codice del materiale', help: 'Necessario per scegliere proprietà fisiche pertinenti.' },
  { key: 'length_mm', label: 'Lunghezza esterna', type: 'number', min: 0.01, step: 'any', placeholder: 'mm' },
  { key: 'width_mm', label: 'Larghezza esterna', type: 'number', min: 0.01, step: 'any', placeholder: 'mm' },
  { key: 'height_mm', label: 'Altezza esterna', type: 'number', min: 0.01, step: 'any', placeholder: 'mm' },
  { key: 'corner_radius_mm', label: 'Raggio esterno del profilo', type: 'number', min: 0, step: 'any', placeholder: 'mm', help: 'Arrotonda il profilo dei gusci; i raccordi fuori piano sono da progettare.' },
  { key: 'nominal_wall_mm', label: 'Spessore nominale', type: 'number', min: 0.01, step: 'any', optional: true, placeholder: 'mm' },
  { key: 'surface_finish', label: 'Finitura estetica', type: 'select', choices: [['unspecified', 'Da definire'], ['glossy', 'Lucida'], ['satin', 'Satinata'], ['textured', 'Texturizzata']] },
  { key: 'fastening', label: 'Sistema di fissaggio', type: 'select', choices: [['unspecified', 'Da definire'], ['snap_only', 'Solo agganci a scatto'], ['screws_only', 'Solo viti'], ['mixed', 'Viti e agganci a scatto']] },
  { key: 'opening', label: 'Configurazione del guscio', type: 'select', choices: [['unspecified', 'Da definire'], ['paired_shells', 'Due gusci: anteriore e posteriore'], ['rear_open', 'Guscio aperto sul retro'], ['short_side_open', 'Guscio aperto su un lato corto']] },
  { key: 'dimension_basis', label: 'Le dimensioni si riferiscono a', type: 'select', choices: [['unspecified', 'Da confermare'], ['assembly', 'Prodotto assemblato'], ['per_shell', 'Ciascun guscio (due metà uguali)']] },
  { key: 'front_share_percent', label: 'Quota altezza del guscio anteriore', type: 'number', min: 1, max: 99, step: 'any', placeholder: '%', optional: true, help: 'La quota rimanente appartiene al posteriore.' },
  { key: 'aesthetic_surfaces', label: 'Superfici estetiche', type: 'select', choices: [['unspecified', 'Da definire'], ['front_sides', 'Faccia frontale e pareti laterali'], ['front_only', 'Solo faccia frontale'], ['all', 'Tutte le superfici, anche interne']] },
  { key: 'snap_service', label: 'Smontaggio degli agganci', type: 'select', choices: [['unspecified', 'Da definire'], ['tool', 'Con attrezzo, senza danni'], ['manual', 'A mano, aperture frequenti'], ['permanent', 'Montaggio permanente']] },
  { key: 'snap_count', label: 'Numero di agganci', type: 'number', min: 1, step: 1, placeholder: 'Da definire', optional: true, help: 'Geometria e dimensionamento degli agganci da sviluppare.' },
  { key: 'snap_layout', label: 'Disposizione degli agganci', type: 'select', choices: [['unspecified', 'Da definire'], ['long_sides', 'Tre per ciascun lato lungo'], ['distributed', 'Due per lato lungo e uno per lato corto']] },
  { key: 'snap_cycles', label: 'Cicli montaggio/smontaggio richiesti', type: 'number', min: 1, step: 1, optional: true, placeholder: 'Da definire', help: 'Requisito da verificare con grado materiale e geometria dell’aggancio.' },
  { key: 'electronics_configuration', label: 'Contenuto elettronico', type: 'select', choices: [['unspecified', 'Da definire'], ['single_pcb', 'Una scheda, senza batteria'], ['pcb_battery', 'Scheda e batteria'], ['multiple_pcbs', 'Più schede elettroniche']] },
  { key: 'pcb_count', label: 'Numero di schede', type: 'number', min: 1, step: 1, optional: true, placeholder: 'Da definire' },
  { key: 'external_openings', label: 'Aperture richieste', type: 'select', choices: [['unspecified', 'Da definire'], ['connector', 'Finestra per connettore'], ['connector_vents', 'Connettore e ventilazione'], ['connector_protected_vent', 'Connettore e sfiato protetto per pressione'], ['none', 'Nessuna apertura']] },
  { key: 'ip_target', label: 'Obiettivo di protezione', type: 'select', choices: [['unspecified', 'Da definire'], ['none', 'Nessun grado IP richiesto'], ['IP54', 'Obiettivo IP54'], ['IP65', 'Obiettivo IP65']], help: 'Requisito di progetto, non una qualifica ottenuta.' },
  { key: 'thermal_strategy', label: 'Architettura termica / ventilazione', type: 'select', choices: [['unspecified', 'Da definire'], ['compare', 'Confrontare involucro chiuso e ventilazione protetta'], ['sealed', 'Involucro chiuso, sfiato per pressione'], ['protected_airflow', 'Ricambio d’aria con modulo protetto']] },
  { key: 'connector_strategy', label: 'Tenuta del connettore', type: 'select', choices: [['unspecified', 'Da definire'], ['panel_sealed', 'Connettore a pannello con tenuta'], ['sealed_cover', 'Sportello sigillato'], ['compare', 'Confrontare alternative']] },
  { key: 'ip_in_use', label: 'Condizione richiesta per la protezione IP', type: 'select', choices: [['unspecified', 'Da definire'], ['with_cable', 'Anche durante l’uso con cavo collegato'], ['closed_only', 'Solo sportello chiuso, cavo scollegato'], ['compare', 'Confrontare le due condizioni']] },
  { key: 'pcb_layout', label: 'Disposizione delle schede', type: 'select', choices: [['unspecified', 'Da definire'], ['two_by_two', 'Due per due su un livello'], ['two_levels', 'Due livelli, due schede per livello'], ['stacked', 'Quattro schede impilate']] },
  { key: 'pcb_length_mm', label: 'Lunghezza di ogni scheda', type: 'number', min: 0.01, step: 'any', optional: true, placeholder: 'mm' },
  { key: 'pcb_width_mm', label: 'Larghezza di ogni scheda', type: 'number', min: 0.01, step: 'any', optional: true, placeholder: 'mm' },
  { key: 'pcb_height_mm', label: 'Altezza complessiva scheda e componenti', type: 'number', min: 0.01, step: 'any', optional: true, placeholder: 'mm' },
  { key: 'aesthetic_requirements', label: 'Superfici estetiche e qualità', type: 'textarea', full: true, placeholder: 'Indica superfici a vista, finitura, colore, segni ammessi e tolleranze…' },
  { key: 'undercuts', label: 'Fissaggi, sottosquadri ed estrazione', type: 'textarea', full: true, placeholder: 'Descrivi agganci, torrette, aperture laterali e vincoli di estrazione…' },
];
const machineFields = [
  { key: 'name', label: 'Nome / modello della pressa', placeholder: 'Costruttore e modello', full: true },
  { key: 'ownership', label: 'Disponibilità', type: 'select', choices: [['existing', 'Già disponibile'], ['purchase', 'Da acquistare']] },
  { key: 'clamping_force_kn', label: 'Forza di chiusura', type: 'number', min: 0.01, step: 'any', placeholder: 'kN', help: '1 tonnellata forza = 9,80665 kN.' },
  { key: 'tie_bar_width_mm', label: 'Passaggio tra colonne — larghezza', type: 'number', min: 0.01, step: 'any', placeholder: 'mm', optional: true },
  { key: 'tie_bar_height_mm', label: 'Passaggio tra colonne — altezza', type: 'number', min: 0.01, step: 'any', placeholder: 'mm', optional: true },
  { key: 'min_mould_height_mm', label: 'Altezza stampo minima', type: 'number', min: 0, step: 'any', placeholder: 'mm', optional: true },
  { key: 'max_mould_height_mm', label: 'Altezza stampo massima', type: 'number', min: 0.01, step: 'any', placeholder: 'mm', optional: true },
  { key: 'opening_stroke_mm', label: 'Corsa di apertura', type: 'number', min: 0.01, step: 'any', placeholder: 'mm', optional: true },
  { key: 'shot_volume_cm3', label: 'Volume massimo di iniezione', type: 'number', min: 0.01, step: 'any', placeholder: 'cm³', optional: true, help: 'Volume da scheda macchina; non peso riferito a un materiale.' },
  { key: 'hourly_rate_eur', label: 'Tariffa macchina', type: 'number', min: 0, step: 'any', placeholder: '€ / ora', optional: true, help: 'Le voci incluse nella tariffa saranno definite nel modello economico.' },
  { key: 'purchase_cost_eur', label: 'Investimento per acquisto', type: 'number', min: 0, step: 'any', placeholder: '€', optional: true, help: 'Rilevante per le presse da acquistare.' },
];

function blankValues(fields) { return Object.fromEntries(fields.map((f) => [f.key, f.type === 'number' ? null : f.type === 'select' ? f.choices[0][0] : ''])); }
function newProject() {
  const now = new Date().toISOString();
  const part = { ...blankValues(partFields), name: 'Gusci estetici con agganci a scatto', application: 'Dispositivo elettronico da interno', material: 'ABS; PC/ABS; PP; PE; copolimeri da specificare', length_mm: 120, width_mm: 80, height_mm: 35, corner_radius_mm: 8, surface_finish: 'glossy', fastening: 'snap_only', opening: 'paired_shells', dimension_basis: 'assembly', front_share_percent: 50, aesthetic_surfaces: 'front_sides', snap_service: 'tool', snap_count: 6, snap_layout: 'long_sides', snap_cycles: 1000, wall_options_mm: [1.5, 2, 2.5], aesthetic_requirements: 'Requisiti estetici elevati su faccia frontale e pareti laterali. Colore, gloss e criteri di accettazione da definire.', undercuts: 'Sei agganci a scatto, tre per lato lungo, smontabili con attrezzo senza danni. Obiettivo 1.000 cicli. Geometria, forze, direzioni di estrazione e corse dei carrelli da definire.' };
  const sources = Object.fromEntries(['name', 'application', 'material', 'length_mm', 'width_mm', 'height_mm', 'corner_radius_mm', 'surface_finish', 'fastening', 'opening', 'dimension_basis', 'front_share_percent', 'aesthetic_surfaces', 'snap_service', 'snap_count', 'snap_layout', 'snap_cycles', 'wall_options_mm', 'aesthetic_requirements', 'undercuts'].map((key) => [`part.${key}`, { kind: 'requirement', note: 'Requisito del caso dimostrativo definito con l’utente; non una misura di produzione.' }]));
  Object.assign(part, { electronics_configuration: 'multiple_pcbs', pcb_count: 4, external_openings: 'connector_protected_vent', ip_target: 'IP65', thermal_strategy: 'sealed', connector_strategy: 'sealed_cover', ip_in_use: 'with_cable', pcb_layout: 'two_by_two', pcb_length_mm: 40, pcb_width_mm: 25, pcb_height_mm: 8 });
  for (const key of ['electronics_configuration', 'pcb_count', 'external_openings', 'ip_target', 'thermal_strategy', 'connector_strategy', 'ip_in_use', 'pcb_layout', 'pcb_length_mm', 'pcb_width_mm', 'pcb_height_mm']) sources[`part.${key}`] = { kind: 'requirement', note: 'Requisito cliente; geometria e qualifica tecnica non ancora verificate.' };
  sources['brief.program_years'] = { kind: 'requirement', note: 'Durata iniziale di 5 anni scelta dall’utente; modificabile.' };
  sources['brief.cost_target_mode'] = { kind: 'requirement', note: 'Costo da ricavare dal confronto, poi fissare come obiettivo.' };
  return { schema_version: 4, id: crypto.randomUUID(), created_at: now, updated_at: now, dataset_kind: 'user', currency: 'EUR', units: { length: 'mm', force: 'kN', volume: 'cm3', time: 's' }, brief: { ...blankValues(briefFields), program_years: 5, cost_target_mode: 'exploratory' }, part, concept_preview: { wall_mm: null }, machines: [], sources };
}
let storageAvailable = true;
let initialLoadError = '';
function normalizeStoredProject(parsed) {
  if (![1, 2, 3, 4].includes(parsed?.schema_version) || !parsed.brief || !parsed.part || !Array.isArray(parsed.machines) || !parsed.sources || !parsed.id) throw new Error('Formato del progetto non riconosciuto.');
  if (!parsed.brief.cost_target_mode) parsed.brief.cost_target_mode = parsed.brief.unit_cost_target_eur == null ? 'exploratory' : 'fixed';
  if (parsed.schema_version === 1) {
    parsed.part.surface_finish ??= 'unspecified';
    parsed.part.fastening ??= 'unspecified';
    if (parsed.part.wall_options_mm == null) {
      parsed.part.wall_options_mm = parsed.part.nominal_wall_mm > 0 ? [parsed.part.nominal_wall_mm] : [];
      if (parsed.part.wall_options_mm.length) parsed.sources['part.wall_options_mm'] = { ...(parsed.sources['part.nominal_wall_mm'] ?? { kind: 'user' }), note: 'Variante derivata dallo spessore nominale già registrato.' };
    }
    parsed.schema_version = 2;
  }
  if (!Array.isArray(parsed.part.wall_options_mm) || !parsed.part.wall_options_mm.every((v) => Number.isFinite(v) && v > 0)) throw new Error('Varianti di spessore non valide.');
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
    initialLoadError = 'Il progetto precedente non è leggibile. È stato conservato; questa sessione usa un nuovo brief senza sovrascriverlo.';
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
let assetRequest = 0;

function clearStudioAssets() {
  assetRequest++;
  if (studio.photo) URL.revokeObjectURL(studio.photo);
  Object.assign(studio, { tab: 'text', draft: 'Guscio 120 × 80 × 35 mm, spessore 2 mm, raggio 8 mm, ABS lucido', imported: null, photo: null, photoName: '', source: 'parametric', proposal: null, previous: null, message: '' });
}

function notify(message) {
  clearTimeout(toastTimeout);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimeout = setTimeout(() => { $('#toast').hidden = true; }, 5500);
}
function save() {
  project.updated_at = new Date().toISOString();
  if (!storageAvailable) { $('#save-status').textContent = 'Solo in memoria · esporta il brief'; return false; }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(project)); $('#save-status').textContent = 'Salvato nel browser'; return true; }
  catch { storageAvailable = false; $('#save-status').textContent = 'Solo in memoria · esporta il brief'; notify('Salvataggio locale non disponibile. Esporta il brief per conservarlo.'); return false; }
}
function fieldMarkup(field, group, values) {
  const id = `${group}-${field.key}`;
  const value = values[field.key] ?? '';
  const common = `id="${id}" name="${field.key}" data-group="${group}" data-key="${field.key}" ${field.help ? `aria-describedby="${id}-help"` : ''}`;
  let input;
  if (field.type === 'textarea') input = `<textarea ${common} placeholder="${esc(field.placeholder)}">${esc(value)}</textarea>`;
  else if (field.type === 'select') input = `<select ${common}>${field.choices.map(([key, label]) => `<option value="${key}" ${key === value ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select>`;
  else input = `<input ${common} type="${field.type ?? 'text'}" value="${esc(value)}" placeholder="${esc(field.placeholder)}" ${field.type === 'number' ? `min="${field.min}" ${field.max != null ? `max="${field.max}"` : ''} step="${field.step}" inputmode="decimal"` : ''} ${group === 'machine' && field.key === 'name' ? 'required' : ''}>`;
  const unit = { annual_volume: 'pezzi/anno', lot_size: 'pezzi/lotto', program_years: 'anni', front_share_percent: '%', unit_cost_target_eur: '€/pezzo conforme', selling_price_eur: '€/pezzo', mould_budget_eur: '€', clamping_force_kn: 'kN', shot_volume_cm3: 'cm³', hourly_rate_eur: '€/h', purchase_cost_eur: '€' }[field.key] ?? (field.key.endsWith('_mm') ? 'mm' : '');
  return `<div class="field ${field.full ? 'full' : ''}"><label for="${id}">${esc(field.label)}${unit ? `<span class="field-unit">${esc(unit)}</span>` : ''}${field.optional ? '<span class="optional">facoltativo</span>' : ''}</label>${input}${field.help ? `<small id="${id}-help">${esc(field.help)}</small>` : ''}</div>`;
}
function card(title, subtitle, number, body) {
  return `<section class="card"><div class="card-heading"><div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div><span class="section-number">${esc(number)}</span></div>${body}</section>`;
}
function grid(fields, group, values) { return `<div class="field-grid">${fields.map((f) => fieldMarkup(f, group, values)).join('')}</div>`; }
function nextButton(view, label) { return `<div class="step-actions"><p>Puoi completare i campi anche in un secondo momento.</p><button class="button primary" data-go="${view}">${esc(label)} <span aria-hidden="true">→</span></button></div>`; }

function renderBrief() {
  return card('Identità della richiesta', 'Organizza la commessa e i suoi riferimenti.', '01', grid(briefFields.slice(0, 3), 'brief', project.brief))
    + card('Volumi e obiettivi economici', 'Sono input per il confronto delle configurazioni.', '02', grid(briefFields.slice(3, -1), 'brief', project.brief) + '<p class="form-note">Quantità annua libera, senza fasce predefinite. Valuta pezzi conformi; costo industriale, prezzo di vendita e investimento stampo restano voci distinte.</p>')
    + card('Requisiti della commessa', 'Raccogli ciò che deve guidare le scelte del progettista.', '03', grid(briefFields.slice(-1), 'brief', project.brief))
    + nextButton('part', 'Definisci pezzo e materiale');
}
function renderPart() {
  const keys = (names) => partFields.filter((field) => names.includes(field.key));
  return card('Pezzo da produrre', 'Caso di riferimento: guscio per dispositivo elettronico da interno.', '01', grid(partFields.slice(0, 4), 'part', project.part))
    + card('Geometria dei gusci', 'Registra dimensioni, profilo e ripartizione dell’assieme.', '02', grid(keys(['length_mm', 'width_mm', 'height_mm', 'corner_radius_mm', 'nominal_wall_mm', 'opening', 'dimension_basis', 'front_share_percent']), 'part', project.part))
    + card('Estetica e agganci', 'Requisiti distinti dai risultati delle verifiche meccaniche.', '03', grid(keys(['surface_finish', 'fastening', 'aesthetic_surfaces', 'snap_service', 'snap_count', 'snap_layout', 'snap_cycles', 'aesthetic_requirements', 'undercuts']), 'part', project.part))
    + card('Elettronica, aperture e protezione', 'Definisci le funzioni che condizionano la progettazione del pezzo.', '04', grid(keys(['electronics_configuration', 'pcb_count', 'pcb_layout', 'pcb_length_mm', 'pcb_width_mm', 'pcb_height_mm', 'external_openings', 'ip_target', 'ip_in_use', 'thermal_strategy', 'connector_strategy']), 'part', project.part))
    + card('Varianti di spessore', 'Confronta alternative prima di scegliere lo spessore nominale finale.', '05', '<div id="wall-comparison"></div>')
    + '<div class="summary-note">L’anteprima parametrica genera un guscio rettangolare semplificato. L’importazione STEP e la progettazione dello stampo saranno integrate nelle fasi successive.</div>'
    + nextButton('concept', 'Apri l’anteprima 3D');
}
function renderWallComparison() {
  const target = $('#wall-comparison');
  if (!target) return;
  const options = project.part.wall_options_mm;
  const finish = partFields.find((f) => f.key === 'surface_finish').choices.find(([key]) => key === project.part.surface_finish)?.[1] ?? 'Da definire';
  const fastening = partFields.find((f) => f.key === 'fastening').choices.find(([key]) => key === project.part.fastening)?.[1] ?? 'Da definire';
  target.innerHTML = `<div class="wall-chips" aria-label="Varianti di spessore configurate">${options.map((v) => `<span class="wall-chip">${displayNumber(v, ' mm')}<button type="button" data-remove-wall="${v}" aria-label="Rimuovi variante ${displayNumber(v, ' mm')}">×</button></span>`).join('')}${options.length ? '' : '<p class="muted">Nessuna variante di spessore configurata.</p>'}</div><form id="wall-form" class="wall-form"><div><label for="wall-new-value">Aggiungi spessore <span class="field-unit">mm</span></label><input id="wall-new-value" name="wall" type="number" min="0.01" step="any" inputmode="decimal" placeholder="Es. 3" required></div><button class="button secondary" type="submit">Aggiungi variante</button></form>${options.length ? `<div class="comparison-scroll"><table class="data-table comparison-table"><caption>Alternative configurate · verifiche ingegneristiche da eseguire</caption><thead><tr><th scope="col">Variante</th><th scope="col">Spessore</th><th scope="col">Finitura</th><th scope="col">Fissaggi</th></tr></thead><tbody>${options.map((v, i) => `<tr><th scope="row">S${i + 1}</th><td>${displayNumber(v, ' mm')}</td><td>${esc(finish)}</td><td>${esc(fastening)}</td></tr>`).join('')}</tbody></table></div>` : ''}<p class="form-note">Gli spessori sono candidati da valutare per materiale, resa estetica, deformazione e agganci. Il prototipo conserva le alternative; i risultati fisici saranno calcolati dal motore ingegneristico.</p><button type="button" class="text-button" id="complete-case-requirements">Completa i requisiti mancanti dal caso di riferimento</button>`;
}
function previewWall() {
  return project.part.wall_options_mm.includes(project.concept_preview.wall_mm) ? project.concept_preview.wall_mm : project.part.wall_options_mm[0] ?? project.part.nominal_wall_mm;
}
function conceptFromProject(p = project.part, wall = previewWall()) {
  if (p.opening === 'paired_shells' && p.dimension_basis === 'unspecified') throw new Error('Conferma se le dimensioni riguardano il prodotto assemblato o ciascun guscio.');
  if (p.opening === 'paired_shells' && !(p.front_share_percent > 0 && p.front_share_percent < 100)) throw new Error('Definisci la ripartizione dell’altezza fra i due gusci.');
  if (p.opening === 'paired_shells' && p.dimension_basis === 'per_shell' && p.front_share_percent !== 50) throw new Error('Per due gusci di altezze diverse indica l’ingombro assemblato e la relativa ripartizione.');
  return createShellConcept({ length: p.length_mm, width: p.width_mm, height: p.opening === 'paired_shells' && p.dimension_basis === 'per_shell' ? p.height_mm * 2 : p.height_mm, wall, opening: p.opening, frontFraction: p.front_share_percent / 100, cornerRadius: p.corner_radius_mm });
}
function renderDescriptionProposal() {
  const target = $('#description-proposal');
  if (!target) return;
  const labels = { length_mm: 'Lunghezza', width_mm: 'Larghezza', height_mm: 'Altezza', wall_mm: 'Parete in anteprima', corner_radius_mm: 'Raggio', material: 'Materiale', surface_finish: 'Finitura' };
  target.innerHTML = studio.proposal ? `<div class="command-proposal"><strong>Modifica da applicare</strong><dl>${Object.entries(studio.proposal).map(([key, value]) => `<div><dt>${labels[key]}</dt><dd>${typeof value === 'number' ? displayNumber(value, ' mm') : esc(value === 'glossy' ? 'Lucida' : value === 'satin' ? 'Satinata' : value)}</dd></div>`).join('')}</dl><p>Modifica il guscio parametrico. La parete resta una variante da valutare.</p><div class="proposal-actions"><button class="button primary compact" id="apply-description">Applica al modello</button><button class="text-button" id="discard-description">Scarta</button></div></div>` : '';
}
function applyDescription() {
  if (!studio.proposal || invalidFields.size) { notify('Correggi le proprietà evidenziate prima di applicare.'); return; }
  const changes = studio.proposal, part = structuredClone(project.part);
  for (const [key, value] of Object.entries(changes)) if (key !== 'wall_mm') part[key] = value;
  const wall = changes.wall_mm ?? previewWall();
  if (changes.wall_mm && !part.wall_options_mm.includes(wall)) part.wall_options_mm.push(wall);
  part.wall_options_mm.sort((a, b) => a - b);
  try { conceptFromProject(part, wall); }
  catch (error) { $('#studio-message').textContent = `Modifica non applicata: ${error.message}`; return; }
  studio.previous = { part: structuredClone(project.part), concept_preview: structuredClone(project.concept_preview), sources: structuredClone(Object.fromEntries(Object.entries(project.sources).filter(([key]) => key.startsWith('part.')))) };
  project.part = part; project.concept_preview.wall_mm = wall;
  for (const key of Object.keys(changes)) project.sources[`part.${key === 'wall_mm' ? 'wall_options_mm' : key}`] = { kind: 'user', method: 'local_command', raw_text: studio.draft, recorded_at: new Date().toISOString() };
  studio.source = 'parametric'; studio.proposal = null; studio.message = 'Modello aggiornato. Puoi continuare a descrivere o modificare le proprietà.';
  save(); render('concept');
}

document.addEventListener('keydown', (event) => {
  if (!event.target.matches('[data-source-tab]') || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const tabs = [...document.querySelectorAll('[data-source-tab]')], current = tabs.indexOf(event.target);
  tabs[event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length].click();
});
document.addEventListener('change', async (event) => {
  const input = event.target;
  if (!['mesh-file', 'photo-file'].includes(input.id) || !input.files?.length) return;
  if (invalidFields.size) { notify('Correggi le proprietà evidenziate prima di caricare un file.'); input.value = ''; return; }
  const request = ++assetRequest, projectId = project.id, file = input.files[0];
  const status = (message) => { studio.message = message; if ($('#studio-message')) $('#studio-message').textContent = message; };
  status('Lettura del file sul dispositivo…');
  let photoUrl;
  try {
    if (input.id === 'mesh-file') {
      const units = $('#mesh-units').value;
      if (!units) throw new Error('Seleziona prima l’unità delle coordinate del file.');
      if (file.size > 12 * 1024 * 1024) throw new Error('La demo accetta mesh fino a 12 MB.');
      const { importMesh } = await import('./mesh-import.js');
      const mesh = importMesh(await file.arrayBuffer(), file.name, units);
      if (request !== assetRequest || projectId !== project.id) return;
      studio.imported = mesh; studio.source = 'imported';
      status('Mesh caricata. Gli ingombri dipendono dall’unità selezionata; il brief non è stato modificato.');
    } else {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) throw new Error('Scegli una foto JPG, PNG o WebP fino a 8 MB.');
      photoUrl = URL.createObjectURL(file);
      const reference = new Image(); reference.src = photoUrl; await reference.decode();
      if (reference.naturalWidth * reference.naturalHeight > 25000000) throw new Error('Riduci la foto a meno di 25 megapixel.');
      if (request !== assetRequest || projectId !== project.id) { URL.revokeObjectURL(photoUrl); return; }
      if (studio.photo) URL.revokeObjectURL(studio.photo);
      studio.photo = photoUrl; studio.photoName = file.name; photoUrl = null;
      status('Riferimento aggiunto. La foto non ha modificato la geometria 3D.');
    }
    if (currentView === 'concept') render('concept');
  } catch (error) { if (photoUrl) URL.revokeObjectURL(photoUrl); if (request === assetRequest && projectId === project.id) status(error.message || 'Impossibile leggere il file.'); }
  finally { input.value = ''; }
});
function renderConcept() {
  const controls = ['length_mm', 'width_mm', 'height_mm', 'corner_radius_mm', 'opening', 'dimension_basis', 'front_share_percent'];
  return renderWorkspace({ project, wall: previewWall(), properties: grid(partFields.filter((f) => controls.includes(f.key)), 'part', project.part), exploded: previewExploded, transparent: previewTransparent });
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
    $('#concept-metrics').innerHTML = `<div><span>${imported ? 'Ingombro della mesh' : 'Ingombro assemblato'}</span><strong>${displayNumber(length)} × ${displayNumber(width)} × ${displayNumber(height)} mm</strong></div><div><span>${imported ? 'Superficie triangolata' : 'Volume geometrico'}</span><strong ${imported ? '' : `data-volume-mm3="${concept.volume_mm3}"`}>${imported ? displayNumber(concept.triangle_count, ' triangoli') : displayNumber(concept.volume_mm3 / 1000, ' cm³')}</strong></div><div><span>${imported ? 'Origine coordinate' : 'Profilo esterno'}</span><strong>${imported ? esc(concept.source_units) : `R${displayNumber(concept.corner_radius_mm, ' mm')}`}</strong></div>`;
    const { mountConceptViewer } = await import('./concept-view.js');
    if (request !== viewerRequest || !container.isConnected) return;
    activeViewer = mountConceptViewer(container, concept, { finish: project.part.surface_finish });
    activeViewer.setView(previewCamera);
    activeViewer.setExploded(!imported && previewExploded);
    activeViewer.setTransparent(previewTransparent);
    $('#concept-explode').disabled = Boolean(imported) || concept.components.length !== 2;
  } catch (error) {
    if (request !== viewerRequest || !container.isConnected) return;
    const text = document.createElement('p'); text.className = 'concept-message';
    text.textContent = currentConceptModel || studio.source === 'imported' ? 'Il visualizzatore 3D non è disponibile in questo browser. Per il rendering serve WebGL2.' : error.message;
    container.replaceChildren(text);
    container.dataset.renderStatus = 'unavailable';
  }
}
function renderMachines() {
  const list = project.machines.length ? `<div class="machine-list">${project.machines.map((m) => `<article class="machine-item"><div><h3>${esc(m.name)}</h3><p>${m.ownership === 'purchase' ? 'Da acquistare' : 'Già disponibile'} · ${displayNumber(m.clamping_force_kn, ' kN')} · ${displayMoney(m.hourly_rate_eur)} / ora</p></div><div class="actions"><button class="text-button" data-edit-machine="${esc(m.id)}">Modifica</button><button class="text-button" data-remove-machine="${esc(m.id)}">Rimuovi</button></div></article>`).join('')}</div>` : '<div class="empty-state"><h3>Nessuna pressa configurata</h3><p>Aggiungi macchine disponibili e candidati da acquistare.</p></div>';
  const values = project.machines.find((m) => m.id === editMachineId) ?? blankValues(machineFields);
  return card('Parco presse e nuovi investimenti', 'Entrambe le possibilità fanno parte del confronto.', '01', list)
    + card(editMachineId ? 'Modifica pressa' : 'Aggiungi una pressa candidata', 'Usa i valori delle schede macchina e le tariffe pertinenti.', '02', `<form id="machine-form">${grid(machineFields, 'machine', values)}<p id="machine-error" class="form-note" role="alert" hidden></p><div class="step-actions" style="margin-top:22px"><button class="button secondary" type="button" id="cancel-machine">${editMachineId ? 'Annulla modifica' : 'Svuota campi'}</button><button class="button primary" type="submit">${editMachineId ? 'Salva modifiche' : 'Aggiungi pressa'}</button></div></form>`)
    + '<div class="summary-note">Le presse registrate sono candidate. La compatibilità sarà calcolata quando saranno disponibili geometria dello stampo, fabbisogno di iniezione e corse richieste.</div>'
    + nextButton('summary', 'Rivedi il brief');
}
function sourceLabel(path) {
  const kind = project.sources[path]?.kind;
  return kind === 'demo' ? 'Esempio illustrativo' : kind === 'requirement' ? 'Requisito del caso di riferimento' : 'Fornito dall’utente';
}
function row(label, value, path) {
  const missing = value == null || value === '';
  return `<tr><th scope="row">${esc(label)}</th><td>${missing ? 'Da definire' : esc(value)}${path && !missing ? `<span class="source-tag">${sourceLabel(path)}</span>` : ''}</td></tr>`;
}
function choiceLabel(key) {
  return partFields.find((f) => f.key === key)?.choices?.find(([value]) => value === project.part[key])?.[1] ?? 'Da definire';
}
function functionalRequirementsCard() {
  const p = project.part;
  const ip65Vents = p.ip_target === 'IP65' && p.external_openings === 'connector_vents';
  const sealedIp65 = p.ip_target === 'IP65' && p.thermal_strategy === 'sealed';
  let note = ip65Vents ? 'IP65 e ventilazione richiedono aperture protette e una soluzione da qualificare. Uno sfiato a membrana per compensare la pressione non equivale a un ricambio d’aria per raffreddare le schede.' : sealedIp65 ? 'Lo sfiato protetto compensa la pressione; il raffreddamento è da valutare a involucro chiuso. Tenute dei gusci e dello sportello, passaggio cavo e prestazioni termiche sono da dimensionare. IP65 è un obiettivo non ancora verificato.' : '';
  if (p.ip_target === 'IP65' && p.ip_in_use === 'with_cable') note += ' La protezione richiesta con cavo collegato richiede una tenuta dedicata al passaggio cavo, oltre allo sportello.';
  const pcbSize = [p.pcb_length_mm, p.pcb_width_mm, p.pcb_height_mm].every((v) => v > 0) ? [p.pcb_length_mm, p.pcb_width_mm, p.pcb_height_mm].map((v) => displayNumber(v)).join(' × ') + ' mm' : null;
  return card('Aperture e requisiti funzionali', 'Schede, aperture e tenute non sono ancora ricavate nella geometria.', 'REQ', `<table class="data-table">${row('Contenuto', choiceLabel('electronics_configuration'), 'part.electronics_configuration')}${row('Numero schede', p.pcb_count, 'part.pcb_count')}${row('Disposizione schede', choiceLabel('pcb_layout'), 'part.pcb_layout')}${row('Ingombro per scheda con componenti', pcbSize)}${row('Aperture', choiceLabel('external_openings'), 'part.external_openings')}${row('Protezione richiesta', choiceLabel('ip_target'), 'part.ip_target')}${row('Condizioni d’uso IP', choiceLabel('ip_in_use'), 'part.ip_in_use')}${row('Architettura termica', choiceLabel('thermal_strategy'), 'part.thermal_strategy')}${row('Connettore', choiceLabel('connector_strategy'), 'part.connector_strategy')}</table>${note ? `<p class="form-note">${esc(note)}</p>` : ''}`);
}
function renderSummary() {
  const b = project.brief, p = project.part;
  return card('Richiesta e obiettivi', 'Riepilogo degli input commerciali, con la loro provenienza.', '01', `<table class="data-table">${row('Progetto', b.project_name, 'brief.project_name')}${row('Cliente', b.customer, 'brief.customer')}${row('Quantità annua', b.annual_volume == null ? null : displayNumber(b.annual_volume, ' pezzi conformi'), 'brief.annual_volume')}${row('Durata commessa', b.program_years == null ? null : displayNumber(b.program_years, ' anni'), 'brief.program_years')}${row('Impostazione economica', b.cost_target_mode === 'exploratory' ? 'Costo da ricavare dal confronto' : 'Obiettivo fissato', 'brief.cost_target_mode')}${row('Costo industriale obiettivo', b.cost_target_mode === 'exploratory' ? 'Da fissare dopo il confronto' : b.unit_cost_target_eur == null ? null : displayMoney(b.unit_cost_target_eur), b.cost_target_mode === 'exploratory' ? null : 'brief.unit_cost_target_eur')}${row('Prezzo di vendita', b.selling_price_eur == null ? null : displayMoney(b.selling_price_eur), 'brief.selling_price_eur')}${row('Budget stampo', b.mould_budget_eur == null ? null : displayMoney(b.mould_budget_eur), 'brief.mould_budget_eur')}</table>`)
    + card('Pezzo e risorse', 'Base per il concept stampo e il confronto delle presse.', '02', `<table class="data-table">${row('Pezzo', p.name, 'part.name')}${row('Destinazione', p.application, 'part.application')}${row('Materiale / alternative', p.material, 'part.material')}${row('Grado commerciale', p.material_grade, 'part.material_grade')}${row('Lunghezza', p.length_mm == null ? null : displayNumber(p.length_mm, ' mm'), 'part.length_mm')}${row('Larghezza', p.width_mm == null ? null : displayNumber(p.width_mm, ' mm'), 'part.width_mm')}${row('Altezza', p.height_mm == null ? null : displayNumber(p.height_mm, ' mm'), 'part.height_mm')}${row('Presse già disponibili', project.machines.filter((m) => m.ownership === 'existing').length)}${row('Presse da acquistare', project.machines.filter((m) => m.ownership === 'purchase').length)}</table>`)
    + card('Estetica, fissaggi e varianti', 'Requisiti di progetto e alternative da verificare.', '03', `<table class="data-table">${row('Finitura', partFields.find((f) => f.key === 'surface_finish').choices.find(([key]) => key === p.surface_finish)?.[1], 'part.surface_finish')}${row('Fissaggi', partFields.find((f) => f.key === 'fastening').choices.find(([key]) => key === p.fastening)?.[1], 'part.fastening')}${row('Spessori da confrontare', p.wall_options_mm.length ? p.wall_options_mm.map((v) => displayNumber(v, ' mm')).join(' / ') : null, 'part.wall_options_mm')}${row('Spessore nominale scelto', p.nominal_wall_mm == null ? null : displayNumber(p.nominal_wall_mm, ' mm'), 'part.nominal_wall_mm')}${row('Requisiti estetici', p.aesthetic_requirements, 'part.aesthetic_requirements')}</table>`)
    + card('Configurazione dell’involucro', 'Requisiti dell’assieme e del collegamento fra i gusci.', '04', `<table class="data-table">${row('Apertura / componenti', choiceLabel('opening'), 'part.opening')}${row('Riferimento delle dimensioni', choiceLabel('dimension_basis'), 'part.dimension_basis')}${row('Quota anteriore', p.front_share_percent == null ? null : displayNumber(p.front_share_percent, '%'), 'part.front_share_percent')}${row('Raggio del profilo', p.corner_radius_mm == null ? null : displayNumber(p.corner_radius_mm, ' mm'), 'part.corner_radius_mm')}${row('Superfici estetiche', choiceLabel('aesthetic_surfaces'), 'part.aesthetic_surfaces')}${row('Smontaggio', choiceLabel('snap_service'), 'part.snap_service')}${row('Numero agganci', p.snap_count, 'part.snap_count')}${row('Disposizione agganci', choiceLabel('snap_layout'), 'part.snap_layout')}${row('Cicli richiesti', p.snap_cycles, 'part.snap_cycles')}</table>`)
    + functionalRequirementsCard()
    + '<div class="summary-note">L’anteprima del pezzo è geometrica e semplificata. La prima consegna completa sarà il concept stampo 3D con confronto costi e compatibilità pressa; questi moduli sono ancora da sviluppare.</div>'
    + '<div class="step-actions"><button class="button secondary" data-go="brief">Torna al brief</button><button class="button primary" data-export>Esporta requisiti JSON</button></div>';
}
const viewDefinitions = {
  brief: ['Brief cliente', 'Definisci obiettivi, volumi e vincoli che guideranno la scelta dello stampo e della pressa.', renderBrief],
  part: ['Pezzo e materiale', 'Raccogli geometria, requisiti estetici e caratteristiche di estrazione.', renderPart],
  concept: ['Anteprima pezzo 3D', 'Esplora il volume del guscio prima di sviluppare agganci e concept dello stampo.', renderConcept],
  machines: ['Presse candidate', 'Confronta il parco disponibile con le macchine da acquistare.', renderMachines],
  summary: ['Riepilogo requisiti', 'Rivedi gli input e prepara una base condivisa per il progetto.', renderSummary],
};
function render(view = currentView) {
  if (!viewDefinitions[view]) return;
  if (invalidFields.size) {
    notify('Correggi i valori numerici evidenziati prima di cambiare schermata. Le modifiche non valide non sono state salvate.');
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
  document.title = `Progettazione stampi · ${title}`;
  $('#content').innerHTML = content();
  renderWallComparison();
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
    { label: 'Identità del progetto', done: Boolean(project.brief.project_name.trim()), view: 'brief', field: 'brief-project_name', title: 'Qual è il progetto?', copy: 'Assegna un nome alla richiesta per organizzare la commessa.' },
    { label: 'Quantità e durata', done: project.brief.annual_volume > 0 && project.brief.program_years > 0, view: 'brief', field: project.brief.annual_volume > 0 ? 'brief-program_years' : 'brief-annual_volume', title: 'Quale domanda deve soddisfare?', copy: 'Quantità annua e durata della commessa guidano capacità e investimenti.' },
    { label: 'Impostazione economica', done: project.brief.cost_target_mode === 'exploratory' || project.brief.unit_cost_target_eur != null, view: 'brief', field: 'brief-unit_cost_target_eur', title: 'Qual è il costo obiettivo?', copy: 'Hai scelto un obiettivo fissato: indica il valore, oppure torna all’esplorazione delle alternative.' },
    { label: 'Materiale / alternative', done: Boolean(project.part.material.trim()), view: 'part', field: 'part-material', title: 'Quali materiali consideriamo?', copy: 'Registra il materiale o le alternative; il grado commerciale sarà necessario per le simulazioni.' },
    { label: 'Ingombro del pezzo', done: ['length_mm', 'width_mm', 'height_mm'].every((key) => project.part[key] > 0), view: 'part', field: `part-${['length_mm', 'width_mm', 'height_mm'].find((key) => !(project.part[key] > 0)) ?? 'length_mm'}`, title: 'Quali sono gli ingombri?', copy: 'Definisci le tre dimensioni esterne in millimetri.' },
    { label: 'Presse candidate', done: project.machines.length > 0, view: 'machines', field: 'machine-name', title: 'Quali presse valutiamo?', copy: 'Aggiungi una pressa disponibile o una candidata da acquistare.' },
  ];
}
function updateInspector() {
  const name = project.brief.project_name.trim() || 'Nuovo progetto';
  $('#sidebar-project').textContent = name;
  $('#breadcrumb-project').textContent = name;
  const items = checklist(), done = items.filter((i) => i.done).length;
  $('#progress-value').textContent = `${done} / ${items.length}`;
  $('#progress-fill').style.width = `${done / items.length * 100}%`;
  $('#checklist').innerHTML = items.map((i) => `<li class="${i.done ? 'done' : ''}"><span class="check-indicator" aria-hidden="true">${i.done ? '✓' : ''}</span>${esc(i.label)}<span class="visually-hidden">${i.done ? ': compilato' : ': da compilare'}</span></li>`).join('');
  const next = items.find((i) => !i.done);
  $('#next-question-title').textContent = next?.title ?? 'La base del brief è compilata';
  $('#next-question-copy').textContent = next?.copy ?? 'Rivedi requisiti estetici, grado del materiale e schede macchina prima delle verifiche di progetto.';
  $('#next-question-button').textContent = next ? 'Completa il campo ↗' : 'Rivedi il riepilogo ↗';
  $('#next-question-button').onclick = () => { render(next?.view ?? 'summary'); if (next) document.getElementById(next.field)?.focus(); };
  const demo = project.dataset_kind === 'demo';
  $('#data-badge').textContent = demo ? 'Esempio UX · valori illustrativi' : 'Dati forniti dall’utente';
  $('#data-badge').classList.toggle('demo', demo);
  let canRestore = false;
  try { canRestore = Boolean(localStorage.getItem(BACKUP_KEY)); } catch { /* Export remains available. */ }
  $('#example-button').textContent = canRestore ? 'Ripristina il tuo progetto' : 'Carica esempio di compilazione';
}
function exportProject() {
  if (invalidFields.size) { notify('Correggi i valori numerici evidenziati prima di esportare.'); return; }
  const data = { ...project, exported_at: new Date().toISOString(), prototype_capabilities: ['brief_capture', 'machine_catalogue', 'wall_variant_configuration', 'parametric_shell_preview', 'local_commands', 'obj_stl_viewer', 'photo_reference', 'local_persistence'], session_assets: { mesh: studio.imported ? { name: studio.imported.file_name, dimensions_mm: studio.imported.dimensions_mm, source_units: studio.imported.source_units } : null, photo_name: studio.photoName || null, persistence: 'metadata_only_reload_original_files' }, engineering_validation: 'not_performed' };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `brief-${project.id.slice(0, 8)}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('Brief esportato in JSON, con unità e provenienza dei dati.');
}
function demoProject() {
  const data = newProject();
  data.dataset_kind = 'demo';
  Object.assign(data.brief, { project_name: 'Involucro elettronica · esempio UX', customer: 'Cliente dimostrativo', reference: 'DEMO-001', annual_volume: 250000, lot_size: 10000, unit_cost_target_eur: null, selling_price_eur: 1.8, mould_budget_eur: 85000, notes: 'Volumi, prezzo e budget illustrativi per provare la UX. Il costo industriale deve emergere dal confronto; non è ancora calcolato.' });
  data.machines = [ { id: crypto.randomUUID(), ...blankValues(machineFields), name: 'Pressa A · esempio', ownership: 'existing', clamping_force_kn: 2000, tie_bar_width_mm: 500, tie_bar_height_mm: 500, min_mould_height_mm: 200, max_mould_height_mm: 550, opening_stroke_mm: 450, shot_volume_cm3: 400, hourly_rate_eur: 65 }, { id: crypto.randomUUID(), ...blankValues(machineFields), name: 'Pressa B · esempio', ownership: 'purchase', clamping_force_kn: 2500, purchase_cost_eur: 180000 } ];
  for (const group of ['brief', 'part']) for (const field of Object.keys(data[group])) if (!data.sources[`${group}.${field}`]) data.sources[`${group}.${field}`] = { kind: 'demo', note: 'Valore illustrativo per verifica UX' };
  for (const machine of data.machines) data.sources[`machines.${machine.id}`] = { kind: 'demo', note: 'Scheda illustrativa; nessuna compatibilità verificata' };
  return data;
}

document.addEventListener('input', (event) => {
  const field = event.target;
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
      $('#concept-viewport').innerHTML = '<p class="concept-message">Correggi i valori geometrici evidenziati per aggiornare l’anteprima.</p>';
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
document.addEventListener('click', (event) => {
  const sourceTab = event.target.closest('[data-source-tab]');
  if (sourceTab) { if (invalidFields.size) { notify('Correggi le proprietà evidenziate.'); return; } studio.tab = sourceTab.dataset.sourceTab; render('concept'); $(`#source-tab-${studio.tab}`)?.focus(); return; }
  const modelSource = event.target.closest('[data-model-source]');
  if (modelSource) { if (invalidFields.size) { notify('Correggi le proprietà evidenziate.'); return; } studio.source = modelSource.dataset.modelSource; studio.message = ''; render('concept'); return; }
  if (event.target.closest('#apply-description')) { applyDescription(); return; }
  if (event.target.closest('#discard-description')) { studio.proposal = null; renderDescriptionProposal(); return; }
  if (event.target.closest('#undo-description') && studio.previous) {
    if (invalidFields.size) { notify('Correggi le proprietà evidenziate prima di annullare.'); return; }
    project.part = studio.previous.part; project.concept_preview = studio.previous.concept_preview;
    project.sources = { ...Object.fromEntries(Object.entries(project.sources).filter(([key]) => !key.startsWith('part.'))), ...studio.previous.sources };
    studio.previous = null; studio.proposal = null; studio.source = 'parametric'; save(); render('concept'); notify('Ultima modifica da testo annullata.'); return;
  }
  if (event.target.closest('#adopt-mesh-dimensions') && studio.imported) {
    if (invalidFields.size) { notify('Correggi le proprietà evidenziate.'); return; }
    const d = studio.imported.dimensions_mm;
    if (![d.length, d.width, d.height].every((v) => v > 0)) { notify('Una superficie piana non definisce i tre ingombri del pezzo.'); return; }
    for (const [key, value] of Object.entries({ length_mm: d.length, width_mm: d.width, height_mm: d.height })) { project.part[key] = value; project.sources[`part.${key}`] = { kind: 'user', method: 'mesh_bounds', file: studio.imported.file_name, source_units: studio.imported.source_units }; }
    project.part.dimension_basis = 'assembly'; project.sources['part.dimension_basis'] = { kind: 'user', method: 'mesh_bounds' }; studio.previous = null; save(); render('concept'); notify('Ingombri della mesh trasferiti al brief. Geometria e requisiti restano distinti.'); return;
  }
  if (event.target.closest('#remove-photo')) { assetRequest++; URL.revokeObjectURL(studio.photo); studio.photo = null; studio.photoName = ''; render('concept'); return; }
  const camera = event.target.closest('[data-concept-camera]');
  if (camera) { previewCamera = camera.dataset.conceptCamera; activeViewer?.setView(previewCamera); return; }
  const wall = event.target.closest('[data-preview-wall]');
  if (wall) {
    if (invalidFields.size) { notify('Correggi i valori evidenziati prima di cambiare variante.'); return; }
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
    const link = document.createElement('a'); link.href = url; link.download = `guscio-concept-${currentConceptModel.wall_mm}mm.obj`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); notify('Geometria preliminare esportata. Le coordinate OBJ sono in millimetri.'); return;
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
    save(); render('part'); notify(changes ? 'Requisiti mancanti completati. Le scelte già registrate sono state conservate.' : 'I requisiti sono già compilati; le tue scelte sono state conservate.'); return;
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
    save(); render('machines'); notify('Pressa rimossa dal confronto.'); return;
  }
  if (event.target.closest('#cancel-machine')) { editMachineId = null; render('machines'); }
});
document.addEventListener('submit', (event) => {
    if (event.target.id === 'description-form') {
    event.preventDefault();
    if (invalidFields.size) { notify('Correggi le proprietà evidenziate prima di preparare una modifica.'); return; }
    try { studio.proposal = describePart(studio.draft); studio.message = ''; $('#studio-message').textContent = ''; renderDescriptionProposal(); }
    catch (error) { studio.proposal = null; renderDescriptionProposal(); $('#studio-message').textContent = error.message; }
    return;
  }
  if (event.target.id === 'wall-form') {
    event.preventDefault();
    if (!event.target.reportValidity()) return;
    const input = $('#wall-new-value'), value = input.valueAsNumber;
    if (project.part.wall_options_mm.includes(value)) { notify('Questa variante è già presente.'); return; }
    project.part.wall_options_mm = [...project.part.wall_options_mm, value].sort((a, b) => a - b);
    studio.previous = null;
    project.sources['part.wall_options_mm'] = { kind: 'user', recorded_at: new Date().toISOString() };
    save(); renderWallComparison(); notify('Variante di spessore aggiunta.'); return;
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
  if (!machine.name) { error.hidden = false; error.textContent = 'Assegna un nome alla pressa.'; return; }
  if (machine.min_mould_height_mm != null && machine.max_mould_height_mm != null && machine.min_mould_height_mm > machine.max_mould_height_mm) { error.hidden = false; error.textContent = 'L’altezza stampo minima deve essere inferiore o uguale alla massima.'; return; }
  const index = project.machines.findIndex((m) => m.id === machine.id);
  if (index >= 0) project.machines[index] = machine; else project.machines.push(machine);
  project.sources[`machines.${machine.id}`] = { kind: 'user', recorded_at: new Date().toISOString() };
  editMachineId = null; save(); render('machines'); notify('Pressa salvata tra le candidate.');
});
$('#export-button').addEventListener('click', exportProject);
$('#example-button').addEventListener('click', () => {
  if (invalidFields.size) { notify('Correggi i valori numerici evidenziati prima di aprire un altro progetto.'); return; }
  if (!storageAvailable) { notify('Esporta il progetto corrente. Il salvataggio locale non è disponibile per conservarlo prima dell’esempio.'); return; }
  try { if (localStorage.getItem(BACKUP_KEY)) $('#reset-dialog').showModal(); else $('#example-dialog').showModal(); }
  catch { notify('Impossibile conservare il progetto corrente: esportalo prima di aprire l’esempio.'); }
});
$('#example-dialog').addEventListener('close', () => {
  if ($('#example-dialog').returnValue !== 'load') return;
  try { localStorage.setItem(BACKUP_KEY, JSON.stringify(project)); }
  catch { notify('Impossibile conservare il progetto corrente: l’esempio non è stato aperto.'); return; }
  clearStudioAssets(); project = demoProject(); editMachineId = null; save(); render('brief'); notify('Esempio aperto. I valori sono illustrativi; il tuo progetto è conservato.');
});
$('#reset-dialog').addEventListener('close', () => {
  if ($('#reset-dialog').returnValue !== 'restore') return;
  try {
    const backup = normalizeStoredProject(JSON.parse(localStorage.getItem(BACKUP_KEY)));
    clearStudioAssets(); project = backup; editMachineId = null;
    if (!save()) return;
    localStorage.removeItem(BACKUP_KEY); render('brief'); notify('Il tuo progetto è stato ripristinato.');
  } catch { notify('Ripristino non riuscito. Il progetto conservato non è stato eliminato.'); }
});
const startView = document.querySelector('meta[name="app-start-view"]')?.content;
render(viewDefinitions[startView] ? startView : 'concept');
if (initialLoadError) notify(initialLoadError);
if (!storageAvailable) $('#save-status').textContent = 'Solo in memoria · esporta il brief';
