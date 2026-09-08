import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildShopFilterOptions,
  filterAndSortProducts,
  parseShopFilters,
} from '../src/lib/shopFilters.ts';

const products = [
  {
    id: 'thermal-a',
    name: 'Arctic Thermos Flask',
    slug: 'arctic-thermos-flask',
    category: 'Thermos Flasks',
    categorySlug: 'thermos-flasks',
    brandName: 'Arctic',
    shortDescription: 'Keeps tea cold for all-day runs',
    merchant: 'Shopee',
    capacityMl: 500,
    priceSgd: 22,
    rating: 4.8,
    featured: true,
    published: true,
    inStock: true,
    officialShop: true,
    images: [],
    compareWithIds: [],
  },
  {
    id: 'thermal-b',
    name: 'Budget Stainless Bottle',
    slug: 'budget-stainless-bottle',
    category: 'Thermos Flasks',
    categorySlug: 'thermos-flasks',
    brandName: 'DailySip',
    description: 'Simple insulated bottle',
    merchant: 'Lazada',
    capacityMl: 750,
    priceSgd: 12,
    rating: 4.1,
    featured: false,
    published: true,
    inStock: false,
    officialShop: false,
    images: [],
    compareWithIds: [],
  },
  {
    id: 'tumbler-a',
    name: 'Glass Bubble Tea Tumbler',
    slug: 'glass-bubble-tea-tumbler',
    category: 'Tumblers',
    categorySlug: 'tumblers',
    brandName: 'DailySip',
    shortDescription: 'Reusable tumbler for pearls',
    merchant: 'Shopee',
    capacityMl: 650,
    priceSgd: 18,
    rating: 4.5,
    featured: false,
    published: true,
    inStock: true,
    officialShop: false,
    images: [],
    compareWithIds: [],
  },
];

test('parseShopFilters normalizes supported URL parameters', () => {
  const filters = parseShopFilters(new URLSearchParams({
    category: 'thermos-flasks',
    brand: 'DailySip',
    merchant: 'Shopee',
    stock: 'in-stock',
    official: 'true',
    minPrice: '10',
    maxPrice: '30',
    minCapacity: '500',
    maxCapacity: '800',
    q: '  stainless  ',
    sort: 'price-desc',
  }));

  assert.deepEqual(filters, {
    category: 'thermos-flasks',
    brand: 'DailySip',
    merchant: 'Shopee',
    stock: 'in-stock',
    official: true,
    minPrice: 10,
    maxPrice: 30,
    minCapacity: 500,
    maxCapacity: 800,
    q: 'stainless',
    sort: 'price-desc',
  });
});

test('filterAndSortProducts applies category, stock, text, numeric, and merchant filters together', () => {
  const result = filterAndSortProducts(products, {
    category: 'thermos-flasks',
    brand: '',
    merchant: 'Lazada',
    stock: 'all',
    official: false,
    minPrice: 10,
    maxPrice: 20,
    minCapacity: 700,
    maxCapacity: undefined,
    q: 'stainless',
    sort: 'name-asc',
  });

  assert.deepEqual(result.map(product => product.slug), ['budget-stainless-bottle']);
});

test('filterAndSortProducts sorts by featured, price, rating, capacity, and name with stable fallbacks', () => {
  assert.deepEqual(
    filterAndSortProducts(products, parseShopFilters(new URLSearchParams({ sort: 'featured' }))).map(product => product.slug),
    ['arctic-thermos-flask', 'budget-stainless-bottle', 'glass-bubble-tea-tumbler'],
  );
  assert.deepEqual(
    filterAndSortProducts(products, parseShopFilters(new URLSearchParams({ sort: 'price-asc' }))).map(product => product.slug),
    ['budget-stainless-bottle', 'glass-bubble-tea-tumbler', 'arctic-thermos-flask'],
  );
  assert.deepEqual(
    filterAndSortProducts(products, parseShopFilters(new URLSearchParams({ sort: 'rating-desc' }))).map(product => product.slug),
    ['arctic-thermos-flask', 'glass-bubble-tea-tumbler', 'budget-stainless-bottle'],
  );
  assert.deepEqual(
    filterAndSortProducts(products, parseShopFilters(new URLSearchParams({ sort: 'capacity-desc' }))).map(product => product.slug),
    ['budget-stainless-bottle', 'glass-bubble-tea-tumbler', 'arctic-thermos-flask'],
  );
});

test('buildShopFilterOptions returns unique sorted options scoped to the provided products', () => {
  const options = buildShopFilterOptions(products);

  assert.deepEqual(options.categories, [
    { label: 'Thermos Flasks', value: 'thermos-flasks', count: 2 },
    { label: 'Tumblers', value: 'tumblers', count: 1 },
  ]);
  assert.deepEqual(options.brands, [
    { label: 'Arctic', value: 'Arctic', count: 1 },
    { label: 'DailySip', value: 'DailySip', count: 2 },
  ]);
  assert.deepEqual(options.merchants, [
    { label: 'Lazada', value: 'Lazada', count: 1 },
    { label: 'Shopee', value: 'Shopee', count: 2 },
  ]);
  assert.deepEqual(options.priceBounds, { min: 12, max: 22 });
  assert.deepEqual(options.capacityBounds, { min: 500, max: 750 });
});
