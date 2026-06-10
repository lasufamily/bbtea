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
    assert.match(source, />Healthier Choice Type</);
    assert.match(source, /<span>Calories<\/span>\s*<span class="block">per 100ml<\/span>/);
    assert.match(source, /<span>Calories<\/span>\s*<span class="block">per M cup<\/span>/);
    assert.match(source, /<span>Calories<\/span>\s*<span class="block">per L cup<\/span>/);
    assert.match(source, /retailPriceParts\(drink\)\.map/);
    assert.match(source, /drink\.healthierChoice &&/);
    assert.match(source, /healthier-choice-symbol\.jpg/);
    assert.doesNotMatch(source, /overflow-x-auto/);
    assert.doesNotMatch(source, /min-w-\[/);
    assert.doesNotMatch(source, /healthierChoiceText/);
    assert.doesNotMatch(source, /prices\.join/);
    assert.doesNotMatch(source, /<span>Price<\/span>/);
    assert.doesNotMatch(source, /<span><span>Healthier<\/span><span class="block">Choice<\/span><\/span>/);
    assert.doesNotMatch(source, />Healthier Choice<\/span>/);
    assert.doesNotMatch(source, /healthier-choice-symbol\.svg/);
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

test('/menus hub presents bubble tea and coffee menus', async () => {
  const source = await readFile(new URL('../src/pages/menus/index.astro', import.meta.url), 'utf8');

  assert.match(source, /Bubble Tea and Coffee Menus in Singapore/);
  assert.match(source, /Compare bubble tea and coffee menus by category, price, and calories/);
  assert.doesNotMatch(source, /name: 'Bubble Tea Menus in Singapore'/);
  assert.doesNotMatch(source, /<h1[\s\S]*Bubble Tea Menus<br \/>in Singapore/);
});

test('singular /menu paths redirect to canonical /menus paths', async () => {
  const redirects = await readFile(new URL('../public/_redirects', import.meta.url), 'utf8');

  assert.match(redirects, /^\/menu\s+\/menus\/\s+301$/m);
  assert.match(redirects, /^\/menu\/\s+\/menus\/\s+301$/m);
  assert.match(redirects, /^\/menu\/\*\s+\/menus\/:splat\s+301$/m);
});
