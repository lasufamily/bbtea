import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_GSC_EXPORT_DIR,
  classifyGscUrl,
  formatSummary,
  inferFinalStatus,
  parseGscTableCsv,
  parseSitemapUrls,
  summarizeGscReport,
  summarizeHttpResults,
} from './daily-page-indexing-scan.mjs';

test('parseSitemapUrls extracts each loc entry in order', () => {
  const xml = `<?xml version="1.0"?>
  <urlset>
    <url><loc>https://bbtea.sg/</loc></url>
    <url><loc>https://bbtea.sg/search/</loc></url>
  </urlset>`;

  assert.deepEqual(parseSitemapUrls(xml), [
    'https://bbtea.sg/',
    'https://bbtea.sg/search/',
  ]);
});

test('summarizeHttpResults counts 200s, redirects, 404s and 5xx correctly', () => {
  const results = [
    { status: 200, canonicalMismatch: false, blocked: false },
    { status: 301, canonicalMismatch: false, blocked: false },
    { status: 404, canonicalMismatch: true, blocked: false },
    { status: 503, canonicalMismatch: false, blocked: true },
  ];

  assert.deepEqual(summarizeHttpResults(results), {
    ok200: 1,
    redirects: 1,
    notFound: 1,
    serverErrors: 1,
    canonicalMismatches: 1,
    robotsBlocked: 1,
  });
});

test('inferFinalStatus returns warning when any risk bucket is non-zero', () => {
  assert.equal(
    inferFinalStatus({
      redirects: 0,
      notFound: 0,
      serverErrors: 0,
      canonicalMismatches: 1,
      robotsBlocked: 0,
    }),
    '⚠️ Page indexing risks found',
  );
});

test('formatSummary includes the expected headline and counts', () => {
  const summary = formatSummary({
    status: '✅ No page indexing risks found',
    urlsScanned: 2,
    counts: {
      ok200: 2,
      redirects: 0,
      notFound: 0,
      serverErrors: 0,
      canonicalMismatches: 0,
      robotsBlocked: 0,
    },
    notes: ['No live issues detected.'],
  });

  assert.match(summary, /^✅ No page indexing risks found/);
  assert.match(summary, /URLs scanned: 2/);
  assert.match(summary, /canonical mismatches: 0/);
  assert.match(summary, /No live issues detected\./);
});

test('parseGscTableCsv extracts URLs from Search Console table exports', () => {
  const csv = `URL,Last crawled
https://bbtea.sg/search/?q=Halal,2026-05-17
https://bbtea.sg/drinks/matcha-series,2026-05-14`;

  assert.deepEqual(parseGscTableCsv(csv), [
    'https://bbtea.sg/search/?q=Halal',
    'https://bbtea.sg/drinks/matcha-series',
  ]);
});

test('classifyGscUrl groups recurring indexing report patterns', () => {
  assert.equal(
    classifyGscUrl('https://www.bbtea.sg/node_modules/date-fns/locale/sl/_lib/').kind,
    'internal-source-path',
  );
  assert.equal(
    classifyGscUrl('https://bbtea.sg/drinks/?category=milk-tea').kind,
    'query-variant',
  );
  assert.equal(
    classifyGscUrl('https://bbtea.sg/stations/geylang-bahru-mrt-dt24').kind,
    'missing-trailing-slash',
  );
});

test('summarizeGscReport counts classified GSC export buckets', () => {
  const summary = summarizeGscReport('Page-with-redirect', [
    'https://bbtea.sg/drinks?category=milk-tea',
    'https://bbtea.sg/drinks',
    'https://bbtea.sg/drinks/',
  ]);

  assert.equal(summary.total, 3);
  assert.deepEqual(
    summary.buckets.map((bucket) => [bucket.kind, bucket.count]),
    [
      ['query-variant', 1],
      ['missing-trailing-slash', 1],
      ['canonical-content-url', 1],
    ],
  );
});

test('DEFAULT_GSC_EXPORT_DIR points at the local Page Indexing Reports folder', () => {
  assert.match(DEFAULT_GSC_EXPORT_DIR, /Page Indexing Reports$/);
});
