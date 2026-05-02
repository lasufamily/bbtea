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
  instagramUrl?: string;
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
  address: string;
  nearestMrt?: string;
  mrtSlug?: string;
  openingHours?: string;
  phone?: string;
  googleMapsUrl?: string;
  deliveryLinks?: DeliveryLink[];
  popularDrinks?: string[];
  drinkCategories?: string[];
  drinkCategorySlugs?: string[];
  priceRange?: '$' | '$$' | '$$$';
  halalFriendly: boolean;
  seatingAvailable: boolean;
  image?: string;
  galleryImages?: string[];
  featured: boolean;
  published: boolean;
}

export interface DrinkCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
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
}

export interface MrtStation {
  name: string;
  slug: string;
  line?: string;
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
  'Instagram URL'?: string;
  'Featured'?: boolean;
  'Published'?: boolean;
}

export interface AirtableOutletFields {
  'Outlet Name': string;
  'Slug': string;
  'Brand'?: string[];          // linked record IDs
  'Town': string;
  'Mall / Location'?: string;
  'Address': string;
  'Nearest MRT'?: string;
  'Opening Hours'?: string;
  'Phone'?: string;
  'Google Maps URL'?: string;
  'Delivery Links'?: string;   // JSON string
  'Popular Drinks'?: string;   // comma-separated
  'Drink Categories'?: string[];  // linked record IDs
  'Price Range'?: '$' | '$$' | '$$$';
  'Halal-Friendly'?: boolean;
  'Seating Available'?: boolean;
  'Image'?: { url: string }[];
  'Gallery Images'?: { url: string }[];
  'Featured'?: boolean;
  'Published'?: boolean;
}

export interface AirtableCategoryFields {
  'Category Name': string;
  'Slug': string;
  'Description'?: string;
  'Image'?: { url: string }[];
  'Published'?: boolean;
}
