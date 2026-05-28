import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const menuPages = [
  '../src/pages/menus/[brand].astro',
];

for (const pagePath of menuPages) {
  test(`${pagePath} exposes split menu data columns`, async () => {
    const source = await readFile(new URL(pagePath, import.meta.url), 'utf8');

    assert.match(source, />Retail Price</);
    assert.match(source, />Calories per 100ml</);
    assert.match(source, />Calories per M cup</);
    assert.match(source, />Calories per L cup</);
    assert.match(source, />Nutri-Grade</);
    assert.match(source, />Healthier Choice</);
    assert.match(source, />Healthier Choice Type</);
    assert.doesNotMatch(source, />Price</);
    assert.doesNotMatch(source, />Calories</);
    assert.doesNotMatch(source, />Grade</);
  });
}

test('menu routes use the canonical /menus structure only', async () => {
  const singularRoute = new URL('../src/pages/menu/[brand].astro', import.meta.url);
  await assert.rejects(access(singularRoute), {
    code: 'ENOENT',
  });

  const files = [
    '../src/pages/menus/index.astro',
    '../src/pages/brands/[slug].astro',
    '../src/pages/bubble-tea-shops/[slug].astro',
  ];

  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /\/menu\//);
  }
});
