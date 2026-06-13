import assert from 'node:assert/strict';

const {
  mapBrandRecord,
  mapCoffeeShopRecord,
  mapJuiceShopRecord,
  getAllVenueTowns,
  getAllVenueStations,
} = await import('../src/lib/airtable.ts');
const { pathSegment } = await import('../src/lib/url.ts');
const airtableSource = await import('node:fs/promises')
  .then(fs => fs.readFile(new URL('../src/lib/airtable.ts', import.meta.url), 'utf8'));

assert.equal(pathSegment('%-arabica'), '%25-arabica', 'URL paths should encode Airtable slugs with reserved characters');

const coffeeBrand = mapBrandRecord({
  id: 'brand_luckin',
  createdTime: '2026-05-25T00:00:00.000Z',
  fields: {
    'Brand Name': 'Luckin Coffee',
    Slug: 'airtable-luckin-coffee',
    'Website URL': 'https://www.luckincoffee.com/',
    Published: true,
  },
});

assert.equal(coffeeBrand?.slug, 'airtable-luckin-coffee', 'Brand slugs should come from the Airtable Slug field');
assert.equal(coffeeBrand?.published, true);

assert.equal(
  mapBrandRecord({
    id: 'brand_hidden',
    createdTime: '2026-05-25T00:00:00.000Z',
    fields: {
      'Brand Name': 'Hidden Coffee',
      Slug: 'hidden-coffee',
      Published: false,
    },
  })?.published,
  true,
  'Brands should be published by default without relying on the Airtable Published field',
);

assert.equal(
  mapBrandRecord({
    id: 'brand_without_slug',
    createdTime: '2026-05-25T00:00:00.000Z',
    fields: {
      'Brand Name': 'Brand Without Airtable Slug',
      Published: true,
    },
  }),
  undefined,
  'Published brands without Airtable slugs should not get generated fallback slugs',
);

const brandMap = new Map([
  ['brand_luckin', coffeeBrand],
]);

const townMap = new Map([
  ['town_punggol', { name: 'Punggol', slug: 'punggol' }],
]);

const mallMap = new Map([
  ['mall_waterway', { name: 'Waterway Point', slug: 'waterway-point' }],
]);

const mrtMap = new Map([
  ['mrt_punggol', { name: 'Punggol MRT', slug: 'punggol-mrt', line: 'North East' }],
]);

const coffeeOutlet = mapCoffeeShopRecord(
  {
    id: 'coffee_1',
    createdTime: '2026-05-25T00:00:00.000Z',
    fields: {
      'Outlet Name': 'Luckin Coffee Waterway Point',
      Slug: 'luckin-coffee-waterway-point',
      Brand: ['brand_luckin'],
      Town: ['town_punggol'],
      'Mall / Location': ['mall_waterway'],
      Category: 'Coffee',
      Address: '83 Punggol Central, Waterway Point, #01-K12, Singapore 828761',
      'Nearest MRT': ['mrt_punggol'],
      'Opening Hours': 'Monday 8 AM to 10 PM',
      Phone: '80696025',
      'Google Maps URL': 'https://maps.example/luckin-waterway',
      'Website URL': 'https://www.luckincoffee.com/',
      'Price Range': '$$',
      'Seating Available': true,
      'Image URL': 'https://images.example/luckin.jpg',
      'Gallery Images URL': 'https://images.example/one.jpg, https://images.example/two.jpg',
      Featured: true,
      Published: true,
    },
  },
  brandMap,
  townMap,
  mallMap,
  mrtMap,
);

assert.equal(coffeeOutlet?.type, 'coffee');
assert.equal(coffeeOutlet?.path, '/coffee-shops/luckin-coffee-waterway-point/');
assert.equal(coffeeOutlet?.brandName, 'Luckin Coffee');
assert.equal(coffeeOutlet?.town, 'Punggol');
assert.equal(coffeeOutlet?.townSlug, 'punggol');
assert.equal(coffeeOutlet?.mall, 'Waterway Point');
assert.equal(coffeeOutlet?.mallSlug, 'waterway-point');
assert.equal(coffeeOutlet?.nearestMrt, 'Punggol MRT');
assert.equal(coffeeOutlet?.mrtSlug, 'punggol-mrt');
assert.deepEqual(coffeeOutlet?.galleryImages, [
  'https://images.example/one.jpg',
  'https://images.example/two.jpg',
]);

const juiceBrand = mapBrandRecord({
  id: 'brand_boost',
  createdTime: '2026-06-14T00:00:00.000Z',
  fields: {
    'Brand Name': 'Boost Juice',
    Slug: 'boost-juice',
  },
});

const juiceOutlet = mapJuiceShopRecord(
  {
    id: 'juice_1',
    createdTime: '2026-06-14T00:00:00.000Z',
    fields: {
      'Outlet Name': 'Boost Juice Waterway Point',
      Slug: 'boost-juice-waterway-point',
      Brand: ['brand_boost'],
      Town: ['town_punggol'],
      'Mall / Location': ['mall_waterway'],
      Category: 'Juice',
      Address: '83 Punggol Central, Waterway Point, Singapore 828761',
      'Nearest MRT': ['mrt_punggol'],
      'Opening Hours': 'Monday 10 AM to 10 PM',
      'Price Range': '$$',
      'Image URL': 'https://images.example/boost.jpg',
    },
  },
  new Map([['brand_boost', juiceBrand]]),
  townMap,
  mallMap,
  mrtMap,
);

assert.equal(juiceOutlet?.type, 'juice');
assert.equal(juiceOutlet?.path, '/juice-shops/boost-juice-waterway-point/');
assert.equal(juiceOutlet?.brandName, 'Boost Juice');
assert.equal(juiceOutlet?.townSlug, 'punggol');
assert.equal(juiceOutlet?.mallSlug, 'waterway-point');

assert.deepEqual(
  mapCoffeeShopRecord(
    {
      id: 'draft',
      createdTime: '2026-05-25T00:00:00.000Z',
      fields: {
        'Outlet Name': 'Draft Coffee',
        Slug: 'draft-coffee',
        Address: 'Somewhere',
        Published: false,
      },
    },
    brandMap,
    townMap,
    mallMap,
    mrtMap,
  ),
  {
    id: 'draft',
    type: 'coffee',
    path: '/coffee-shops/draft-coffee/',
    name: 'Draft Coffee',
    slug: 'draft-coffee',
    brandId: '',
    brandName: '',
    brandSlug: '',
    brandLogo: undefined,
    town: '',
    townSlug: '',
    mall: undefined,
    mallSlug: undefined,
    category: undefined,
    streetName: undefined,
    postalCode: undefined,
    address: 'Somewhere',
    nearestMrt: undefined,
    mrtSlug: undefined,
    openingHours: undefined,
    phone: undefined,
    googleMapsUrl: undefined,
    deliveryLinks: undefined,
    websiteUrl: undefined,
    facebookUrl: undefined,
    instagramUrl: undefined,
    tiktokUrl: undefined,
    priceRange: undefined,
    halal: undefined,
    halalFriendly: false,
    seatingAvailable: false,
    image: undefined,
    galleryImages: undefined,
    featured: false,
    published: true,
  },
  'Coffee shops should be published by default without relying on the Airtable Published field',
);

assert.doesNotMatch(
  airtableSource,
  /fetchTable<Airtable(?:Outlet|CoffeeShop)Fields>\('(?:Bubble Tea Shops|Coffee Shops)'[^)]*\{Published\}/s,
  'Bubble Tea Shops and Coffee Shops fetches should not depend on a Published field',
);

assert.doesNotMatch(
  airtableSource,
  /fetchTable<AirtableBrandFields>\('Brands'[^)]*\{Published\}/s,
  'Brands fetches should not depend on a Published field',
);

const bubbleOutlet = {
  id: 'bubble_1',
  name: 'Boba Punggol',
  slug: 'boba-punggol',
  brandId: 'brand_boba',
  brandName: 'Boba Brand',
  brandSlug: 'boba-brand',
  town: 'Punggol',
  townSlug: 'punggol',
  address: '1 Punggol',
  nearestMrt: 'Punggol MRT',
  mrtSlug: 'punggol-mrt',
  halalFriendly: false,
  seatingAvailable: false,
  featured: false,
  published: true,
};

assert.deepEqual(
  getAllVenueTowns([bubbleOutlet], [coffeeOutlet], [{ name: 'Punggol', slug: 'punggol', tagline: 'Waterfront town' }]),
  [{ name: 'Punggol', slug: 'punggol', tagline: 'Waterfront town' }],
  'Town pages should include towns that have either bubble tea or coffee outlets and preserve Airtable town records',
);

assert.deepEqual(
  getAllVenueStations([bubbleOutlet], [coffeeOutlet]),
  [{ name: 'Punggol MRT', slug: 'punggol-mrt' }],
  'Station pages should dedupe stations across bubble tea and coffee outlets',
);

console.log('coffee shop helpers ok');
