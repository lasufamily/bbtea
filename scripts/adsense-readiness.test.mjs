import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = p => readFile(new URL(`../${p}`, import.meta.url), 'utf8');

test('ordinary browsing loads the BBTea GTM container without the other site container', async () => {
  const layout = await read('src/components/Layout.astro');
  assert.match(layout, /<script is:inline async src="https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=GTM-PR9B796P"><\/script>/);
  assert.doesNotMatch(layout, /GTM-PLZ33XC8|fbevents/);
  const newsletter = await read('src/pages/newsletter.astro');
  assert.doesNotMatch(newsletter, /attribution\.js/);
});

test('retired shop URLs are not redirected to unrelated content', async () => {
  assert.doesNotMatch(await read('public/_redirects'), /^\/shop(?:\s|\/)/m);
});

test('directory context is editorially useful and does not expose internal tables', async () => {
  const town = await read('src/pages/towns/[slug].astro');
  assert.doesNotMatch(town, /your Airtable|from your|town\.description|town\.population/);
  assert.match(town, /Check before visiting/);
  assert.match(await read('src/pages/about.astro'), /editorial-standards/);
});

test('third-party forms load only after a visitor chooses to open them', async () => {
  const component = await read('src/components/ExternalForm.astro');
  assert.match(component, /addEventListener\('click'/);
  assert.doesNotMatch(component, /inherit.parameters|attribution\.js/);
});

test('unsupported nutrition sentences cannot leak into cards or metadata', async () => {
  const { cleanDrinkDescription } = await import('../src/lib/editorial.ts');
  assert.equal(cleanDrinkDescription('Jasmine milk tea. A Medium cup is about 120 kcal (Nutri-Grade B). Calories vary with toppings.'), 'Jasmine milk tea.');
  assert.equal(cleanDrinkDescription('Freshly brewed black tea.'), 'Freshly brewed black tea.');
  assert.equal(cleanDrinkDescription(undefined), undefined);
  assert.equal(cleanDrinkDescription('A Healthier Choice drink.'), undefined);
});

test('missing town records cannot generate malformed location links', async () => {
  for (const file of ['src/components/ListingCard.astro', 'src/pages/coffee-shops/[slug].astro']) {
    const source = await read(file);
    assert.doesNotMatch(source, /href=\{`\/towns\/\$\{outlet\.townSlug\}\/`\}/);
  }
});

test('unsourced health answers stay unpublished while ordinary FAQs remain available', async () => {
  const { mapFaqRecord } = await import('../src/lib/airtable.ts');
  const record = question => ({id:'record',createdTime:'2026-11-24',fields:{Question:question,Answer:'Unreviewed answer',Slug:'sample'}});
  assert.equal(mapFaqRecord(record('What bubble tea is safe for pregnancy?')), undefined);
  assert.equal(mapFaqRecord(record('Does coffee raise blood pressure?')), undefined);
  assert.ok(mapFaqRecord(record('What is bubble tea?')));
});

test('category pages do not offer a negative halal filter', async () => {
  for (const file of ['src/pages/bubble-tea-shops/index.astro', 'src/pages/coffee-shops/index.astro', 'src/pages/juice-shops/index.astro']) {
    const source = await read(file);
    assert.doesNotMatch(source, /name="halal"|filters\.halal|searchParams.get\('halal'\)/);
  }
});
