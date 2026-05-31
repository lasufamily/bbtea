import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('/bubble-tea-shops page exists with the required title prefix', async () => {
  const source = await readFile(new URL('../src/pages/bubble-tea-shops/index.astro', import.meta.url), 'utf8');

  assert.match(
    source,
    /title=\{isFiltered \? `Bubble tea shops in Singapore/,
    'The /bubble-tea-shops page title should start with "Bubble tea shops in Singapore"',
  );
  assert.match(source, /canonical="https:\/\/bbtea\.sg\/bubble-tea-shops\/"/);
});

test('/bubble-tea-shops brand filters only include brands with bubble tea outlets', async () => {
  const source = await readFile(new URL('../src/pages/bubble-tea-shops/index.astro', import.meta.url), 'utf8');

  assert.match(source, /bubbleTeaBrandSlugs = new Set\(allOutlets\.map\(outlet => outlet\.brandSlug\)\.filter\(Boolean\)\)/);
  assert.match(source, /\.filter\(brand => bubbleTeaBrandSlugs\.has\(brand\.slug\)\)/);
});

test('/directory and /bubble-tea-shops use the requested filter set in order', async () => {
  const filterBar = await readFile(new URL('../src/components/FilterBar.astro', import.meta.url), 'utf8');

  const labels = [...filterBar.matchAll(/<label[^>]*>\s*([^<]+)\s*<\/label>|<span[^>]*>\s*([^<]+)\s*<\/span>/g)]
    .map(match => (match[1] ?? match[2]).trim())
    .filter(label => ['Brand', 'Town', 'Mall', 'Nearest MRT', 'Halal'].includes(label));

  assert.deepEqual(labels, ['Brand', 'Town', 'Mall', 'Nearest MRT', 'Halal']);
  assert.doesNotMatch(filterBar, /Drink Category|Price Range/);
  assert.match(filterBar, /name="mall"/);
});

test('/directory defaults to all venue outlet types', async () => {
  const source = await readFile(new URL('../src/pages/directory.astro', import.meta.url), 'utf8');

  assert.match(source, /getAllVenueOutlets/);
  assert.match(source, /let outlets: VenueOutlet\[\] = allOutlets/);
  assert.match(source, /Browse All Bubble Tea and Coffee Shops in Singapore/);
});
