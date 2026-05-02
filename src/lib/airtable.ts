/**
 * Airtable data-fetching helpers.
 *
 * All fetching happens at BUILD TIME only — this file is never shipped to
 * the browser. When the env vars are absent (local dev without Airtable)
 * we fall back to the bundled mock data automatically.
 */

import type {
  Brand, Outlet, DrinkCategory,
  AirtableBrandFields, AirtableOutletFields, AirtableCategoryFields,
  AirtableRecord, AirtableResponse,
} from './types';

import { BRANDS, OUTLETS, CATEGORIES } from './mockData';

// ─────────────────────────────────────────
// Config
// ─────────────────────────────────────────
const API_KEY      = import.meta.env.AIRTABLE_API_KEY;
const BASE_ID      = import.meta.env.AIRTABLE_BASE_ID;
const USE_MOCK     = import.meta.env.USE_MOCK_DATA === 'true';
const BASE_URL     = `https://api.airtable.com/v0/${BASE_ID}`;

function useMock(): boolean {
  return USE_MOCK || !API_KEY || !BASE_ID;
}

// ─────────────────────────────────────────
// Generic paginated fetch
// ─────────────────────────────────────────
async function fetchTable<T>(
  tableName: string,
  filterFormula?: string,
): Promise<AirtableRecord<T>[]> {
  const records: AirtableRecord<T>[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: '100' });
    if (filterFormula) params.set('filterByFormula', filterFormula);
    if (offset)        params.set('offset', offset);

    const res = await fetch(
      `${BASE_URL}/${encodeURIComponent(tableName)}?${params}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!res.ok) {
      throw new Error(`Airtable fetch failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as AirtableResponse<T>;
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

// ─────────────────────────────────────────
// Brands
// ─────────────────────────────────────────
export async function getBrands(): Promise<Brand[]> {
  if (useMock()) return BRANDS.filter(b => b.published);

  const records = await fetchTable<AirtableBrandFields>(
    'Brands',
    "{Published} = TRUE()",
  );

  return records.map(r => {
    const f = r.fields;
    return {
      id:           r.id,
      name:         f['Brand Name'],
      slug:         f['Slug'],
      logo:         f['Logo']?.[0]?.thumbnails?.large?.url ?? f['Logo']?.[0]?.url,
      description:  f['Description'],
      websiteUrl:   f['Website URL'],
      instagramUrl: f['Instagram URL'],
      featured:     f['Featured'] ?? false,
      published:    f['Published'] ?? false,
    } satisfies Brand;
  });
}

export async function getBrandBySlug(slug: string): Promise<Brand | undefined> {
  if (useMock()) return BRANDS.find(b => b.slug === slug && b.published);

  const records = await fetchTable<AirtableBrandFields>(
    'Brands',
    `AND({Slug} = "${slug}", {Published} = TRUE())`,
  );
  const brands = await Promise.resolve(records.map(r => {
    const f = r.fields;
    return {
      id:           r.id,
      name:         f['Brand Name'],
      slug:         f['Slug'],
      logo:         f['Logo']?.[0]?.thumbnails?.large?.url ?? f['Logo']?.[0]?.url,
      description:  f['Description'],
      websiteUrl:   f['Website URL'],
      instagramUrl: f['Instagram URL'],
      featured:     f['Featured'] ?? false,
      published:    f['Published'] ?? false,
    } satisfies Brand;
  }));
  return brands[0];
}

// ─────────────────────────────────────────
// Outlets
// ─────────────────────────────────────────

// We need brand data to enrich outlets from Airtable linked records.
// We pass in pre-fetched brands to avoid extra API calls.
async function buildOutlets(
  records: AirtableRecord<AirtableOutletFields>[],
  brands: Brand[],
  categories: DrinkCategory[],
): Promise<Outlet[]> {
  const brandMap  = new Map(brands.map(b => [b.id, b]));
  const catMap    = new Map(categories.map(c => [c.id, c]));

  return records.map(r => {
    const f         = r.fields;
    const brandRef  = f['Brand']?.[0];
    const brand     = brandRef ? brandMap.get(brandRef) : undefined;
    const catIds    = f['Drink Categories'] ?? [];
    const cats      = catIds.map(id => catMap.get(id)).filter(Boolean) as DrinkCategory[];

    let deliveryLinks;
    try {
      deliveryLinks = f['Delivery Links'] ? JSON.parse(f['Delivery Links']) : undefined;
    } catch {
      deliveryLinks = undefined;
    }

    const townSlug = (f['Town'] ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const mrtSlug = (f['Nearest MRT'] ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-mrt';

    return {
      id:                   r.id,
      name:                 f['Outlet Name'],
      slug:                 f['Slug'],
      brandId:              brand?.id ?? '',
      brandName:            brand?.name ?? '',
      brandSlug:            brand?.slug ?? '',
      brandLogo:            brand?.logo,
      town:                 f['Town'],
      townSlug,
      mall:                 f['Mall / Location'],
      address:              f['Address'],
      nearestMrt:           f['Nearest MRT'],
      mrtSlug:              f['Nearest MRT'] ? mrtSlug : undefined,
      openingHours:         f['Opening Hours'],
      phone:                f['Phone'],
      googleMapsUrl:        f['Google Maps URL'],
      deliveryLinks,
      popularDrinks:        f['Popular Drinks']?.split(',').map(s => s.trim()),
      drinkCategories:      cats.map(c => c.name),
      drinkCategorySlugs:   cats.map(c => c.slug),
      priceRange:           f['Price Range'],
      halalFriendly:        f['Halal-Friendly'] ?? false,
      seatingAvailable:     f['Seating Available'] ?? false,
      image:                f['Image']?.[0]?.url,
      galleryImages:        f['Gallery Images']?.map(i => i.url),
      featured:             f['Featured'] ?? false,
      published:            f['Published'] ?? false,
    } satisfies Outlet;
  });
}

export async function getOutlets(): Promise<Outlet[]> {
  if (useMock()) return OUTLETS.filter(o => o.published);

  const [records, brands, cats] = await Promise.all([
    fetchTable<AirtableOutletFields>('Outlets', '{Published} = TRUE()'),
    getBrands(),
    getCategories(),
  ]);

  return buildOutlets(records, brands, cats);
}

export async function getOutletBySlug(slug: string): Promise<Outlet | undefined> {
  if (useMock()) return OUTLETS.find(o => o.slug === slug && o.published);

  const [records, brands, cats] = await Promise.all([
    fetchTable<AirtableOutletFields>('Outlets', `AND({Slug} = "${slug}", {Published} = TRUE())`),
    getBrands(),
    getCategories(),
  ]);

  const outlets = await buildOutlets(records, brands, cats);
  return outlets[0];
}

export async function getOutletsByTown(townSlug: string): Promise<Outlet[]> {
  const outlets = await getOutlets();
  return outlets.filter(o => o.townSlug === townSlug);
}

export async function getOutletsByBrand(brandSlug: string): Promise<Outlet[]> {
  const outlets = await getOutlets();
  return outlets.filter(o => o.brandSlug === brandSlug);
}

export async function getOutletsByCategory(categorySlug: string): Promise<Outlet[]> {
  const outlets = await getOutlets();
  return outlets.filter(o => o.drinkCategorySlugs?.includes(categorySlug));
}

export async function getOutletsByMrt(mrtSlug: string): Promise<Outlet[]> {
  const outlets = await getOutlets();
  return outlets.filter(o => o.mrtSlug === mrtSlug);
}

// ─────────────────────────────────────────
// Drink Categories
// ─────────────────────────────────────────
export async function getCategories(): Promise<DrinkCategory[]> {
  if (useMock()) return CATEGORIES.filter(c => c.published);

  const records = await fetchTable<AirtableCategoryFields>(
    'Drink Categories',
    '{Published} = TRUE()',
  );

  return records.map(r => {
    const f = r.fields;
    return {
      id:          r.id,
      name:        f['Category Name'],
      slug:        f['Slug'],
      description: f['Description'],
      image:       f['Image']?.[0]?.url,
      published:   f['Published'] ?? false,
    } satisfies DrinkCategory;
  });
}

export async function getCategoryBySlug(slug: string): Promise<DrinkCategory | undefined> {
  if (useMock()) return CATEGORIES.find(c => c.slug === slug && c.published);

  const records = await fetchTable<AirtableCategoryFields>(
    'Drink Categories',
    `AND({Slug} = "${slug}", {Published} = TRUE())`,
  );
  const cats = records.map(r => {
    const f = r.fields;
    return {
      id:          r.id,
      name:        f['Category Name'],
      slug:        f['Slug'],
      description: f['Description'],
      image:       f['Image']?.[0]?.url,
      published:   f['Published'] ?? false,
    } satisfies DrinkCategory;
  });
  return cats[0];
}
