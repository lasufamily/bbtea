import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('main navigation only includes Directory, Bubble Tea, Coffee, and Menus', async () => {
  const source = await readFile(new URL('../src/components/Header.astro', import.meta.url), 'utf8');
  const navLinksMatch = source.match(/const navLinks = \[([\s\S]*?)\];/);

  assert.ok(navLinksMatch, 'Header should define navLinks');
  const navLinksSource = navLinksMatch[1];

  assert.match(navLinksSource, /href: '\/directory\/',\s+label: 'Directory'/);
  assert.match(navLinksSource, /href: '\/bubble-tea-shops\/',\s+label: 'Bubble Tea'/);
  assert.match(navLinksSource, /href: '\/coffee-shops\/',\s+label: 'Coffee'/);
  assert.match(navLinksSource, /href: '\/menus\/',\s+label: 'Menus'/);
  assert.doesNotMatch(navLinksSource, /Towns|Malls|Drinks|Brands|Blog|Search/);
});
