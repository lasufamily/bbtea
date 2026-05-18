#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DIST_BACKUP = path.join(ROOT, '.tmp-indexing-scan-dist');
const SITE = 'https://bbtea.sg';
const DEFAULT_GSC_EXPORT_DIR = path.resolve(ROOT, '..', '..', 'BBTea Admin', 'Page Indeximg Reports');
const INTERNAL_BLOCKED_PATHS = [
  /^\/node_modules(?:\/|$)/,
  /^\/\.git(?:\/|$)/,
  /^\/\.astro(?:\/|$)/,
  /^\/src(?:\/|$)/,
  /^\/app(?:\/|$)/,
  /^\/components(?:\/|$)/,
  /^\/prisma(?:\/|$)/,
  /^\/lib(?:\/|$)/,
  /^\/public(?:\/|$)/,
  /^\/(?:package(?:-lock)?\.json|tsconfig\.json|astro\.config\.mjs)$/,
];

export function parseSitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

export function summarizeHttpResults(results) {
  return results.reduce(
    (summary, result) => {
      if (result.status >= 200 && result.status < 300) summary.ok200 += 1;
      if (result.status >= 300 && result.status < 400) summary.redirects += 1;
      if (result.status === 404) summary.notFound += 1;
      if (result.status >= 500) summary.serverErrors += 1;
      if (result.canonicalMismatch) summary.canonicalMismatches += 1;
      if (result.blocked) summary.robotsBlocked += 1;
      return summary;
    },
    {
      ok200: 0,
      redirects: 0,
      notFound: 0,
      serverErrors: 0,
      canonicalMismatches: 0,
      robotsBlocked: 0,
    },
  );
}

export function inferFinalStatus(counts) {
  const hasRisk =
    counts.redirects > 0 ||
    counts.notFound > 0 ||
    counts.serverErrors > 0 ||
    counts.canonicalMismatches > 0 ||
    counts.robotsBlocked > 0;
  return hasRisk ? '⚠️ Page indexing risks found' : '✅ No page indexing risks found';
}

export function formatSummary({ status, urlsScanned, counts, notes }) {
  return [
    status,
    `URLs scanned: ${urlsScanned}`,
    `200 OK pages: ${counts.ok200}`,
    `redirects found: ${counts.redirects}`,
    `404s found: ${counts.notFound}`,
    `5xx errors found: ${counts.serverErrors}`,
    `canonical mismatches: ${counts.canonicalMismatches}`,
    `noindex/robots blocks: ${counts.robotsBlocked}`,
    '',
    'Notes:',
    ...(notes.length ? notes.map((note) => `- ${note}`) : ['- None.']),
  ].join('\n');
}

export function parseGscTableCsv(csv) {
  return csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => {
      const comma = line.indexOf(',');
      return comma === -1 ? line.trim() : line.slice(0, comma).trim();
    })
    .filter(Boolean);
}

function reportNameFromFile(file) {
  return path
    .basename(file, '.zip')
    .replace(/^bbtea\.sg-/, '')
    .replace(/-\d{4}-\d{2}-\d{2}$/, '');
}

export function classifyGscUrl(rawUrl) {
  const url = new URL(rawUrl);
  const pathname = url.pathname;

  if (INTERNAL_BLOCKED_PATHS.some((pattern) => pattern.test(pathname))) {
    return {
      kind: 'internal-source-path',
      likelyFix: 'keep blocked in robots, _redirects, and X-Robots-Tag; verify deployment root is the built dist folder',
    };
  }

  if (pathname === '/cdn-cgi/l/email-protection') {
    return {
      kind: 'cloudflare-email-protection',
      likelyFix: 'serve a hard 404 and avoid exposing Cloudflare email-protection links',
    };
  }

  if (pathname === '/blog' || pathname === '/blog/') {
    return {
      kind: 'stale-blog-url',
      likelyFix: 'redirect to the closest live hub until a real blog exists',
    };
  }

  if (url.search) {
    return {
      kind: 'query-variant',
      likelyFix: 'keep canonical pointed at the clean parent URL and avoid placing query variants in the sitemap',
    };
  }

  if (!pathname.endsWith('/') && !path.extname(pathname)) {
    return {
      kind: 'missing-trailing-slash',
      likelyFix: 'redirect to the trailing-slash canonical and fix any internal links/referrers that omit it',
    };
  }

  if (url.hostname !== 'bbtea.sg' || url.protocol !== 'https:') {
    return {
      kind: 'non-canonical-host-or-protocol',
      likelyFix: 'redirect to https://bbtea.sg before indexing signals are evaluated',
    };
  }

  return {
    kind: 'canonical-content-url',
    likelyFix: 'review content quality, internal links, and sitemap discovery signals for this live canonical page',
  };
}

export function summarizeGscReport(reportName, urls) {
  const byKind = new Map();
  for (const url of urls) {
    const classification = classifyGscUrl(url);
    const current = byKind.get(classification.kind) || {
      count: 0,
      likelyFix: classification.likelyFix,
      examples: [],
    };
    current.count += 1;
    if (current.examples.length < 3) current.examples.push(url);
    byKind.set(classification.kind, current);
  }

  return {
    reportName,
    total: urls.length,
    buckets: [...byKind.entries()].map(([kind, detail]) => ({ kind, ...detail })),
  };
}

function repoPath(...parts) {
  return path.join(ROOT, ...parts);
}

async function runCommand(command, args, options = {}) {
  const { quiet = false, ...spawnOptions } = options;
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      env: process.env,
      stdio: ['ignore', quiet ? 'ignore' : 'pipe', quiet ? 'ignore' : 'pipe'],
      ...spawnOptions,
    });
    let stdout = '';
    let stderr = '';
    if (!quiet) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
    }
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
        return;
      }
      const error = new Error(`${command} ${args.join(' ')} failed with exit code ${code}`);
      error.stdout = stdout;
      error.stderr = stderr;
      error.code = code;
      reject(error);
    });
  });
}

async function safeRun(command, args, options = {}) {
  try {
    return await runCommand(command, args, options);
  } catch (error) {
    return {
      error: error.message,
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      code: error.code || 1,
    };
  }
}

function getArgValue(args, name, fallback = null) {
  const prefix = `${name}=`;
  const inline = [...args].find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const list = [...args];
  const index = list.indexOf(name);
  return index === -1 ? fallback : list[index + 1] || fallback;
}

function urlToDistPath(url) {
  const pathname = new URL(url).pathname;
  if (pathname === '/') return repoPath('dist', 'index.html');
  if (pathname.endsWith('/')) return repoPath('dist', pathname.slice(1), 'index.html');
  return repoPath('dist', pathname.slice(1));
}

async function readBuiltPage(url) {
  const file = urlToDistPath(url);
  const html = await fs.readFile(file, 'utf8');
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1] || null;
  const robots = html.match(/<meta[^>]+name="robots"[^>]+content="([^"]+)"/i)?.[1] || '';
  return { file, html, canonical, robots };
}

async function fetchLiveHead(url) {
  const response = await fetch(url, {
    method: 'HEAD',
    redirect: 'follow',
    headers: { 'user-agent': 'bbtea-daily-page-indexing-scan/1.0' },
  });
  return {
    url,
    finalUrl: response.url,
    status: response.status,
  };
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(items[current], current);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function scanSitemapUrls(urls, { withLive = false } = {}) {
  return mapLimit(urls, 12, async (url) => {
    let live = { status: 200, finalUrl: url, error: null };
    if (withLive) {
      try {
        live = await fetchLiveHead(url);
      } catch (error) {
        live = { status: 0, finalUrl: url, error: error.message };
      }
    }

    let page = { canonical: null, robots: '', file: null, html: '' };
    let artifactError = null;
    try {
      page = await readBuiltPage(url);
    } catch (error) {
      artifactError = error.message;
    }

    const canonicalMismatch = page.canonical ? page.canonical !== live.finalUrl : false;
    const blocked = /noindex|nofollow/i.test(page.robots);

    return {
      url,
      finalUrl: live.finalUrl,
      status: live.status,
      canonical: page.canonical,
      canonicalMismatch,
      blocked,
      robots: page.robots,
      liveError: live.error,
      artifactError,
      file: page.file,
    };
  });
}

function findIssues(results) {
  const issues = [];
  for (const result of results) {
    if (result.status >= 300 && result.status < 400) {
      issues.push(`${result.url} -> redirects live; fix sitemap or redirect target`);
    }
    if (result.status === 404) {
      issues.push(`${result.url} -> returns 404 live; restore page or remove from sitemap`);
    }
    if (result.status >= 500) {
      issues.push(`${result.url} -> returns ${result.status} live; investigate origin/server error`);
    }
    if (result.liveError) {
      issues.push(`${result.url} -> live check failed (${result.liveError})`);
    }
    if (result.canonicalMismatch) {
      issues.push(`${result.url} -> canonical points to ${result.canonical}; normalize slug/canonical`);
    }
    if (result.blocked) {
      issues.push(`${result.url} -> page is noindex/nofollow; remove from sitemap or make indexable`);
    }
    if (result.artifactError) {
      issues.push(`${result.url} -> missing built artifact (${result.artifactError})`);
    }
  }
  return issues;
}

async function readSitemap() {
  const xml = await fs.readFile(repoPath('dist', 'sitemap-0.xml'), 'utf8');
  const urls = parseSitemapUrls(xml).filter((url) => !url.endsWith('/sitemap-0.xml'));
  return { xml, urls };
}

async function distExists() {
  try {
    await fs.access(repoPath('dist', 'sitemap-0.xml'));
    return true;
  } catch {
    return false;
  }
}

async function backupDist() {
  await fs.rm(DIST_BACKUP, { recursive: true, force: true });
  if (!(await distExists())) return false;
  await fs.cp(DIST, DIST_BACKUP, { recursive: true });
  return true;
}

async function restoreDistBackup() {
  try {
    await fs.access(path.join(DIST_BACKUP, 'sitemap-0.xml'));
  } catch {
    return false;
  }
  await fs.rm(DIST, { recursive: true, force: true });
  await fs.cp(DIST_BACKUP, DIST, { recursive: true });
  return true;
}

async function cleanupDistBackup() {
  await fs.rm(DIST_BACKUP, { recursive: true, force: true });
}

async function checkProductionSitemap() {
  return safeRun('curl', ['-I', '-L', '--max-redirs', '5', '--connect-timeout', '10', `${SITE}/sitemap-index.xml`]);
}

async function runGsc() {
  return safeRun('node', ['scripts/gsc-performance.mjs']);
}

async function readGscExportReports(exportDir) {
  let files = [];
  try {
    files = (await fs.readdir(exportDir))
      .filter((file) => file.endsWith('.zip') && file.includes('bbtea.sg-'))
      .map((file) => path.join(exportDir, file))
      .sort();
  } catch {
    return [];
  }

  const reports = [];
  for (const file of files) {
    const csv = await safeRun('unzip', ['-p', file, 'Table.csv']);
    if (csv.error) {
      reports.push({
        reportName: reportNameFromFile(file),
        total: 0,
        buckets: [
          {
            kind: 'unreadable-export',
            count: 1,
            likelyFix: `could not read ${file}: ${csv.error}`,
            examples: [],
          },
        ],
      });
      continue;
    }
    reports.push(summarizeGscReport(reportNameFromFile(file), parseGscTableCsv(csv.stdout)));
  }
  return reports;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const skipPull = args.has('--skip-pull');
  const skipBuild = args.has('--skip-build');
  const withLive = args.has('--with-live');
  const withGsc = args.has('--with-gsc');
  const skipGscExports = args.has('--skip-gsc-exports');
  const gscExportDir = getArgValue(args, '--gsc-export-dir', DEFAULT_GSC_EXPORT_DIR);

  const notes = [];

  if (!skipPull) {
    const pull = await safeRun('git', ['pull', '--ff-only', 'origin', 'main']);
    if (pull.error) notes.push(`git pull skipped/failed: ${pull.error}`);
    else notes.push('git pull --ff-only origin main succeeded.');
  }

  if (!skipBuild) {
    const hadBackup = await backupDist();
    const build = await safeRun('npm', ['run', 'build:astro'], { quiet: false });
    if (build.error) {
      const restoredBackup = hadBackup ? await restoreDistBackup() : false;
      if (!restoredBackup) {
        console.error(build.stdout || build.stderr || build.error);
        process.exitCode = 1;
        throw new Error(`build failed: ${build.error}`);
      }
      notes.push(`build failed, restored previous dist and continued: ${build.error}`);
      const detail = [build.stdout, build.stderr].filter(Boolean).join('\n').trim();
      if (detail) notes.push(`build failure detail: ${detail.split('\n').slice(-3).join(' | ')}`);
    } else {
      await cleanupDistBackup();
      notes.push('npm run build:astro succeeded.');
    }
  }

  if (withLive) {
    const productionSitemap = await checkProductionSitemap();
    if (productionSitemap.error) notes.push(`production sitemap check failed: ${productionSitemap.error}`);
    else notes.push('production sitemap HEAD check succeeded.');
  } else {
    notes.push('live HTTP checks were skipped; run top-level curl commands in the automation for production verification.');
  }

  const { urls } = await readSitemap();
  const results = await scanSitemapUrls(urls, { withLive });
  const counts = summarizeHttpResults(results);
  const issues = findIssues(results);

  if (withGsc) {
    const gsc = await runGsc();
    if (gsc.error) notes.push(`GSC check failed: ${gsc.error}`);
    else notes.push('GSC helper succeeded with existing token.');
  } else {
    notes.push('GSC check was skipped; run top-level `node scripts/gsc-performance.mjs` in the automation when network is available.');
  }

  const gscExportReports = skipGscExports ? [] : await readGscExportReports(gscExportDir);
  if (skipGscExports) {
    notes.push('GSC export report scan was skipped.');
  } else if (gscExportReports.length === 0) {
    notes.push(`No GSC Page Indexing export zips found at ${gscExportDir}.`);
  } else {
    const totalRows = gscExportReports.reduce((sum, report) => sum + report.total, 0);
    notes.push(`GSC Page Indexing exports scanned: ${gscExportReports.length} reports, ${totalRows} URLs.`);
  }

  const status = inferFinalStatus(counts);
  const summary = formatSummary({
    status,
    urlsScanned: urls.length,
    counts,
    notes,
  });

  console.log(summary);
  console.log('');
  console.log('Affected URLs and likely fix:');
  if (issues.length === 0) {
    console.log('- None.');
  } else {
    for (const issue of issues) {
      console.log(`- ${issue}`);
    }
  }
  if (gscExportReports.length > 0) {
    console.log('');
    console.log('GSC export buckets:');
    for (const report of gscExportReports) {
      console.log(`- ${report.reportName}: ${report.total} URLs`);
      for (const bucket of report.buckets) {
        console.log(`  - ${bucket.kind}: ${bucket.count}; likely fix: ${bucket.likelyFix}`);
        for (const example of bucket.examples) {
          console.log(`    - ${example}`);
        }
      }
    }
  }
}

const shouldRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (shouldRun) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
