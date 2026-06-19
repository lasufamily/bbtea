import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getEnvClient,
  getMissingClientMessage,
  hasUsableAccessToken,
} from './gsc-performance.mjs';

test('hasUsableAccessToken requires a token with more than 60 seconds remaining', () => {
  const now = Date.UTC(2026, 5, 19, 15, 0, 0);

  assert.equal(
    hasUsableAccessToken({ access_token: 'abc', expires_at: now + 120_000 }, now),
    true,
  );
  assert.equal(
    hasUsableAccessToken({ access_token: 'abc', expires_at: now + 30_000 }, now),
    false,
  );
  assert.equal(hasUsableAccessToken({ access_token: 'abc' }, now), false);
});

test('getEnvClient returns null without required env vars', () => {
  const prevId = process.env.GSC_CLIENT_ID;
  const prevSecret = process.env.GSC_CLIENT_SECRET;
  delete process.env.GSC_CLIENT_ID;
  delete process.env.GSC_CLIENT_SECRET;

  assert.equal(getEnvClient(), null);

  process.env.GSC_CLIENT_ID = prevId;
  process.env.GSC_CLIENT_SECRET = prevSecret;
});

test('getEnvClient uses env vars when provided', () => {
  const prevId = process.env.GSC_CLIENT_ID;
  const prevSecret = process.env.GSC_CLIENT_SECRET;
  const prevAuth = process.env.GSC_AUTH_URI;
  const prevToken = process.env.GSC_TOKEN_URI;

  process.env.GSC_CLIENT_ID = 'client-id';
  process.env.GSC_CLIENT_SECRET = 'client-secret';
  process.env.GSC_AUTH_URI = 'https://example.com/auth';
  process.env.GSC_TOKEN_URI = 'https://example.com/token';

  assert.deepEqual(getEnvClient(), {
    client_id: 'client-id',
    client_secret: 'client-secret',
    auth_uri: 'https://example.com/auth',
    token_uri: 'https://example.com/token',
  });

  process.env.GSC_CLIENT_ID = prevId;
  process.env.GSC_CLIENT_SECRET = prevSecret;
  process.env.GSC_AUTH_URI = prevAuth;
  process.env.GSC_TOKEN_URI = prevToken;
});

test('missing client message explains how to restore Search Console auth', () => {
  const message = getMissingClientMessage();

  assert.match(message, /re-auth is required/i);
  assert.match(message, /GSC_CLIENT_SECRET_FILE/);
  assert.match(message, /GSC_CLIENT_ID/);
  assert.match(message, /GSC_CLIENT_SECRET/);
});
