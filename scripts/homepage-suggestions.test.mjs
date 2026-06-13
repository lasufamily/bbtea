import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('homepage suggestions do not include removed Tiger Sugar brand', async () => {
  const source = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /Tiger Sugar/);
});

test('homepage aggregate stats include bubble tea, coffee and juice outlets', async () => {
  const source = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

  assert.match(source, /getCoffeeOutlets/);
  assert.match(source, /getJuiceOutlets/);
  assert.match(source, /getAllVenueTowns/);
  assert.match(source, /const allVenueOutlets = \[\.\.\.outlets, \.\.\.coffeeOutlets, \.\.\.juiceOutlets\];/);
  assert.match(source, /const totalOutlets = allVenueOutlets\.length;/);
  assert.match(source, /const venueBrandSlugs = new Set\(allVenueOutlets\.map\(outlet => outlet\.brandSlug\)\.filter\(Boolean\)\);/);
  assert.match(source, /const totalBrands\s+= brands\.filter\(brand => venueBrandSlugs\.has\(brand\.slug\)\)\.length;/);
});
