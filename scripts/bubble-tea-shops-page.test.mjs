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
