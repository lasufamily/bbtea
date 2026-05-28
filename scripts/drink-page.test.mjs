import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('drink detail pages show split cup calories and title-side Healthier Choice logo', async () => {
  const source = await readFile(new URL('../src/pages/drinks/[slug].astro', import.meta.url), 'utf8');

  assert.match(source, /label:\s*'Calories per M cup'/);
  assert.match(source, /label:\s*'Calories per L cup'/);
  assert.match(source, /drink\.healthierChoice &&/);
  assert.match(source, /healthier-choice-symbol\.jpg/);
  assert.match(source, /alt="Healthier Choice"/);
});
