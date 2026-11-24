import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('drink detail pages give prices and outlet navigation without unsupported nutrition or stock claims', async () => {
  const source = await readFile(new URL('../src/pages/drinks/[slug].astro', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /drink\.(calories|nutriGrade|healthierChoice)|schema.org\/InStock/);
  assert.match(source, /<table/);
  assert.match(source, /ListingCard outlet=/);
  assert.match(source, /Check with the brand/);
  assert.match(source, /Report a menu correction/);
});
