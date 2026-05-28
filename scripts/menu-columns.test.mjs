import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const menuPages = [
  '../src/pages/menu/[brand].astro',
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
