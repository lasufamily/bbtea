import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('/reviews cards show overall ratings with yellow star icons', async () => {
  const source = await readFile(new URL('../src/pages/reviews/index.astro', import.meta.url), 'utf8');

  assert.match(source, /StarRating/);
  assert.match(source, /review\.overallRating/);
  assert.match(source, /labelPrefix="Overall rating"/);
});

test('individual review pages show overall ratings with yellow star icons', async () => {
  const source = await readFile(new URL('../src/pages/reviews/[slug].astro', import.meta.url), 'utf8');

  assert.match(source, /StarRating/);
  assert.match(source, /review\.overallRating/);
  assert.match(source, /labelPrefix="Overall rating"/);
});

test('review JSON-LD is product snippet eligible with nested review rating', async () => {
  const source = await readFile(new URL('../src/pages/reviews/[slug].astro', import.meta.url), 'utf8');

  assert.match(source, /'@type': 'Product'/);
  assert.match(source, /review: reviewSchema/);
  assert.match(source, /'@type': 'Review'/);
  assert.match(source, /reviewRating:\s*\{/);
  assert.match(source, /'@type': 'Rating'/);
  assert.match(source, /ratingValue: review\.overallRating/);
  assert.match(source, /bestRating: 5/);
  assert.match(source, /worstRating: 1/);
  assert.match(source, /author:\s*\{/);
});
