import type { Outlet, Town } from './types';

export function getTownsFromOutlets(outlets: Outlet[], towns: Town[] = []): Town[] {
  const townDetails = new Map(towns.map(town => [town.slug, town]));
  const townMap = new Map<string, Town>();

  for (const outlet of outlets) {
    if (!outlet.townSlug || !outlet.town) continue;
    if (townMap.has(outlet.townSlug)) continue;

    const details = townDetails.get(outlet.townSlug);
    townMap.set(outlet.townSlug, details ?? { name: outlet.town, slug: outlet.townSlug });
  }

  return Array.from(townMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}
