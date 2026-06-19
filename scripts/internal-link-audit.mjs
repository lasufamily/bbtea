#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://bbtea.sg';
const CORE_PATHS = new Set([
  '/about/',
  '/advertise/',
  '/contact/',
  '/directory/',
  '/faq/',
  '/halal/',
  '/newsletter/',
  '/privacy/',
  '/search/',
  '/submit-a-review/',
  '/terms/',
]);
const PRIORITY_TYPES = new Set([
  'brands',
  'bubble-tea-shops',
  'coffee-shops',
  'drinks',
  'faq',
  'juice-shops',
  'malls',
  'menus',
  'reviews',
  'stations',
  'towns',
]);

function getChromeRanges(html) {
  const ranges = [];

  for (const match of html.matchAll(/<(header|footer)\b[\s\S]*?<\/\1>/gi)) {
    ranges.push({
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
    });
  }

  return ranges;
}

function getIgnoredRanges(html) {
  const ranges = [];

  for (const match of html.matchAll(/<(script|style)\b[\s\S]*?<\/\1>/gi)) {
    ranges.push({
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
    });
  }

  return ranges;
}

function isInRange(index, ranges) {
  return ranges.some(range => index >= range.start && index <= range.end);
}

function decodePathname(pathname) {
  try {
    return decodeURI(pathname);
  } catch {
    return pathname;
  }
}

export function normalizeInternalPath(rawHref, base = SITE) {
  if (!rawHref) return null;
  const href = rawHref.trim();
  if (
    !href ||
    href.startsWith('#') ||
    /^(?:mailto|tel|javascript):/i.test(href)
  ) {
    return null;
  }

  let url;
  try {
    url = new URL(href, base);
  } catch {
    return null;
  }

  if (url.hostname !== 'bbtea.sg') return null;

  let pathname = decodePathname(url.pathname);
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  if (!pathname.endsWith('/') && !path.extname(pathname)) pathname = `${pathname}/`;
  return pathname;
}

export function extractInternalLinks(html) {
  const content = [];
  const chrome = [];
  const chromeRanges = getChromeRanges(html);
  const ignoredRanges = getIgnoredRanges(html);

  for (const match of html.matchAll(/<a\s+[^>]*href=(["'])(.*?)\1/gis)) {
    if (isInRange(match.index ?? 0, ignoredRanges)) continue;

    const normalized = normalizeInternalPath(match[2]);
    if (!normalized) continue;

    if (isInRange(match.index ?? 0, chromeRanges)) chrome.push(normalized);
    else content.push(normalized);
  }

  return { content, chrome };
}

export function classifyPageType(url) {
  if (url === '/') return 'home';
  if (CORE_PATHS.has(url)) return 'core';
  return url.match(/^\/([^/]+)\//)?.[1] ?? 'core';
}

export function summarizeLinkGraph(pages, options = {}) {
  const weakContentInlinkThreshold = options.weakContentInlinkThreshold ?? 2;
  const existing = new Set(pages.keys());
  const inbound = new Map([...existing].map(url => [url, new Set()]));
  const contentInbound = new Map([...existing].map(url => [url, new Set()]));
  const outbound = new Map();
  const brokenLinks = [];
  const brokenLinkKeys = new Set();

  for (const [from, page] of pages) {
    const links = extractInternalLinks(page.html);
    const allLinks = [...links.content, ...links.chrome];
    outbound.set(from, allLinks);

    for (const to of allLinks) {
      if (existing.has(to)) inbound.get(to).add(from);
      else {
        const key = `${from}\u0000${to}`;
        if (!brokenLinkKeys.has(key)) {
          brokenLinks.push({ from, to });
          brokenLinkKeys.add(key);
        }
      }
    }

    for (const to of links.content) {
      if (existing.has(to)) contentInbound.get(to).add(from);
    }
  }

  const pagesSummary = [...existing].map(url => ({
    url,
    type: classifyPageType(url),
    inlinks: inbound.get(url).size,
    contentInlinks: contentInbound.get(url).size,
    outlinks: outbound.get(url)?.length ?? 0,
  }));

  const byType = [...pagesSummary]
    .reduce((map, page) => {
      const current = map.get(page.type) ?? {
        type: page.type,
        count: 0,
        totalInlinks: 0,
        totalContentInlinks: 0,
        weakPages: 0,
      };
      current.count += 1;
      current.totalInlinks += page.inlinks;
      current.totalContentInlinks += page.contentInlinks;
      if (PRIORITY_TYPES.has(page.type) && page.contentInlinks < weakContentInlinkThreshold) {
        current.weakPages += 1;
      }
      map.set(page.type, current);
      return map;
    }, new Map());

  const weakPages = pagesSummary
    .filter(page =>
      PRIORITY_TYPES.has(page.type) &&
      page.contentInlinks < weakContentInlinkThreshold &&
      page.url.split('/').filter(Boolean).length > 1
    )
    .sort((a, b) =>
      a.contentInlinks - b.contentInlinks ||
      a.type.localeCompare(b.type) ||
      a.url.localeCompare(b.url)
    );

  return {
    pageCount: existing.size,
    brokenLinks: brokenLinks.sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to)),
    weakPages,
    byType: [...byType.values()]
      .map(item => ({
        ...item,
        averageInlinks: item.count ? item.totalInlinks / item.count : 0,
        averageContentInlinks: item.count ? item.totalContentInlinks / item.count : 0,
      }))
      .sort((a, b) => a.type.localeCompare(b.type)),
  };
}

function distPathToUrl(file) {
  const relative = file.slice(DIST.length).replace(/\\/g, '/');
  if (relative === '/index.html') return '/';
  if (relative.endsWith('/index.html')) return relative.slice(0, -'index.html'.length);
  return relative;
}

async function findBuiltPages(dir = DIST) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await findBuiltPages(file));
    else if (entry.name === 'index.html' || entry.name === '404.html') files.push(file);
  }

  return files;
}

async function readBuiltPages() {
  const files = await findBuiltPages();
  const pages = new Map();

  for (const file of files) {
    pages.set(distPathToUrl(file), { html: await fs.readFile(file, 'utf8') });
  }

  return pages;
}

function formatSummary(summary, { maxExamples = 25 } = {}) {
  const lines = [
    'Internal link audit',
    `Pages scanned: ${summary.pageCount}`,
    `Broken internal links: ${summary.brokenLinks.length}`,
    `Weak priority pages: ${summary.weakPages.length}`,
    '',
    'Page type summary:',
  ];

  for (const type of summary.byType) {
    lines.push(
      `- ${type.type}: ${type.count} pages, avg content inlinks ${type.averageContentInlinks.toFixed(1)}, weak ${type.weakPages}`,
    );
  }

  lines.push('', 'Broken internal links:');
  if (summary.brokenLinks.length === 0) lines.push('- None.');
  else {
    for (const link of summary.brokenLinks.slice(0, maxExamples)) {
      lines.push(`- ${link.from} -> ${link.to}`);
    }
    if (summary.brokenLinks.length > maxExamples) {
      lines.push(`- ... ${summary.brokenLinks.length - maxExamples} more`);
    }
  }

  lines.push('', 'Weak priority pages:');
  if (summary.weakPages.length === 0) lines.push('- None.');
  else {
    for (const page of summary.weakPages.slice(0, maxExamples)) {
      lines.push(`- ${page.url} (${page.contentInlinks} content inlinks, ${page.inlinks} total)`);
    }
    if (summary.weakPages.length > maxExamples) {
      lines.push(`- ... ${summary.weakPages.length - maxExamples} more`);
    }
  }

  return lines.join('\n');
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const failOnError = args.has('--fail-on-error');
  const maxExamples = Number([...args].find(arg => arg.startsWith('--max-examples='))?.split('=')[1] ?? 25);

  const pages = await readBuiltPages();
  const summary = summarizeLinkGraph(pages);
  console.log(formatSummary(summary, { maxExamples }));

  if (failOnError && summary.brokenLinks.length > 0) {
    process.exitCode = 1;
  }
}

const shouldRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (shouldRun) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
