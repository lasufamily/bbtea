// ─────────────────────────────────────────
// Core domain types
// ─────────────────────────────────────────

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  websiteUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  featured: boolean;
  published: boolean;
}

export interface Outlet {
  id: string;
  name: string;
  slug: string;
  brandId: string;
  brandName: string;
  brandSlug: string;
  brandLogo?: string;
  town: string;
  townSlug: string;
  mall?: string;
  mallSlug?: string;
  address: string;
  nearestMrt?: string;
  mrtSlug?: string;
  openingHours?: string;
  phone?: string;
  googleMapsUrl?: string;
  deliveryLinks?: DeliveryLink[];
  drinks?: Pick<Drink, 'name' | 'slug'>[];
  popularDrinks?: string[];
  drinkGroups?: OutletDrinkGroup[];
  drinkCategories?: string[];
  drinkCategorySlugs?: string[];
  priceRange?: '$' | '$$' | '$$$';
  halal?: HalalStatus;
  halalFriendly: boolean;
  seatingAvailable: boolean;
  image?: string;
  galleryImages?: string[];
  featured: boolean;
  published: boolean;
}

export type VenueType = 'bubble-tea' | 'coffee';

export interface CoffeeOutlet {
  id: string;
  type: 'coffee';
  path: string;
  name: string;
  slug: string;
  brandId: string;
  brandName: string;
  brandSlug: string;
  brandLogo?: string;
  town: string;
  townSlug: string;
  mall?: string;
  mallSlug?: string;
  category?: string;
  streetName?: string;
  postalCode?: string;
  address: string;
  nearestMrt?: string;
  mrtSlug?: string;
  openingHours?: string;
  phone?: string;
  googleMapsUrl?: string;
  deliveryLinks?: DeliveryLink[];
  websiteUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  priceRange?: '$' | '$$' | '$$$';
  halal?: HalalStatus;
  halalFriendly: boolean;
  seatingAvailable: boolean;
  image?: string;
  galleryImages?: string[];
  featured: boolean;
  published: boolean;
}

export type VenueOutlet = Outlet | CoffeeOutlet;

export type HalalStatus = 'Halal-certified' | 'Halal-friendly' | 'Muslim-owned';

export interface OutletDrinkGroup {
  category: string;
  categorySlug?: string;
  drinks: Pick<Drink, 'name' | 'slug'>[];
}

export interface DrinkCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  published: boolean;
}

export interface DrinkBrand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface Drink {
  id: string;
  name: string;
  slug: string;
  category?: string;
  categorySlug?: string;
  brands: DrinkBrand[];
  description?: string;
  priceM?: number;
  priceL?: number;
  priceOneLitre?: number;
  calories?: string;
  caloriesPer100ml?: string;
  caloriesM?: string;
  caloriesL?: string;
  nutriGrade?: string;
  healthierChoice: boolean;
  healthierChoiceType?: string;
  image?: string;
  published: boolean;
}

export interface DeliveryLink {
  platform: string;
  url: string;
}

export interface Town {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  region?: string;
  planningArea?: string;
  tagline?: string;
  knownFor?: string[];
  establishedYear?: number;
  population?: number;
  famousHawkerCentres?: string;
  michelinRecommendedStalls?: string;
  lateNightFoodSpots?: string;
  foodSceneVibe?: string;
  topLandmarks?: string;
  parksAndGreenSpaces?: string;
  heritageSites?: string;
  mallsAndShopping?: string;
  religiousBuildings?: string;
  sportsAndRecreation?: string;
  neighbourhoodVibe?: string;
  artsAndCulture?: string;
  annualEventsAndFestivals?: string;
  nightlife?: string;
  localTips?: string;
  notableSchools?: string;
  hospitalsAndPolyclinics?: string;
  supermarketsAndWetMarkets?: string;
  mrtLines?: string[];
  keyMrtStations?: string;
  dedicatedBusInterchange?: string;
  expresswayAccess?: string;
  travelTimeToCbd?: string;
  parkingAvailability?: string;
}

export interface Mall {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  published: boolean;
}

export interface MrtStation {
  name: string;
  slug: string;
  line?: string;
}

export interface ReviewPhoto {
  label: 'Cup' | 'Shop' | 'Receipt';
  url: string;
  filename?: string;
  width?: number;
  height?: number;
}

export interface Review {
  id: string;
  slug: string;
  article: string;
  drinkName?: string;
  brand?: string;
  outletLocation?: string;
  size?: string;
  sugarLevel?: string;
  toppingName?: string;
  price?: number;
  promoUsed?: string;
  dateOfPurchase?: string;
  waitBeforeOrderMinutes?: number;
  waitToCollectionMinutes?: number;
  teaCoffeeStrength?: string;
  milkBalance?: string;
  sweetness?: string;
  authenticity?: string;
  toppingTexture?: string;
  staffFriendliness?: string;
  bestThing?: string;
  areasForImprovement?: string;
  reviewerName?: string;
  reviewerEmail?: string;
  photos: ReviewPhoto[];
  createdTime: string;
}

// ─────────────────────────────────────────
// Airtable raw record shape
// ─────────────────────────────────────────

export interface AirtableRecord<T> {
  id: string;
  fields: T;
  createdTime: string;
}

export interface AirtableResponse<T> {
  records: AirtableRecord<T>[];
  offset?: string;
}

export interface AirtableBrandFields {
  'Brand Name': string;
  'Slug': string;
  'Logo'?: { url: string; thumbnails?: { large?: { url: string } } }[];
  'Description'?: string;
  'Website URL'?: string;
  'Facebook URL'?: string;
  'Instagram URL'?: string;
  'TikTok URL'?: string;
  'Featured'?: boolean;
  'Published'?: boolean;
}

export interface AirtableOutletFields {
  'Outlet Name': string;
  'Slug': string;
  'Brand'?: string[];           // linked record IDs → Brands table
  'Town'?: string[];            // linked record IDs → Towns table
  'Mall / Location'?: string | string[];
  'Street'?: string;
  'Address': string;
  'Nearest MRT'?: string | string[];
  'Opening Hours'?: string;
  'Phone'?: string;
  'Google Maps URL'?: string;
  'Delivery Links'?: string;    // JSON string (multilineText)
  'Drinks'?: string;            // multilineText — popular/menu drinks (comma-separated)
  'Drink Categories'?: string[]; // linked record IDs → Drinks table
  'Price Range'?: '$' | '$$' | '$$$';
  'Halal'?: HalalStatus;
  'Halal-Friendly'?: boolean;
  'Seating Available'?: boolean;
  'Image URL'?: string;         // url field
  'Gallery Images URL'?: string; // url field (comma-separated for multiple)
  'Featured'?: boolean;
  'Published'?: boolean;
}

export interface AirtableCoffeeShopFields {
  'Outlet Name': string;
  'Slug': string;
  'Brand'?: string[];
  'Town'?: string | string[];
  'Mall / Location'?: string | string[];
  'Category'?: string;
  'Street Name'?: string;
  'Postal Code'?: string;
  'Address': string;
  'Nearest MRT'?: string | string[];
  'Opening Hours'?: string;
  'Phone'?: string;
  'Google Maps URL'?: string;
  'Delivery Links'?: string;
  'Website URL'?: string;
  'Facebook URL'?: string;
  'Instagram URL'?: string;
  'TikTok URL'?: string;
  'Price Range'?: '$' | '$$' | '$$$';
  'Halal'?: HalalStatus;
  'Seating Available'?: boolean;
  'Image URL'?: string;
  'Gallery Images URL'?: string;
  'Featured'?: boolean;
  'Published'?: boolean;
}

export interface AirtableDrinkFields {
  'Drink Name': string;
  'Category'?: string;
  'Slug': string;
  'Brands'?: string[];          // linked record IDs → Brands table
  'Description'?: string;
  'Price (M)'?: number;
  'Price (L)'?: number;
  'Retail Price (M)'?: number;
  'Retail Price (L)'?: number;
  'Retail Price (1 litre)'?: number;
  'Calories (kcal)'?: string;
  'Calories per 100ml (kcal)'?: string;
  'Calories per M cup (kcal)'?: string;
  'Calories per L cup (kcal)'?: string;
  'Nutri-Grade'?: string;
  'Healthier Choice'?: boolean;
  'Healthier Choice Type'?: string;
  'Image'?: { url: string; thumbnails?: { large?: { url: string } } }[]; // multipleAttachments
  'Published'?: boolean;
}

export interface AirtableTownFields {
  'Name'?: string;
  'Town Name'?: string;
  'Slug'?: string;
  'Description'?: string;
  'Region'?: string;
  'Planning Area'?: string;
  'Town Description'?: string;
  'Town Tagline'?: string;
  'Known For'?: string[];
  'Established Year'?: number;
  'Population'?: number;
  'Famous Hawker Centres'?: string;
  'Michelin-Recommended Stalls'?: string;
  'Late-Night Food Spots'?: string;
  'Food Scene Vibe'?: string;
  'Top Landmarks'?: string;
  'Parks and Green Spaces'?: string;
  'Heritage Sites'?: string;
  'Malls and Shopping'?: string;
  'Religious Buildings'?: string;
  'Sports and Recreation'?: string;
  'Neighbourhood Vibe'?: string;
  'Arts and Culture'?: string;
  'Annual Events and Festivals'?: string;
  'Nightlife'?: string;
  'Local Tips'?: string;
  'Notable Schools'?: string;
  'Hospitals and Polyclinics'?: string;
  'Supermarkets and Wet Markets'?: string;
  'MRT Lines'?: string[];
  'Key MRT Stations'?: string;
  'Dedicated Bus Interchange'?: string;
  'Expressway Access'?: string;
  'Travel Time to CBD'?: string;
  'Parking Availability'?: string;
}

export interface AirtableMrtStationFields {
  'Name'?: string;
  'Station'?: string;
  'Station Name'?: string;
  'MRT Station'?: string;
  'MRT Name'?: string;
  'Nearest MRT'?: string;
  'Slug'?: string;
  'Line'?: string;
  'Lines'?: string;
}

export interface AirtableMallFields {
  'Name'?: string;
  'Mall Name'?: string;
  'Mall / Location'?: string;
  'Slug'?: string;
  'Description'?: string;
  'Image'?: { url: string; thumbnails?: { large?: { url: string } } }[];
  'Image URL'?: string;
  'Published'?: boolean;
}

export interface AirtableAttachment {
  id: string;
  url: string;
  filename?: string;
  width?: number;
  height?: number;
  type?: string;
  thumbnails?: {
    large?: { url: string; width?: number; height?: number };
  };
}

export interface AirtableReviewFields {
  'Drink Name'?: string;
  'Brand'?: string;
  'Outlet Location'?: string;
  'Slug'?: string;
  'Article'?: string;
  'Status'?: string;
  'Size'?: string;
  'Sugar Level'?: string;
  'Topping Name'?: string;
  'Price'?: number;
  'Promo Used'?: string;
  'Date of Purchase'?: string;
  'Wait time before making order (minutes)'?: number;
  'Wait time from order to collection (minutes)'?: number;
  'Tea/Coffee Strength'?: string;
  'Milk Balance'?: string;
  'Sweetness'?: string;
  'Aunthenticity'?: string;
  'Topping Texture'?: string;
  'Staff Friendliness'?: string;
  'The best thing about my purchase'?: string;
  'Areas for Improvement'?: string;
  'Reviewer Name'?: string;
  'Reviewer Email'?: string;
  'Photo of Cup'?: AirtableAttachment[];
  'Photo of Shop'?: AirtableAttachment[];
  'Photo of Receipt'?: AirtableAttachment[];
}
