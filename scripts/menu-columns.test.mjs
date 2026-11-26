import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const menuPages = [
  '../src/pages/menus/[brand].astro',
];

for (const pagePath of menuPages) {
  test(`${pagePath} provides accessible prices and nutrition without affiliate links`, async () => {
    const source = await readFile(new URL(pagePath, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /Shop Link|Search on Shopee|shopeeAffiliateUrl|s\.shopee\.sg/);
    for (const label of ['Calories per 100ml', 'Calories per M cup', 'Calories per L cup', 'Nutri-Grade', 'Healthier Choice Type']) {
      assert.ok(source.includes(label), `Missing ${label}`);
    }
    for (const field of ['caloriesPer100ml', 'caloriesM', 'caloriesL', 'nutriGrade', 'healthierChoiceType']) {
      assert.ok(source.includes(`drink.${field}`), `Missing ${field} value`);
    }
    assert.match(source, /drink\.healthierChoice &&/);
    assert.match(source, /alt="Healthier Choice"/);
    assert.match(source, /<table/);
    assert.match(source, /scope="col"/);
    assert.match(source, /scope="row"/);
    assert.match(source, /retailPriceParts\(drink\)\.map/);
    assert.match(source, /Report a menu correction/);
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
  assert.match(source, /Compare bubble tea and coffee menus by category and listed price/);
  assert.doesNotMatch(source, /name: 'Bubble Tea Menus in Singapore'/);
  assert.doesNotMatch(source, /<h1[\s\S]*Bubble Tea Menus<br \/>in Singapore/);
});

test('singular /menu paths redirect to canonical /menus paths', async () => {
  const redirects = await readFile(new URL('../public/_redirects', import.meta.url), 'utf8');

  assert.match(redirects, /^\/menu\s+\/menus\/\s+301$/m);
  assert.match(redirects, /^\/menu\/\s+\/menus\/\s+301$/m);
  assert.match(redirects, /^\/menu\/\*\s+\/menus\/:splat\s+301$/m);
});


test('retired shop pages return normal not-found responses rather than homepage redirects', async () => {
  const redirects = await readFile(new URL('../public/_redirects', import.meta.url), 'utf8');
  assert.doesNotMatch(redirects, /^\/shop(?:\s|\/)/m);
  await assert.rejects(access(new URL('../src/pages/shop/index.astro', import.meta.url)), { code: 'ENOENT' });
});
