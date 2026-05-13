/**
 * Airtable data-fetching helpers.
 *
 * All fetching happens at BUILD TIME only — this file is never shipped to
 * the browser. Both AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set;
 * an error is thrown at build time if either is missing.
 */

import type {
  Brand, Outlet, Drink, DrinkCategory, Mall,
  AirtableBrandFields, AirtableOutletFields, AirtableDrinkFields, AirtableTownFields, AirtableMrtStationFields, AirtableMallFields,
  AirtableRecord, AirtableResponse,
} from './types';

// ─────────────────────────────────────────
// Config
// ─────────────────────────────────────────
const API_KEY  = import.meta.env.AIRTABLE_API_KEY;
const BASE_ID  = import.meta.env.AIRTABLE_BASE_ID;
const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`;

function assertConfig(): void {
  if (!API_KEY || !BASE_ID) {
    throw new Error(
      '[airtable] Missing env vars. Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID before building.',
    );
  }
}

function normalizeText(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim() || undefined;
  if (Array.isArray(value)) {
    return value
      .map(item => normalizeText(item))
      .filter(Boolean)
      .join(', ') || undefined;
  }
  if (value == null) return undefined;
  return String(value).trim() || undefined;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─────────────────────────────────────────
// Generic paginated fetch
// ─────────────────────────────────────────
async function fetchTable<T>(
  tableName: string,
  filterFormula?: string,
): Promise<AirtableRecord<T>[]> {
  assertConfig();

  const records: AirtableRecord<T>[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: '100' });
    if (filterFormula) params.set('filterByFormula', filterFormula);
    if (offset)        params.set('offset', offset);

    const url = `${BASE_URL}/${encodeURIComponent(tableName)}?${params}`;

    // Retry up to 3 times on transient 5xx / 429 errors with exponential back-off
    let res: Response | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok || (res.status < 500 && res.status !== 429)) break;
      if (attempt < 3) {
        const delay = attempt * 2000; // 2 s, then 4 s
        console.warn(`[airtable] ${res.status} on attempt ${attempt}, retrying in ${delay}ms…`);
        await new Promise(r => setTimeout(r, delay));
      }
    }

    if (!res!.ok) {
      throw new Error(`Airtable fetch failed: ${res!.status} ${res!.statusText} — URL: ${url}`);
    }

    const data = (await res!.json()) as AirtableResponse<T>;
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

// ─────────────────────────────────────────
// Build-time promise caches
// Astro renders pages concurrently in the same Node process — caching
// the in-flight promise ensures Airtable is only called once per table,
// no matter how many pages request the same data simultaneously.
// ─────────────────────────────────────────
let _brandsCache:     Promise<Brand[]>         | null = null;
let _drinksCache:     Promise<Drink[]>         | null = null;
let _categoriesCache: Promise<DrinkCategory[]> | null = null;
let _outletsCache:    Promise<Outlet[]>        | null = null;
let _mallsCache:      Promise<Mall[]>          | null = null;

type NamedSlug = { name: string; slug: string; line?: string };

function isAirtableRecordId(value: string): boolean {
  return /^rec[a-z0-9]{14,}$/i.test(value);
}

function firstLinkedValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function stationSlugFromName(name: string): string {
  const baseName = name
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+MRT(?:\s+Station)?$/i, '')
    .trim();

  return `${slugify(baseName || name)}-mrt`;
}

// ─────────────────────────────────────────
// Towns (used to resolve linked-record IDs on outlets)
// ─────────────────────────────────────────
let _townMapCache: Map<string, { name: string; slug: string }> | null = null;

async function getTownMap(): Promise<Map<string, { name: string; slug: string }>> {
  if (_townMapCache) return _townMapCache;

  const records = await fetchTable<AirtableTownFields>('Towns');
  const map = new Map<string, { name: string; slug: string }>();

  for (const r of records) {
    const name = r.fields['Name'];
    if (!name) continue;
    const slug = slugify(name);
    map.set(r.id, { name, slug });
  }

  _townMapCache = map;
  return map;
}

export async function getTowns(): Promise<import('./types').Town[]> {
  const map = await getTownMap();
  return Array.from(map.values()).map(({ name, slug }) => ({ name, slug }));
}

// ─────────────────────────────────────────
// MRT Stations (used to resolve linked-record IDs on outlets)
// ─────────────────────────────────────────
let _mrtMapCache: Map<string, NamedSlug> | null = null;

function mapMrtStation(r: AirtableRecord<AirtableMrtStationFields>): NamedSlug | undefined {
  const f = r.fields;
  const name =
    normalizeText(f['Name']) ??
    normalizeText(f['Station']) ??
    normalizeText(f['Station Name']) ??
    normalizeText(f['MRT Station']) ??
    normalizeText(f['MRT Name']) ??
    normalizeText(f['Nearest MRT']);

  if (!name) return undefined;

  return {
    name,
    slug: normalizeText(f['Slug']) ?? stationSlugFromName(name),
    line: normalizeText(f['Line']) ?? normalizeText(f['Lines']),
  };
}

async function fetchMrtStations(): Promise<AirtableRecord<AirtableMrtStationFields>[]> {
  return fetchTable<AirtableMrtStationFields>('Stations');
}

async function getMrtMap(): Promise<Map<string, NamedSlug>> {
  if (_mrtMapCache) return _mrtMapCache;

  const map = new Map<string, NamedSlug>();

  const records = await fetchMrtStations();
  for (const r of records) {
    const station = mapMrtStation(r);
    if (!station) continue;

    map.set(r.id, station);
    map.set(station.name, station);
    map.set(station.slug, station);
  }

  _mrtMapCache = map;
  return map;
}

// ─────────────────────────────────────────
// Malls
// ─────────────────────────────────────────
let _mallMapCache: Map<string, { name: string; slug: string }> | null = null;

function mapMall(r: AirtableRecord<AirtableMallFields>): Mall | undefined {
  const f = r.fields;
  const name = normalizeText(f['Name']) ?? normalizeText(f['Mall Name']) ?? normalizeText(f['Mall / Location']);
  if (!name) return undefined;

  const imageAttachment = Array.isArray(f['Image']) ? f['Image'][0] : undefined;
  const image = f['Image URL']?.trim() || imageAttachment?.thumbnails?.large?.url || imageAttachment?.url;

  return {
    id:          r.id,
    name,
    slug:        normalizeText(f['Slug']) ?? slugify(name),
    description: f['Description'],
    image,
    published:   f['Published'] ?? true,
  } satisfies Mall;
}

async function _fetchMalls(): Promise<Mall[]> {
  const records = await fetchTable<AirtableMallFields>('Malls');

  return records
    .map(mapMall)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name)) as Mall[];
}

export function getMalls(): Promise<Mall[]> {
  return (_mallsCache ??= _fetchMalls());
}

async function getMallMap(): Promise<Map<string, { name: string; slug: string }>> {
  if (_mallMapCache) return _mallMapCache;

  const malls = await getMalls();
  const map = new Map<string, { name: string; slug: string }>();

  for (const mall of malls) {
    map.set(mall.id, { name: mall.name, slug: mall.slug });
    map.set(mall.name, { name: mall.name, slug: mall.slug });
    map.set(mall.slug, { name: mall.name, slug: mall.slug });
  }

  _mallMapCache = map;
  return map;
}

export async function getMallBySlug(slug: string): Promise<Mall | undefined> {
  const malls = await getMalls();
  return malls.find(mall => mall.slug === slug);
}

// ─────────────────────────────────────────
// Brands
// ─────────────────────────────────────────
async function _fetchBrands(): Promise<Brand[]> {
  const records = await fetchTable<AirtableBrandFields>(
    'Brands',
    '{Published} = TRUE()',
  );

  return records
    .filter(r => r.fields['Brand Name'] && r.fields['Slug'])
    .map(r => {
      const f = r.fields;
      return {
        id:           r.id,
        name:         f['Brand Name'],
        slug:         f['Slug'],
        logo:         f['Logo']?.[0]?.thumbnails?.large?.url ?? f['Logo']?.[0]?.url,
        description:  f['Description'],
        websiteUrl:   f['Website URL'],
        facebookUrl:  f['Facebook URL'],
        instagramUrl: f['Instagram URL'],
        tiktokUrl:    f['TikTok URL'],
        featured:     f['Featured'] ?? false,
        published:    f['Published'] ?? false,
      } satisfies Brand;
    });
}

export function getBrands(): Promise<Brand[]> {
  return (_brandsCache ??= _fetchBrands());
}

export async function getBrandBySlug(slug: string): Promise<Brand | undefined> {
  const records = await fetchTable<AirtableBrandFields>(
    'Brands',
    `AND({Slug} = "${slug}", {Published} = TRUE())`,
  );

  const brands = records.map(r => {
    const f = r.fields;
    return {
      id:           r.id,
      name:         f['Brand Name'],
      slug:         f['Slug'],
      logo:         f['Logo']?.[0]?.thumbnails?.large?.url ?? f['Logo']?.[0]?.url,
      description:  f['Description'],
      websiteUrl:   f['Website URL'],
      facebookUrl:  f['Facebook URL'],
      instagramUrl: f['Instagram URL'],
      tiktokUrl:    f['TikTok URL'],
      featured:     f['Featured'] ?? false,
      published:    f['Published'] ?? false,
    } satisfies Brand;
  });

  return brands[0];
}

// ─────────────────────────────────────────
// Outlets
// ─────────────────────────────────────────

// We need brand + category + town data to enrich outlets from linked records.
async function buildOutlets(
  records: AirtableRecord<AirtableOutletFields>[],
  brands: Brand[],
  drinks: Drink[],
  townMap: Map<string, NamedSlug>,
  mallMap: Map<string, NamedSlug>,
  mrtMap: Map<string, NamedSlug>,
): Promise<Outlet[]> {
  const brandMap = new Map(brands.map(b => [b.id, b]));
  const drinksByBrandId = new Map<string, Drink[]>();

  for (const drink of drinks) {
    for (const brand of drink.brands) {
      const brandDrinks = drinksByBrandId.get(brand.id) ?? [];
      brandDrinks.push(drink);
      drinksByBrandId.set(brand.id, brandDrinks);
    }
  }

  return records
    .filter(r => r.fields['Outlet Name'] && r.fields['Slug'])
    .map(r => {
      const f = r.fields;

      // Linked records
      const brandRef = f['Brand']?.[0];
      const brand    = brandRef ? brandMap.get(brandRef) : undefined;

      const brandDrinks = brand ? drinksByBrandId.get(brand.id) ?? [] : [];
      const drinkCategoryMap = new Map<string, string>();
      const drinkGroupsMap = new Map<string, { category: string; categorySlug?: string; drinks: { name: string; slug: string }[] }>();
      for (const drink of brandDrinks) {
        const category = drink.category ?? 'Other Drinks';
        const categorySlug = drink.categorySlug;
        const groupKey = categorySlug ?? category;

        if (drink.category && drink.categorySlug) drinkCategoryMap.set(drink.categorySlug, drink.category);
        const group = drinkGroupsMap.get(groupKey) ?? { category, categorySlug, drinks: [] };
        group.drinks.push({ name: drink.name, slug: drink.slug });
        drinkGroupsMap.set(groupKey, group);
      }
      const drinkGroups = Array.from(drinkGroupsMap.values())
        .map(group => ({
          ...group,
          drinks: group.drinks.sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .sort((a, b) => a.category.localeCompare(b.category));

      // Town: multipleRecordLinks → resolve via townMap
      const townId   = f['Town']?.[0];
      const townData = townId ? townMap.get(townId) : undefined;
      const town     = townData?.name ?? '';
      const townSlug = townData?.slug ?? '';

      // Mall: supports either a plain text mall name or a linked Malls record ID
      const mallRef = Array.isArray(f['Mall / Location']) ? f['Mall / Location'][0] : f['Mall / Location'];
      const mallData = mallRef ? mallMap.get(mallRef) : undefined;
      const mall = mallData?.name ?? normalizeText(f['Mall / Location']);
      const mallSlug = mallData?.slug ?? (mall ? slugify(mall) : undefined);

      // MRT: supports either a plain text station name or a linked MRT station record ID
      const mrtRef = firstLinkedValue(f['Nearest MRT']);
      const mrtData = mrtRef ? mrtMap.get(mrtRef) : undefined;
      const normalizedMrt = normalizeText(f['Nearest MRT']);
      const unresolvedMrtRecord = mrtRef ? isAirtableRecordId(mrtRef) : false;
      const nearestMrt = mrtData?.name ?? (
        normalizedMrt && !unresolvedMrtRecord && !isAirtableRecordId(normalizedMrt) ? normalizedMrt : undefined
      );
      const mrtSlug = mrtData?.slug ?? (nearestMrt ? stationSlugFromName(nearestMrt) : undefined);

      // Delivery links — stored as JSON multilineText
      let deliveryLinks;
      try {
        deliveryLinks = f['Delivery Links'] ? JSON.parse(f['Delivery Links']) : undefined;
      } catch {
        deliveryLinks = undefined;
      }

      // Gallery images — url field, may contain comma-separated URLs
      const galleryImages = f['Gallery Images URL']
        ?.split(',')
        .map(s => s.trim())
        .filter(Boolean);

      // Main image: prefer Image URL, fall back to first gallery image
      const image = f['Image URL']?.trim() || galleryImages?.[0] || undefined;
      const halal = f['Halal'] ?? (f['Halal-Friendly'] ? 'Halal-friendly' : undefined);

      return {
        id:                 r.id,
        name:               f['Outlet Name'],
        slug:               f['Slug'],
        brandId:            brand?.id ?? '',
        brandName:          brand?.name ?? '',
        brandSlug:          brand?.slug ?? '',
        brandLogo:          brand?.logo,
        town,
        townSlug,
        mall,
        mallSlug,
        address:            f['Address'],
        nearestMrt,
        mrtSlug,
        openingHours:       f['Opening Hours'],
        phone:              f['Phone'],
        googleMapsUrl:      f['Google Maps URL'],
        deliveryLinks,
        drinks:             brandDrinks.map(drink => ({ name: drink.name, slug: drink.slug })),
        popularDrinks:      brandDrinks.map(drink => drink.name),
        drinkGroups,
        drinkCategories:    Array.from(drinkCategoryMap.values()),
        drinkCategorySlugs: Array.from(drinkCategoryMap.keys()),
        priceRange:         f['Price Range'],
        halal,
        halalFriendly:      Boolean(halal),
        seatingAvailable:   f['Seating Available'] ?? false,
        image,
        galleryImages,
        featured:           f['Featured'] ?? false,
        published:          f['Published'] ?? false,
      } satisfies Outlet;
    });
}

async function _fetchOutlets(): Promise<Outlet[]> {
  const [records, brands, drinks, townMap, mallMap, mrtMap] = await Promise.all([
    fetchTable<AirtableOutletFields>('Bubble Tea Shops', '{Published} = TRUE()'),
    getBrands(),
    getDrinks(),
    getTownMap(),
    getMallMap(),
    getMrtMap(),
  ]);

  return buildOutlets(records, brands, drinks, townMap, mallMap, mrtMap);
}

export function getOutlets(): Promise<Outlet[]> {
  return (_outletsCache ??= _fetchOutlets());
}

export async function getOutletBySlug(slug: string): Promise<Outlet | undefined> {
  const [records, brands, drinks, townMap, mallMap, mrtMap] = await Promise.all([
    fetchTable<AirtableOutletFields>('Bubble Tea Shops', `AND({Slug} = "${slug}", {Published} = TRUE())`),
    getBrands(),
    getDrinks(),
    getTownMap(),
    getMallMap(),
    getMrtMap(),
  ]);

  const outlets = await buildOutlets(records, brands, drinks, townMap, mallMap, mrtMap);
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

export async function getOutletsByMall(mallSlug: string): Promise<Outlet[]> {
  const outlets = await getOutlets();
  return outlets.filter(o => o.mallSlug === mallSlug);
}

// ─────────────────────────────────────────
// Drinks
// ─────────────────────────────────────────
function mapDrink(r: AirtableRecord<AirtableDrinkFields>, brandMap: Map<string, Brand>): Drink {
  const f = r.fields;
  const imageAttachment = Array.isArray(f['Image']) ? f['Image'][0] : undefined;
  const image = imageAttachment?.thumbnails?.large?.url ?? imageAttachment?.url;
  const category = normalizeText(f['Category']);

  return {
    id:          r.id,
    name:        f['Drink Name'],
    slug:        f['Slug'],
    category,
    categorySlug: category ? slugify(category) : undefined,
    brands:      (f['Brands'] ?? [])
      .map(id => brandMap.get(id))
      .filter((brand): brand is Brand => Boolean(brand))
      .map(brand => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
      })),
    description: f['Description'],
    priceM:      f['Price (M)'],
    priceL:      f['Price (L)'],
    calories:    f['Calories (kcal)'],
    image,
    published:   f['Published'] ?? true,
  } satisfies Drink;
}

async function _fetchDrinks(): Promise<Drink[]> {
  const [records, brands] = await Promise.all([
    fetchTable<AirtableDrinkFields>('Drinks'),
    getBrands(),
  ]);

  const brandMap = new Map(brands.map(brand => [brand.id, brand]));

  return records
    .filter(r => r.fields['Drink Name'] && r.fields['Slug'])
    .map(record => mapDrink(record, brandMap))
    .filter(drink => drink.published)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getDrinks(): Promise<Drink[]> {
  return (_drinksCache ??= _fetchDrinks());
}

export async function getDrinkBySlug(slug: string): Promise<Drink | undefined> {
  const drinks = await getDrinks();
  return drinks.find(drink => drink.slug === slug);
}

export async function getDrinksByBrand(brandSlug: string): Promise<Drink[]> {
  const drinks = await getDrinks();
  return drinks.filter(drink => drink.brands.some(brand => brand.slug === brandSlug));
}

export async function getDrinksByCategory(categorySlug: string): Promise<Drink[]> {
  const drinks = await getDrinks();
  return drinks.filter(drink => drink.categorySlug === categorySlug);
}

function categoryDescription(name: string): string {
  return `Browse ${name.toLowerCase()} drinks from bubble tea brands in Singapore.`;
}

async function _fetchCategories(): Promise<DrinkCategory[]> {
  const drinks = await getDrinks();
  const categories = new Map<string, DrinkCategory>();

  for (const drink of drinks) {
    if (!drink.category || !drink.categorySlug) continue;
    if (categories.has(drink.categorySlug)) continue;

    categories.set(drink.categorySlug, {
      id: drink.categorySlug,
      name: drink.category,
      slug: drink.categorySlug,
      description: categoryDescription(drink.category),
      image: drink.image,
      published: true,
    });
  }

  return Array.from(categories.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getCategories(): Promise<DrinkCategory[]> {
  return (_categoriesCache ??= _fetchCategories());
}

export async function getCategoryBySlug(slug: string): Promise<DrinkCategory | undefined> {
  const categories = await getCategories();
  return categories.find(category => category.slug === slug);
}
