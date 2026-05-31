import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('/submit-a-review publishes the fullscreen Fillout review form', async () => {
  const source = await readFile(new URL('../src/pages/submit-a-review.astro', import.meta.url), 'utf8');

  assert.match(source, /data-fillout-id="8V2FBhDQkmus"/);
  assert.match(source, /data-fillout-embed-type="fullscreen"/);
  assert.match(source, /position:fixed;top:0px;left:0px;right:0px;bottom:0px;/);
  assert.match(source, /style="width:100%;height:100%;"/);
  assert.match(source, /<script src="https:\/\/server\.fillout\.com\/embed\/v1\/" is:inline><\/script>/);
});
