import type { Brand, Drink, Faq, VenueOutlet } from './types';
import { pathSegment } from './url';

export type InternalLink = {
  href: string;
  label: string;
  count?: number;
};

type LinkSeed = {
  slug?: string;
  label?: string;
  href: (slug: string) => string;
};

function compactText(value: string | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function normalizeMatchText(value: string | undefined): string {
  return compactText(value).replace(/[^a-z0-9]+/g, ' ').trim();
}

function rankedLinks(seeds: LinkSeed[], limit: number): InternalLink[] {
  const counts = new Map<string, InternalLink>();

  for (const seed of seeds) {
    if (!seed.slug || !seed.label) continue;

    const current = counts.get(seed.slug);
    counts.set(seed.slug, {
      href: seed.href(seed.slug),
      label: seed.label,
      count: (current?.count ?? 0) + 1,
    });
  }

  return Array.from(counts.values())
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0) || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export function topBrandLinks(outlets: VenueOutlet[], limit = 8): InternalLink[] {
  return rankedLinks(
    outlets.map(outlet => ({
      slug: outlet.brandSlug,
      label: outlet.brandName,
      href: slug => `/brands/${pathSegment(slug)}/`,
    })),
    limit,
  );
}

export function topTownLinks(outlets: VenueOutlet[], limit = 8): InternalLink[] {
  return rankedLinks(
    outlets.map(outlet => ({
      slug: outlet.townSlug,
      label: outlet.town,
      href: slug => `/towns/${pathSegment(slug)}/`,
    })),
    limit,
  );
}

export function topMallLinks(outlets: VenueOutlet[], limit = 8): InternalLink[] {
  return rankedLinks(
    outlets.map(outlet => ({
      slug: outlet.mallSlug,
      label: outlet.mall,
      href: slug => `/malls/${pathSegment(slug)}/`,
    })),
    limit,
  );
}

export function topStationLinks(outlets: VenueOutlet[], limit = 8): InternalLink[] {
  return rankedLinks(
    outlets.map(outlet => ({
      slug: outlet.mrtSlug,
      label: outlet.nearestMrt,
      href: slug => `/stations/${pathSegment(slug)}/`,
    })),
    limit,
  );
}

export function menuLinksForBrands(brands: Pick<Brand, 'name' | 'slug'>[], limit = 6): InternalLink[] {
  return brands
    .filter(brand => brand.slug && brand.name)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(brand => ({
      href: `/menus/${pathSegment(brand.slug)}/`,
      label: `${brand.name} menu`,
    }));
}

export function relatedFaqLinks(faqs: Faq[], currentSlug: string, limit = 6): InternalLink[] {
  return faqs
    .filter(faq => faq.slug !== currentSlug)
    .sort((a, b) => a.question.localeCompare(b.question))
    .slice(0, limit)
    .map(faq => ({
      href: `/faq/${pathSegment(faq.slug)}/`,
      label: faq.question,
    }));
}

export function reviewEntityLinks({
  reviewBrand,
  reviewDrink,
  reviewOutlet,
  brands,
  drinks,
  outlets,
  menuBrandSlugs = new Set(),
}: {
  reviewBrand?: string;
  reviewDrink?: string;
  reviewOutlet?: string;
  brands: Pick<Brand, 'name' | 'slug'>[];
  drinks: Pick<Drink, 'name' | 'slug'>[];
  outlets: VenueOutlet[];
  menuBrandSlugs?: Set<string>;
}): InternalLink[] {
  const links: InternalLink[] = [];
  const brandMatchText = normalizeMatchText(reviewBrand);
  const drinkMatchText = normalizeMatchText(reviewDrink);
  const outletMatchText = normalizeMatchText(reviewOutlet);

  const brand = brands.find(item => normalizeMatchText(item.name) === brandMatchText);
  if (brand) {
    links.push({ href: `/brands/${pathSegment(brand.slug)}/`, label: `${brand.name} outlets` });
    if (menuBrandSlugs.has(brand.slug)) {
      links.push({ href: `/menus/${pathSegment(brand.slug)}/`, label: `${brand.name} menu` });
    }
  }

  const drink = drinks.find(item => normalizeMatchText(item.name) === drinkMatchText);
  if (drink) links.push({ href: `/drinks/${pathSegment(drink.slug)}/`, label: drink.name });

  const outlet = outlets.find(item => {
    const name = normalizeMatchText(item.name);
    return outletMatchText && (name === outletMatchText || outletMatchText.includes(name));
  });
  if (outlet) {
    const href = 'path' in outlet ? outlet.path : `/bubble-tea-shops/${pathSegment(outlet.slug)}/`;
    links.push({ href, label: outlet.name });
  }

  return links.filter((link, index, all) => (
    all.findIndex(candidate => candidate.href === link.href) === index
  ));
}
