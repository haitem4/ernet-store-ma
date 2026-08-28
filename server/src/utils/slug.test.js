import assert from 'node:assert/strict';
import test from 'node:test';
import { slugify } from './slug.js';

test('slugify normalizes product names for URLs', () => {
  assert.equal(slugify('Carte mère ASUS B550 - Wi-Fi'), 'carte-mere-asus-b550-wi-fi');
  assert.equal(slugify('  Écran 27" 4K  '), 'ecran-27-4k');
  assert.equal(slugify(''), '');
});
