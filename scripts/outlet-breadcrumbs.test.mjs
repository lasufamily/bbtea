import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const outletPages = [
  '../src/pages/bubble-tea-shops/[slug].astro',
  '../src/pages/coffee-shops/[slug].astro',
];

for (const pagePath of outletPages) {
  test(`${pagePath} places breadcrumbs below the hero image`, async () => {
    const source = await readFile(new URL(pagePath, import.meta.url), 'utf8');

    assert.doesNotMatch(source, /Breadcrumb overlaid on image/);
    assert.doesNotMatch(source, /absolute top-6 left-4/);
    assert.match(source, /<!-- Breadcrumb below hero image -->/);
    assert.match(source, /<article class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">[\s\S]*?<nav class="mb-8 flex flex-wrap items-center gap-1\.5 text-sm text-\[var\(--color-stone-400\)\]"/);
  });
}
