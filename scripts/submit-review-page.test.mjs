import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('review submission retains its real form behind an explicit loading choice', async () => {
  const source = await readFile(new URL('../src/pages/submit-a-review.astro', import.meta.url), 'utf8');
  assert.match(source, /formId="8V2FBhDQkmus"/);
  assert.match(source, /ExternalForm provider="fillout"/);
  assert.match(source, /noindex/);
  assert.doesNotMatch(source, /position:fixed|<script src=/);
});
