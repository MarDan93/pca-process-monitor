import italian from './locales/it.json' with { type: 'json' };
import french from './locales/fr.json' with { type: 'json' };
import spanish from './locales/es.json' with { type: 'json' };

export const languages = ['en', 'it', 'fr', 'es'];
export const languageStorageKey = 'mould-studio-language';
const catalogues = { en: {}, it: italian, fr: french, es: spanish };
const locales = { en: 'en-GB', it: 'it-IT', fr: 'fr-FR', es: 'es-ES' };
let language = 'en';
try { const saved = globalThis.localStorage?.getItem(languageStorageKey); if (languages.includes(saved)) language = saved; } catch { /* A blocked preference store does not block the app. */ }

export const getLanguage = () => language;
export function t(message, values = {}) {
  const template = catalogues[language][message] ?? message;
  return template.replace(/\{(\w+)\}/g, (match, key) => Object.hasOwn(values, key) ? String(values[key]) : match);
}
export const formatNumber = (value) => new Intl.NumberFormat(locales[language], { maximumFractionDigits: 2 }).format(value);
export const formatMoney = (value) => new Intl.NumberFormat(locales[language], { style: 'currency', currency: 'EUR' }).format(value);

const sources = new WeakMap();
const attributes = new WeakMap();
const excluded = 'script,style,textarea,[data-user-content],[translate="no"]';

// Keep English UI source text independent from its current translation.
// User-authored data is explicitly excluded; form values are never translated.
function translatedValue(record, current) {
  const source = record && current === record.rendered ? record.source : current;
  const trimmed = source.trim();
  const translation = t(trimmed);
  const rendered = source.replace(trimmed, () => translation);
  return { source, rendered };
}
export function translateUi(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.nodeValue.trim() || node.parentElement?.closest(excluded)) continue;
    const record = translatedValue(sources.get(node), node.nodeValue);
    sources.set(node, record);
    if (node.nodeValue !== record.rendered) node.nodeValue = record.rendered;
  }
  for (const element of root.querySelectorAll('[placeholder],[title],[aria-label],[alt]')) {
    if (element.closest('[data-user-content],[translate="no"]')) continue;
    const stored = attributes.get(element) ?? {};
    for (const key of ['placeholder', 'title', 'aria-label', 'alt']) {
      if (!element.hasAttribute(key)) continue;
      const record = translatedValue(stored[key], element.getAttribute(key));
      stored[key] = record;
      if (element.getAttribute(key) !== record.rendered) element.setAttribute(key, record.rendered);
    }
    attributes.set(element, stored);
  }
}
export function setLanguage(value) {
  language = languages.includes(value) ? value : 'en';
  try { globalThis.localStorage?.setItem(languageStorageKey, language); } catch { /* Session preference remains usable. */ }
  if (globalThis.document) { document.documentElement.lang = language; translateUi(); }
  return language;
}
export function startLocalization() {
  document.documentElement.lang = language;
  translateUi();
  const observer = new MutationObserver(() => translateUi());
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label', 'alt'] });
  return () => observer.disconnect();
}
