import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('FAQ pages are generated from Airtable records', async () => {
  const airtableSource = await readFile(new URL('../src/lib/airtable.ts', import.meta.url), 'utf8');
  const typesSource = await readFile(new URL('../src/lib/types.ts', import.meta.url), 'utf8');
  const hubSource = await readFile(new URL('../src/pages/faq.astro', import.meta.url), 'utf8');
  const detailSource = await readFile(new URL('../src/pages/faq/[slug].astro', import.meta.url), 'utf8');

  assert.match(typesSource, /export interface Faq\s*{/);
  assert.match(typesSource, /export interface AirtableFaqFields\s*{/);
  assert.match(airtableSource, /export function getFaqs\(\): Promise<Faq\[]>/);
  assert.match(airtableSource, /fetchTable<AirtableFaqFields>\('FAQ'/);
  assert.match(airtableSource, /mapFaqRecord/);

  assert.match(hubSource, /const faqs = await getFaqs\(\);/);
  assert.match(hubSource, /href=\{`\/faq\/\$\{pathSegment\(faq\.slug\)\}\/`\}/);
  assert.doesNotMatch(hubSource, /answer: 'What is BBTea\.sg\?'/);
  assert.doesNotMatch(hubSource, /faq\.answer/);

  assert.match(detailSource, /export async function getStaticPaths\(\)/);
  assert.match(detailSource, /const faqs = await getFaqs\(\);/);
  assert.match(detailSource, /<h1[^>]*>\s*\{faq\.question\}\s*<\/h1>/);
  assert.match(detailSource, /\{faq\.answer\}/);
});
