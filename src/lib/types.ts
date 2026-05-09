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
  'Halal-Friendly'?: boolean;
  'Seating Available'?: boolean;
  'Image URL'?: string;         // url field
  'Gallery Images URL'?: string; // url field (comma-separated for multiple)
  'Featured'?: boolean;
  'Published'?: boolean;
}

export interface AirtableCategoryFields {
  'Drink Name': string;         // primary field in Drinks table
  'Slug': string;
  'Description'?: string;
  'Image'?: { url: string; thumbnails?: { large?: { url: string } } }[]; // multipleAttachments
  'Published'?: boolean;
}

export interface AirtableTownFields {
  'Name': string;
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
