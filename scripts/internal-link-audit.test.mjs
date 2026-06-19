import test from 'node:test';
import assert from 'node:assert/strict';

import {
  classifyPageType,
  extractInternalLinks,
  normalizeInternalPath,
  summarizeLinkGraph,
} from './internal-link-audit.mjs';

test('normalizeInternalPath preserves canonical unicode slugs and trailing slashes', () => {
  assert.equal(
    normalizeInternalPath('/drinks/caf%C3%A9-latte/'),
    '/drinks/café-latte/',
  );
  assert.equal(
    normalizeInternalPath('https://bbtea.sg/drinks/caf%C3%A9-latte'),
    '/drinks/café-latte/',
  );
  assert.equal(normalizeInternalPath('/directory'), '/directory/');
});

test('normalizeInternalPath ignores external and non-crawlable links', () => {
  assert.equal(normalizeInternalPath('https://example.com/drinks/'), null);
  assert.equal(normalizeInternalPath('mailto:hello@bbtea.sg'), null);
  assert.equal(normalizeInternalPath('tel:+6512345678'), null);
  assert.equal(normalizeInternalPath('#main'), null);
  assert.equal(normalizeInternalPath('/search/?q=halal'), '/search/');
});

test('extractInternalLinks separates chrome links from content links', () => {
  const html = `
    <header><a href="/directory/">Directory</a></header>
    <main>
      <a href="/brands/liho/">LiHO</a>
      <a href="https://bbtea.sg/drinks/caf%C3%A9-latte/">Cafe latte</a>
      <a href="https://example.com/">External</a>
    </main>
    <footer><a href="/about/">About</a></footer>
  `;

  const links = extractInternalLinks(html);

  assert.deepEqual(links.chrome, ['/directory/', '/about/']);
  assert.deepEqual(links.content, ['/brands/liho/', '/drinks/café-latte/']);
});

test('extractInternalLinks ignores script template strings', () => {
  const html = `
    <main><a href="/directory/">Directory</a></main>
    <script>
      const template = '<a href="$' + '{url}">Result</a>';
    </script>
  `;

  assert.deepEqual(extractInternalLinks(html), {
    content: ['/directory/'],
    chrome: [],
  });
});

test('summarizeLinkGraph reports broken links and weak content inlinks', () => {
  const pages = new Map([
    ['/', { html: '<main><a href="/reviews/milk-tea/">Review</a><a href="/missing/">Missing</a></main>' }],
    ['/reviews/milk-tea/', { html: '<main><a href="/brands/liho/">LiHO</a></main>' }],
    ['/brands/liho/', { html: '<footer><a href="/reviews/milk-tea/">Review</a></footer>' }],
  ]);

  const summary = summarizeLinkGraph(pages, { weakContentInlinkThreshold: 2 });

  assert.deepEqual(summary.brokenLinks, [{ from: '/', to: '/missing/' }]);
  assert.deepEqual(
    summary.weakPages
      .map(page => [page.url, page.contentInlinks])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    [
      ['/brands/liho/', 1],
      ['/reviews/milk-tea/', 1],
    ],
  );
});

test('classifyPageType groups URLs by first path segment', () => {
  assert.equal(classifyPageType('/'), 'home');
  assert.equal(classifyPageType('/drinks/café-latte/'), 'drinks');
  assert.equal(classifyPageType('/about/'), 'core');
});
