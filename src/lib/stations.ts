import type { MrtStation, Outlet } from './types';

export function getStationsFromOutlets(outlets: Outlet[]): MrtStation[] {
  const stationMap = new Map<string, MrtStation>();

  for (const outlet of outlets) {
    if (!outlet.mrtSlug || !outlet.nearestMrt) continue;
    if (stationMap.has(outlet.mrtSlug)) continue;

    stationMap.set(outlet.mrtSlug, {
      name: outlet.nearestMrt,
      slug: outlet.mrtSlug,
    });
  }

  return Array.from(stationMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}
