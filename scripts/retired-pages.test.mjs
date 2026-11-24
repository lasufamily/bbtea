import test from 'node:test';
import assert from 'node:assert/strict';

test('retired URLs bypass stale assets with a real noncacheable 410', async () => {
  const { onRequest } = await import('../functions/_middleware.js');
  for (const path of ['/shop', '/shop/', '/shop/thermos-flasks/old-product/', '/faq/what-bubble-tea-is-safe-for-pregnancy/']) {
    const response = await onRequest({request:new Request(`https://bbtea.sg${path}`),next:()=>{throw Error('must not fetch stale asset')}});
    assert.equal(response.status,410);
    assert.equal(response.headers.get('Cache-Control'),'no-store');
    assert.match(response.headers.get('X-Robots-Tag'),/noindex/);
    assert.doesNotMatch(await response.text(),/googletagmanager|shopee|kcal/);
  }
});

test('ordinary directory, menu and FAQ requests remain static', async () => {
  const { onRequest } = await import('../functions/_middleware.js');
  for (const path of ['/', '/menus/koi-the/', '/faq/what-is-bubble-tea/', '/shopping/']) {
    const expected=new Response('static asset');
    assert.equal(await onRequest({request:new Request(`https://bbtea.sg${path}`),next:()=>expected}),expected);
  }
});
