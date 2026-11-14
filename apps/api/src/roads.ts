import { estimateRoadKm, type DistanceFn, type LatLng } from '@cabsathi/shared';
import { env } from './env';
import { mapplsMatrixKm } from './mappls';

/**
 * Road distances between stops for matching and trip planning.
 * With a Mappls key: one Distance Matrix call per set of points, cached so the
 * 15-second refresh on the Matches page doesn't call Mappls again.
 * Without a key, or if Mappls fails: the straight-line estimate.
 */
const TTL_MS = 6 * 60 * 60_000;
const MAX_ENTRIES = 20_000;
const cache = new Map<string, { km: number; at: number }>();

const pointKey = (p: LatLng) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
const pairKey = (a: LatLng, b: LatLng) => `${pointKey(a)}>${pointKey(b)}`;

function cached(a: LatLng, b: LatLng): number | undefined {
  const hit = cache.get(pairKey(a, b));
  if (!hit) return undefined;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(pairKey(a, b));
    return undefined;
  }
  return hit.km;
}

function remember(a: LatLng, b: LatLng, km: number) {
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value!);
  cache.set(pairKey(a, b), { km, at: Date.now() });
}

export async function roadDistanceFn(points: LatLng[]): Promise<DistanceFn> {
  const unique = [...new Map(points.map((p) => [pointKey(p), p])).values()];
  const lookup: DistanceFn = (a, b) => (pointKey(a) === pointKey(b) ? 0 : (cached(a, b) ?? estimateRoadKm(a, b)));

  const missing = unique.some((a) => unique.some((b) => a !== b && cached(a, b) === undefined));
  if (!env.mapplsKey || !missing || unique.length < 2) return lookup;

  try {
    const km = await mapplsMatrixKm(unique, env.mapplsKey);
    unique.forEach((a, i) => unique.forEach((b, j) => i !== j && remember(a, b, km[i][j])));
  } catch (err) {
    console.warn('[roads] Mappls matrix failed, using estimate:', (err as Error).message);
  }
  return lookup;
}
