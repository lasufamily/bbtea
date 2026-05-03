import type { Town, MrtStation } from './types';

// ─────────────────────────────────────────
// Towns & MRT
// (Static geography data — not in Airtable)
// ─────────────────────────────────────────

export const TOWNS: Town[] = [
  { name: 'Orchard',     slug: 'orchard',     description: 'Singapore\'s premier shopping belt, home to flagship bubble tea chains and trendy cafés.' },
  { name: 'Bugis',       slug: 'bugis',        description: 'A vibrant mix of heritage streets and modern malls — perfect for an afternoon boba crawl.' },
  { name: 'Chinatown',   slug: 'chinatown',    description: 'Historic shophouses meet artisanal tea culture in this beloved cultural enclave.' },
  { name: 'Tampines',    slug: 'tampines',     description: 'East Singapore\'s go-to hub, packed with popular bubble tea outlets in Century Square and Tampines Mall.' },
  { name: 'Woodlands',   slug: 'woodlands',    description: 'North Singapore\'s largest new town with a growing boba scene centred around Causeway Point.' },
  { name: 'Jurong East', slug: 'jurong-east',  description: 'The western hub anchored by Westgate and JEM, hosting a dense cluster of top tea brands.' },
  { name: 'Bedok',       slug: 'bedok',        description: 'A beloved heartland town where long queues for quality boba are practically a rite of passage.' },
  { name: 'Punggol',     slug: 'punggol',      description: 'Singapore\'s youngest eco-town, with a fast-growing food & beverage landscape by Waterway Point.' },
  { name: 'Ang Mo Kio',  slug: 'ang-mo-kio',   description: 'A classic HDB heartland town with a loyal local boba crowd and family-friendly tea haunts.' },
  { name: 'Bishan',      slug: 'bishan',       description: 'A central, well-connected neighbourhood — Junction 8 is the social hub for tea lovers.' },
  { name: 'Clementi',    slug: 'clementi',     description: 'Home to NUS students and young families who keep the bubble tea queues lively all day long.' },
  { name: 'Serangoon',   slug: 'serangoon',    description: 'NEX mall and the nearby Chomp Chomp area make Serangoon a popular boba destination.' },
  { name: 'Toa Payoh',   slug: 'toa-payoh',    description: 'One of Singapore\'s oldest estates, with an eclectic old-meets-new tea café culture.' },
];

export const MRT_STATIONS: MrtStation[] = [
  { name: 'Orchard',        slug: 'orchard-mrt',        line: 'North-South' },
  { name: 'Bugis',          slug: 'bugis-mrt',           line: 'East-West / Downtown' },
  { name: 'Chinatown',      slug: 'chinatown-mrt',       line: 'Downtown / North-East' },
  { name: 'Tampines',       slug: 'tampines-mrt',        line: 'East-West' },
  { name: 'Woodlands',      slug: 'woodlands-mrt',       line: 'North-South' },
  { name: 'Jurong East',    slug: 'jurong-east-mrt',     line: 'East-West / North-South' },
  { name: 'Bedok',          slug: 'bedok-mrt',           line: 'East-West' },
  { name: 'Punggol',        slug: 'punggol-mrt',         line: 'North-East' },
  { name: 'Ang Mo Kio',     slug: 'ang-mo-kio-mrt',      line: 'North-South' },
  { name: 'Bishan',         slug: 'bishan-mrt',          line: 'North-South / Circle' },
  { name: 'Clementi',       slug: 'clementi-mrt',        line: 'East-West' },
  { name: 'Serangoon',      slug: 'serangoon-mrt',       line: 'North-East / Circle' },
  { name: 'Toa Payoh',      slug: 'toa-payoh-mrt',       line: 'North-South' },
  { name: 'Dhoby Ghaut',    slug: 'dhoby-ghaut-mrt',     line: 'North-South / North-East / Circle' },
  { name: 'Somerset',       slug: 'somerset-mrt',        line: 'North-South' },
  { name: 'City Hall',      slug: 'city-hall-mrt',       line: 'North-South / East-West' },
];

// ─────────────────────────────────────────
// Helper: slugify
// ─────────────────────────────────────────
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
