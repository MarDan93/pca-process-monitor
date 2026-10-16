import createElement from './node_modules/lucide/dist/esm/createElement.js';
import Box from './node_modules/lucide/dist/esm/icons/box.js';
import Scan from './node_modules/lucide/dist/esm/icons/scan.js';
import Grid2x2 from './node_modules/lucide/dist/esm/icons/grid-2x2.js';
import Focus from './node_modules/lucide/dist/esm/icons/focus.js';
import MessageSquare from './node_modules/lucide/dist/esm/icons/message-square.js';
import FileBox from './node_modules/lucide/dist/esm/icons/file-box.js';
import ClipboardList from './node_modules/lucide/dist/esm/icons/clipboard-list.js';

const icons = { Box, Scan, Grid2x2, Focus, MessageSquare, FileBox, ClipboardList };
const icon = (name) => `<span class="cad-icon" data-cad-icon="${name}" aria-hidden="true"></span>`;
export function mountCADIcons() {
  document.querySelectorAll('[data-cad-icon]').forEach((node) => {
    const data = icons[node.dataset.cadIcon];
    if (data) node.replaceChildren(createElement(data));
  });
}
export function renderCADRibbon({ wireframe, gridVisible }) {
  return `<div class="cad-ribbon" role="toolbar" aria-label="Model tools"><div class="ribbon-group"><div class="ribbon-tools"><button data-view="brief">${icon('ClipboardList')}<span>Customer brief</span></button><button data-source-tab="ai">${icon('MessageSquare')}<span>AI assistant</span></button><button data-source-tab="file">${icon('FileBox')}<span>Import mesh</span></button></div><small>Project</small></div><div class="ribbon-group"><div class="ribbon-tools"><button id="concept-fit">${icon('Focus')}<span>Fit model</span></button><button data-concept-camera="iso">${icon('Box')}<span>Isometric</span></button><button id="concept-wireframe" aria-pressed="${wireframe}">${icon('Scan')}<span>Wireframe</span></button><button id="concept-grid" aria-pressed="${gridVisible}">${icon('Grid2x2')}<span>Grid</span></button></div><small>Display</small></div><div class="ribbon-context"><span>PRODUCT WORKSPACE</span><strong>Concept review</strong><small>Reference geometry · millimetres</small></div></div>`;
}
