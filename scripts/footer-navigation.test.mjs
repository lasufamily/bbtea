import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('footer navigation uses the requested column names and links', async () => {
  const source = await readFile(new URL('../src/components/Footer.astro', import.meta.url), 'utf8');

  assert.match(source, /'Directories': \[/);
  assert.match(source, /href: '\/directory\/',\s+label: 'All Shops'/);
  assert.match(source, /href: '\/bubble-tea-shops\/',\s+label: 'Bubble Tea Shops'/);
  assert.match(source, /href: '\/coffee-shops\/',\s+label: 'Coffee Shops'/);
  assert.match(source, /href: '\/juice-shops\/',\s+label: 'Juice Shops'/);
  assert.match(source, /href: '\/towns\/',\s+label: 'Singapore Towns'/);
  assert.match(source, /href: '\/brands\/',\s+label: 'Brands'/);
  assert.match(source, /href: '\/stations\/',\s+label: 'MRT Stations'/);
  assert.match(source, /href: '\/malls\/',\s+label: 'Malls'/);
  assert.match(source, /href: '\/halal\/',\s+label: 'Halal'/);
  assert.match(source, /href: '\/halal\/',\s+label: 'Halal'\s+},\s+\{\s+href: '\/drinks\/',\s+label: 'Drinks'/);

  assert.match(source, /'Resources': \[/);
  assert.match(source, /href: '\/reviews\/',\s+label: 'Reviews'/);
  assert.match(source, /href: '\/menus\/',\s+label: 'Menus'/);
  assert.match(source, /href: '\/faq\/',\s+label: 'FAQ'/);
  assert.match(source, /href: '\/blog\/',\s+label: 'Blog'/);

  assert.doesNotMatch(source, /'Browse'|'Popular Towns'|'Drink Categories'/);
});

test('footer popular brands are derived from listed outlet counts', async () => {
  const source = await readFile(new URL('../src/components/Footer.astro', import.meta.url), 'utf8');

  assert.match(source, /getCoffeeOutlets/);
  assert.match(source, /getJuiceOutlets/);
  assert.match(source, /brandCounts/);
  assert.match(source, /\.sort\(\(a, b\) => b\.count - a\.count \|\| a\.label\.localeCompare\(b\.label\)\)/);
  assert.match(source, /\.slice\(0, 10\)/);
  assert.match(source, /'Popular Brands': popularBrandLinks/);
});

test('footer FAQ resource has a destination page', async () => {
  const source = await readFile(new URL('../src/pages/faq.astro', import.meta.url), 'utf8');

  assert.match(source, /FAQ \| BBTea\.sg/);
  assert.match(source, /Frequently Asked Questions/);
  assert.match(source, /https:\/\/bbtea\.sg\/faq\//);
});
