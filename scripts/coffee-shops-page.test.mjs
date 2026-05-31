import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('/coffee-shops page exists with the required title prefix', async () => {
  const source = await readFile(new URL('../src/pages/coffee-shops/index.astro', import.meta.url), 'utf8');

  assert.match(
    source,
    /title=\{isFiltered \? `Coffee shops in Singapore/,
    'The /coffee-shops page title should start with "Coffee shops in Singapore"',
  );
  assert.match(source, /canonical="https:\/\/bbtea\.sg\/coffee-shops\/"/);
});

test('/coffee-shops uses the requested filter set in order', async () => {
  const source = await readFile(new URL('../src/pages/coffee-shops/index.astro', import.meta.url), 'utf8');

  const desktopForm = source.match(/<form id=\{ids\.desktop\.form\}[\s\S]*?<\/form>/)?.[0] ?? '';
  const labels = [...desktopForm.matchAll(/<label[^>]*>\s*([^<]+)\s*<\/label>|<span[^>]*>\s*([^<]+)\s*<\/span>/g)]
    .map(match => (match[1] ?? match[2]).trim())
    .filter(label => ['Brand', 'Town', 'Mall', 'Nearest MRT', 'Halal'].includes(label));

  assert.deepEqual(labels, ['Brand', 'Town', 'Mall', 'Nearest MRT', 'Halal']);
  assert.doesNotMatch(source, /Coffee Type|Price Range/);
  assert.match(source, /name="mall"/);
  assert.match(source, /name="halal"/);
});
