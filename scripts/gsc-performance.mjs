#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const DEFAULT_CLIENT_SECRET = path.join(ROOT, '.gsc', 'client_secret.json');
const CLIENT_SECRET_FILE = process.env.GSC_CLIENT_SECRET_FILE || DEFAULT_CLIENT_SECRET;
const TOKEN_FILE = process.env.GSC_TOKEN_FILE || path.join(ROOT, '.gsc', 'token.json');
const SITE_URL = process.env.GSC_SITE_URL || 'https://bbtea.sg/';
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

function base64Url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function todayOffset(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function loadClient() {
  const json = await readJson(CLIENT_SECRET_FILE);
  const client = json.installed || json.web;
  if (!client?.client_id || !client?.client_secret || !client?.token_uri || !client?.auth_uri) {
    throw new Error(`Invalid Google OAuth client file: ${CLIENT_SECRET_FILE}`);
  }
  return client;
}

async function postForm(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`OAuth request failed (${response.status}): ${JSON.stringify(json)}`);
  }
  return json;
}

function openBrowser(url) {
  const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const child = spawn(command, args, { stdio: 'ignore', detached: true });
  child.on('error', () => {
    console.log(`Open this URL in your browser:\n${url}\n`);
  });
  child.unref();
}

async function getCodeFromBrowser(authUrl, expectedState) {
  const server = http.createServer();
  const port = await new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });

  const redirectUri = `http://localhost:${port}`;
  const codePromise = new Promise((resolve, reject) => {
    server.on('request', (req, res) => {
      const reqUrl = new URL(req.url, redirectUri);
      if (reqUrl.pathname !== '/') {
        res.writeHead(404).end('Not found');
        return;
      }
      const state = reqUrl.searchParams.get('state');
      const code = reqUrl.searchParams.get('code');
      const error = reqUrl.searchParams.get('error');
      if (error) {
        res.writeHead(400, { 'content-type': 'text/plain' }).end(`Authorization failed: ${error}`);
        reject(new Error(`Authorization failed: ${error}`));
        return;
      }
      if (state !== expectedState || !code) {
        res.writeHead(400, { 'content-type': 'text/plain' }).end('Authorization response was invalid.');
        reject(new Error('Authorization response was invalid.'));
        return;
      }
      res.writeHead(200, { 'content-type': 'text/html' }).end('<h1>Search Console is connected</h1><p>You can close this tab and return to Codex.</p>');
      resolve(code);
    });
  }).finally(() => server.close());

  const url = `${authUrl}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  console.log(`Opening Google sign-in in your browser...\n${url}\n`);
  openBrowser(url);
  return { code: await codePromise, redirectUri };
}

async function authenticate(client) {
  await fs.mkdir(path.dirname(TOKEN_FILE), { recursive: true });
  const verifier = base64Url(crypto.randomBytes(32));
  const challenge = base64Url(crypto.createHash('sha256').update(verifier).digest());
  const state = base64Url(crypto.randomBytes(16));
  const authEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
  const authUrl = `${authEndpoint}?${new URLSearchParams({
    client_id: client.client_id,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  })}`;
  const { code, redirectUri } = await getCodeFromBrowser(authUrl, state);
  const token = await postForm(client.token_uri, {
    client_id: client.client_id,
    client_secret: client.client_secret,
    code,
    code_verifier: verifier,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });
  token.expires_at = Date.now() + (token.expires_in || 3600) * 1000;
  await fs.writeFile(TOKEN_FILE, JSON.stringify(token, null, 2));
  return token;
}

async function getAccessToken(client) {
  let token;
  try {
    token = await readJson(TOKEN_FILE);
  } catch {
    return (await authenticate(client)).access_token;
  }
  if (token.access_token && token.expires_at && token.expires_at - Date.now() > 60_000) {
    return token.access_token;
  }
  if (!token.refresh_token) {
    return (await authenticate(client)).access_token;
  }
  const refreshed = await postForm(client.token_uri, {
    client_id: client.client_id,
    client_secret: client.client_secret,
    refresh_token: token.refresh_token,
    grant_type: 'refresh_token',
  });
  const nextToken = {
    ...token,
    ...refreshed,
    refresh_token: refreshed.refresh_token || token.refresh_token,
    expires_at: Date.now() + (refreshed.expires_in || 3600) * 1000,
  };
  await fs.writeFile(TOKEN_FILE, JSON.stringify(nextToken, null, 2));
  return nextToken.access_token;
}

async function gscFetch(accessToken, url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Search Console API request failed (${response.status}): ${JSON.stringify(json)}`);
  }
  return json;
}

function printRows(title, rows, keyLabel) {
  console.log(`\n${title}`);
  if (!rows?.length) {
    console.log('  No rows returned.');
    return;
  }
  for (const row of rows.slice(0, 10)) {
    const key = row.keys?.join(' | ') || '(total)';
    const ctr = row.ctr == null ? 'n/a' : `${(row.ctr * 100).toFixed(2)}%`;
    const pos = row.position == null ? 'n/a' : row.position.toFixed(1);
    console.log(`  ${keyLabel}: ${key}`);
    console.log(`    clicks=${row.clicks || 0} impressions=${row.impressions || 0} ctr=${ctr} position=${pos}`);
  }
}

function pickSite(sites) {
  const entries = sites.siteEntry || [];
  return (
    entries.find((site) => site.siteUrl === SITE_URL) ||
    entries.find((site) => site.siteUrl === SITE_URL.replace(/\/$/, '')) ||
    entries.find((site) => site.siteUrl === `sc-domain:${new URL(SITE_URL).hostname.replace(/^www\./, '')}`) ||
    entries[0]
  );
}

async function queryPerformance(accessToken, siteUrl, dimensions = []) {
  return gscFetch(accessToken, `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: 'POST',
    body: JSON.stringify({
      startDate: process.env.GSC_START_DATE || todayOffset(-28),
      endDate: process.env.GSC_END_DATE || todayOffset(-1),
      dimensions,
      rowLimit: 10,
      searchType: 'web',
    }),
  });
}

async function main() {
  const client = await loadClient();
  const accessToken = await getAccessToken(client);
  const sites = await gscFetch(accessToken, 'https://searchconsole.googleapis.com/webmasters/v3/sites');
  const siteEntry = pickSite(sites);
  const siteUrl = siteEntry?.siteUrl || SITE_URL;
  console.log(`Token saved at: ${TOKEN_FILE}`);
  console.log(`Available Search Console sites: ${(sites.siteEntry || []).map((site) => site.siteUrl).join(', ') || 'none'}`);
  console.log(`\nQuerying performance for: ${siteUrl}`);
  console.log(`Date range: ${process.env.GSC_START_DATE || todayOffset(-28)} to ${process.env.GSC_END_DATE || todayOffset(-1)}`);

  const total = await queryPerformance(accessToken, siteUrl);
  printRows('Overall', total.rows || [{ keys: ['total'], clicks: total.clicks, impressions: total.impressions, ctr: total.ctr, position: total.position }], 'metric');

  const queries = await queryPerformance(accessToken, siteUrl, ['query']);
  printRows('Top Queries', queries.rows, 'query');

  const pages = await queryPerformance(accessToken, siteUrl, ['page']);
  printRows('Top Pages', pages.rows, 'page');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
