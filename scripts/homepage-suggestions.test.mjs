import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('homepage suggestions do not include removed Tiger Sugar brand', async () => {
  const source = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /Tiger Sugar/);
});
