import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('drink detail pages give prices and outlet navigation with recorded nutrition and no stock claims', async () => {
  const source = await readFile(new URL('../src/pages/drinks/[slug].astro', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /schema.org\/InStock/);
  for (const field of ['caloriesPer100ml', 'caloriesM', 'caloriesL', 'nutriGrade', 'healthierChoiceType']) {
    assert.ok(source.includes(`drink.${field}`), `Missing ${field}`);
  }
  assert.match(source, /drink\.healthierChoice &&/);
  assert.match(source, /alt="Healthier Choice"/);
  assert.match(source, /<table/);
  assert.match(source, /ListingCard outlet=/);
  assert.match(source, /Check with the brand/);
  assert.match(source, /Report a menu correction/);
});
