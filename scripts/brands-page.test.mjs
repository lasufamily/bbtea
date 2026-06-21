import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const { mapBrandRecord } = await import('../src/lib/airtable.ts');

const brand = mapBrandRecord({
  id: 'brand_chagee',
  createdTime: '2026-06-21T00:00:00.000Z',
  fields: {
    'Brand Name': 'Chagee',
    Slug: 'chagee',
    Category: 'Bubble Tea',
  },
});

assert.equal(
  brand?.category,
  'Bubble Tea',
  'Brands should expose the Airtable Category field for category-based discovery',
);

const brandsPage = await readFile(new URL('../src/pages/brands/index.astro', import.meta.url), 'utf8');

assert.match(
  brandsPage,
  /brandsByCategory/,
  'The brands hub should group brands by their Airtable Category field',
);

assert.match(
  brandsPage,
  /brand\.category \?\? 'More brands'/,
  'Brands without a Category should be collected in a fallback category',
);
