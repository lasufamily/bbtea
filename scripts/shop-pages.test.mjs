import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('shop product browser exposes robust filter and sort controls', async () => {
  const source = await readFile(new URL('../src/components/ShopProductBrowser.astro', import.meta.url), 'utf8');

  for (const field of ['q', 'category', 'brand', 'merchant', 'stock', 'official', 'minPrice', 'maxPrice', 'minCapacity', 'maxCapacity', 'sort']) {
    assert.match(source, new RegExp(`name="${field}"`), `Expected a ${field} control`);
  }

  for (const sort of ['featured', 'name-asc', 'price-asc', 'price-desc', 'rating-desc', 'capacity-desc']) {
    assert.match(source, new RegExp(`value="${sort}"`), `Expected ${sort} sort option`);
  }

  assert.match(source, /data-shop-product-browser/);
  assert.match(source, /data-shop-filter-sidebar/);
  assert.match(source, /data-mobile-filter-toggle/);
  assert.match(source, /bg-\[var\(--color-forest-700\)\]/);
  assert.match(source, /data-mobile-filter-toggle[\s\S]*<svg/);
  assert.doesNotMatch(source, />Open<\/span>/);
  assert.match(source, /data-mobile-filter-drawer/);
  assert.match(source, /data-mobile-filter-overlay/);
  assert.match(source, /lg:grid-cols-\[280px_minmax\(0,1fr\)\]/);
  assert.match(source, /lg:sticky/);
  assert.match(source, /window\.history\.pushState/);
  assert.match(source, /data-product-count/);
  assert.match(source, /data-empty-state/);
});

test('/shop and category shop routes render the shared product browser', async () => {
  const shopSource = await readFile(new URL('../src/pages/shop/index.astro', import.meta.url), 'utf8');
  const categorySource = await readFile(new URL('../src/pages/shop/[category]/index.astro', import.meta.url), 'utf8');

  assert.match(shopSource, /ShopProductBrowser/);
  assert.match(categorySource, /ShopProductBrowser/);
  assert.match(shopSource, /showCategoryFilter=\{true\}/);
  assert.match(categorySource, /showCategoryFilter=\{false\}/);
});

test('/shop hero uses category buttons instead of product and category stats', async () => {
  const source = await readFile(new URL('../src/pages/shop/index.astro', import.meta.url), 'utf8');

  assert.match(source, /categoryButtons/);
  assert.match(source, /href="\/shop\/"[\s\S]*All Products/);
  assert.match(source, /href=\{`\/shop\/\$\{category\.slug\}\/`\}/);
  assert.match(source, /category\.name/);
  assert.doesNotMatch(source, /Drinkware and gear we recommend for bubble tea runs and everyday carry in Singapore/);
  assert.doesNotMatch(source, /products\.length === 1 \? 'product' : 'products'/);
  assert.doesNotMatch(source, /categoryCount/);
});

test('category shop hero uses the shared category buttons instead of product count copy', async () => {
  const source = await readFile(new URL('../src/pages/shop/[category]/index.astro', import.meta.url), 'utf8');

  assert.match(source, /categoryButtons/);
  assert.match(source, /href="\/shop\/"[\s\S]*All Products/);
  assert.match(source, /href=\{`\/shop\/\$\{category\.slug\}\/`\}/);
  assert.match(source, /category\.name/);
  assert.doesNotMatch(source, /products\.length === 1 \? 'product' : 'products'\} in \{categoryName\}/);
});

test('shop cards and product pages show ratings with yellow star icons', async () => {
  const cardSource = await readFile(new URL('../src/components/ProductCard.astro', import.meta.url), 'utf8');
  const productSource = await readFile(new URL('../src/pages/shop/[category]/[slug].astro', import.meta.url), 'utf8');
  const starSource = await readFile(new URL('../src/components/StarRating.astro', import.meta.url), 'utf8');

  assert.match(cardSource, /StarRating/);
  assert.match(productSource, /StarRating/);
  assert.match(starSource, /data-star-rating/);
  assert.match(starSource, /text-yellow-400/);
  assert.match(starSource, /aria-label=\{label\}/);
  assert.doesNotMatch(cardSource, /· \{product\.rating\.toFixed\(1\)\}/);
  assert.doesNotMatch(productSource, /Shop rating \{product\.shopRating\.toFixed\(2\)\}/);
  assert.doesNotMatch(productSource, /<span>Shop rating<\/span>/);
});

test('product pages show product ratings only and omit shop ratings', async () => {
  const source = await readFile(new URL('../src/pages/shop/[category]/[slug].astro', import.meta.url), 'utf8');

  assert.match(source, /labelPrefix="Product rating"/);
  assert.doesNotMatch(source, /product\.shopRating/);
  assert.doesNotMatch(source, /labelPrefix="Shop rating"/);
});

test('shop cards emphasize price with brand blue styling', async () => {
  const source = await readFile(new URL('../src/components/ProductCard.astro', import.meta.url), 'utf8');

  assert.match(source, /data-product-price/);
  assert.match(source, /text-lg/);
  assert.match(source, /font-bold/);
  assert.match(source, /text-\[var\(--color-forest-700\)\]/);
});

test('product gallery thumbnails update the main product image on hover and click', async () => {
  const source = await readFile(new URL('../src/pages/shop/[category]/[slug].astro', import.meta.url), 'utf8');

  assert.match(source, /data-product-gallery/);
  assert.match(source, /data-product-main-image/);
  assert.match(source, /data-product-thumbnail/);
  assert.match(source, /mouseenter/);
  assert.match(source, /click/);
  assert.match(source, /mainImage\.src = thumbnail\.dataset\.gallerySrc/);
});
