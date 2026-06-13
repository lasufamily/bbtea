import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('/juice-shops listing and detail pages use the requested route', async () => {
  const indexSource = await readFile(new URL('../src/pages/juice-shops/index.astro', import.meta.url), 'utf8');
  const detailSource = await readFile(new URL('../src/pages/juice-shops/[slug].astro', import.meta.url), 'utf8');

  assert.match(indexSource, /canonical="https:\/\/bbtea\.sg\/juice-shops\/"/);
  assert.match(indexSource, /getJuiceOutlets/);
  assert.match(detailSource, /getJuiceOutlets/);
  assert.match(detailSource, /canonical=\{`https:\/\/bbtea\.sg\$\{outlet\.path\}`\}/);
});
