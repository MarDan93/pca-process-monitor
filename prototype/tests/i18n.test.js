import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { getLanguage, setLanguage, t, formatNumber } from '../i18n.js';
import { describePart } from '../description.js';

test('English is the default and unsupported preferences fall back to English', () => {
  assert.equal(getLanguage(), 'en');
  assert.equal(setLanguage('unsupported'), 'en');
  assert.equal(t('Customer brief'), 'Customer brief');
});
test('all four interface languages and number formats are selectable', () => {
  for (const [language, label, number] of [['it', 'Brief cliente', '1,5'], ['fr', 'Brief client', '1,5'], ['es', 'Brief del cliente', '1,5'], ['en', 'Customer brief', '1.5']]) {
    setLanguage(language);
    assert.equal(t('Customer brief'), label);
    assert.equal(formatNumber(1.5), number);
  }
});
test('translation catalogues have matching keys and preserve interpolation parameters', async () => {
  const catalogues = await Promise.all(['it', 'fr', 'es'].map(async (language) => JSON.parse(await readFile(new URL(`../locales/${language}.json`, import.meta.url), 'utf8'))));
  for (const catalogue of catalogues) {
    assert.deepEqual(Object.keys(catalogue).sort(), Object.keys(catalogues[0]).sort());
    for (const [key, value] of Object.entries(catalogue)) {
      assert.ok(value.trim(), key);
      assert.deepEqual([...value.matchAll(/\{\w+\}/g)].map((match) => match[0]).sort(), [...key.matchAll(/\{\w+\}/g)].map((match) => match[0]).sort(), key);
    }
  }
});
test('local geometric commands accept each supported language', () => {
  for (const text of ['shell 140 x 90 x 40 mm, wall 2 mm, radius 10 mm, glossy ABS', 'guscio 140 x 90 x 40 mm, spessore 2 mm, raggio 10 mm, ABS lucido', 'boîtier 140 x 90 x 40 mm, épaisseur 2 mm, rayon 10 mm, ABS brillant', 'carcasa 140 x 90 x 40 mm, espesor 2 mm, radio 10 mm, ABS brillante']) {
    const result = describePart(text);
    assert.equal(result.wall_mm, 2); assert.equal(result.corner_radius_mm, 10); assert.equal(result.surface_finish, 'glossy');
  }
  assert.equal(describePart('ABS satiné').surface_finish, 'satin');
});
