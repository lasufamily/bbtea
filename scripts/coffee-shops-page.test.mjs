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
