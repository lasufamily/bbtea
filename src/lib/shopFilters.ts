import type { Product } from './types';

export type ShopStockFilter = 'all' | 'in-stock' | 'out-of-stock';

export type ShopSort =
  | 'featured'
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'
  | 'rating-desc'
  | 'capacity-asc'
  | 'capacity-desc';

export interface ShopFilters {
  category: string;
  brand: string;
  merchant: string;
  stock: ShopStockFilter;
  official: boolean;
  minPrice?: number;
  maxPrice?: number;
  minCapacity?: number;
  maxCapacity?: number;
  q: string;
  sort: ShopSort;
}

export interface ShopOption {
  label: string;
  value: string;
  count: number;
}

export interface ShopFilterOptions {
  categories: ShopOption[];
  brands: ShopOption[];
  merchants: ShopOption[];
  priceBounds: { min?: number; max?: number };
  capacityBounds: { min?: number; max?: number };
}

const SORTS = new Set<ShopSort>([
  'featured',
  'name-asc',
  'name-desc',
  'price-asc',
  'price-desc',
  'rating-desc',
  'capacity-asc',
  'capacity-desc',
]);

function textParam(params: URLSearchParams, key: string): string {
  return (params.get(key) ?? '').trim();
}

function numericParam(params: URLSearchParams, key: string): number | undefined {
  const rawValue = params.get(key);
  if (!rawValue) return undefined;

  const value = Number(rawValue);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

export function parseShopFilters(params: URLSearchParams): ShopFilters {
  const stock = textParam(params, 'stock');
  const sort = textParam(params, 'sort');

  return {
    category: textParam(params, 'category'),
    brand: textParam(params, 'brand'),
    merchant: textParam(params, 'merchant'),
    stock: stock === 'in-stock' || stock === 'out-of-stock' ? stock : 'all',
    official: textParam(params, 'official') === 'true',
    minPrice: numericParam(params, 'minPrice'),
    maxPrice: numericParam(params, 'maxPrice'),
    minCapacity: numericParam(params, 'minCapacity'),
    maxCapacity: numericParam(params, 'maxCapacity'),
    q: textParam(params, 'q'),
    sort: SORTS.has(sort as ShopSort) ? sort as ShopSort : 'featured',
  };
}

function optionList(entries: Map<string, ShopOption>): ShopOption[] {
  return Array.from(entries.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function addOption(entries: Map<string, ShopOption>, value: string, label = value): void {
  if (!value) return;

  const existing = entries.get(value);
  if (existing) {
    existing.count += 1;
  } else {
    entries.set(value, { label, value, count: 1 });
  }
}

function bounds(values: number[]): { min?: number; max?: number } {
  if (values.length === 0) return {};
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

export function buildShopFilterOptions(products: Product[]): ShopFilterOptions {
  const categories = new Map<string, ShopOption>();
  const brands = new Map<string, ShopOption>();
  const merchants = new Map<string, ShopOption>();
  const prices: number[] = [];
  const capacities: number[] = [];

  for (const product of products) {
    addOption(categories, product.categorySlug, product.category);
    addOption(brands, product.brandName ?? '');
    addOption(merchants, product.merchant ?? '');
    if (typeof product.priceSgd === 'number') prices.push(product.priceSgd);
    if (typeof product.capacityMl === 'number') capacities.push(product.capacityMl);
  }

  return {
    categories: optionList(categories),
    brands: optionList(brands),
    merchants: optionList(merchants),
    priceBounds: bounds(prices),
    capacityBounds: bounds(capacities),
  };
}

function normalizedSearchText(product: Product): string {
  return [
    product.name,
    product.category,
    product.brandName,
    product.shortDescription,
    product.description,
    product.bestFor,
    product.merchant,
    product.stockSummary,
  ].filter(Boolean).join(' ').toLowerCase();
}

function matchesFilters(product: Product, filters: ShopFilters): boolean {
  if (filters.category && product.categorySlug !== filters.category) return false;
  if (filters.brand && product.brandName !== filters.brand) return false;
  if (filters.merchant && product.merchant !== filters.merchant) return false;
  if (filters.stock === 'in-stock' && !product.inStock) return false;
  if (filters.stock === 'out-of-stock' && product.inStock) return false;
  if (filters.official && !product.officialShop) return false;
  if (typeof filters.minPrice === 'number' && (product.priceSgd ?? Number.POSITIVE_INFINITY) < filters.minPrice) return false;
  if (typeof filters.maxPrice === 'number' && (product.priceSgd ?? Number.NEGATIVE_INFINITY) > filters.maxPrice) return false;
  if (typeof filters.minCapacity === 'number' && (product.capacityMl ?? Number.POSITIVE_INFINITY) < filters.minCapacity) return false;
  if (typeof filters.maxCapacity === 'number' && (product.capacityMl ?? Number.NEGATIVE_INFINITY) > filters.maxCapacity) return false;
  if (filters.q && !normalizedSearchText(product).includes(filters.q.toLowerCase())) return false;

  return true;
}

function numberAsc(getValue: (product: Product) => number | undefined) {
  return (a: Product, b: Product): number => {
    const aValue = getValue(a);
    const bValue = getValue(b);
    if (typeof aValue !== 'number' && typeof bValue !== 'number') return byName(a, b);
    if (typeof aValue !== 'number') return 1;
    if (typeof bValue !== 'number') return -1;
    return aValue - bValue || byName(a, b);
  };
}

function numberDesc(getValue: (product: Product) => number | undefined) {
  return (a: Product, b: Product): number => {
    const aValue = getValue(a);
    const bValue = getValue(b);
    if (typeof aValue !== 'number' && typeof bValue !== 'number') return byName(a, b);
    if (typeof aValue !== 'number') return 1;
    if (typeof bValue !== 'number') return -1;
    return bValue - aValue || byName(a, b);
  };
}

function byName(a: Product, b: Product): number {
  return a.name.localeCompare(b.name);
}

function compareProducts(sort: ShopSort): (a: Product, b: Product) => number {
  switch (sort) {
    case 'name-asc':
      return byName;
    case 'name-desc':
      return (a, b) => b.name.localeCompare(a.name);
    case 'price-asc':
      return numberAsc(product => product.priceSgd);
    case 'price-desc':
      return numberDesc(product => product.priceSgd);
    case 'rating-desc':
      return numberDesc(product => product.rating);
    case 'capacity-asc':
      return numberAsc(product => product.capacityMl);
    case 'capacity-desc':
      return numberDesc(product => product.capacityMl);
    case 'featured':
    default:
      return (a, b) => Number(b.featured) - Number(a.featured) || byName(a, b);
  }
}

export function filterAndSortProducts(products: Product[], filters: ShopFilters): Product[] {
  return products
    .filter(product => matchesFilters(product, filters))
    .toSorted(compareProducts(filters.sort));
}
