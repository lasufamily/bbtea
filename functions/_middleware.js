import { retiredFaqPaths } from '../src/lib/retiredPages.js';

const retiredHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,follow"><title>Page Retired | BBTea.sg</title><style>body{font-family:system-ui,sans-serif;max-width:42rem;margin:4rem auto;padding:0 1.5rem;line-height:1.6;color:#202020}a{color:#1760ad}</style></head><body><main><p>BBTea.sg · 410</p><h1>This page has been retired.</h1><p>The content is no longer available. You can browse the drink directory or contact us about an old link.</p><p><a href="/directory/">Browse drink shops</a> · <a href="/contact/">Contact BBTea.sg</a></p></main></body></html>`;

export function onRequest(context) {
  const path = new URL(context.request.url).pathname.replace(/\/+$/, '') || '/';
  if (path !== '/shop' && !path.startsWith('/shop/') && !retiredFaqPaths.has(path)) {
    return context.next();
  }
  return new Response(context.request.method === 'HEAD' ? null : retiredHtml, {
    status: 410,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, follow',
    },
  });
}
