import type { LatLng, Place, PlaceSuggestion } from '@cabsathi/shared';
import { env } from './env';

/**
 * Mappls (MapmyIndia) REST calls. One static key is passed as `access_token`.
 * Endpoints used: Autosuggest, Route ETA (traffic) / Route ADV (no traffic),
 * Distance Matrix ETA, Place Detail.
 */
const TIMEOUT_MS = 5000;
const SEARCH = 'https://search.mappls.com/search';
const ROUTE = 'https://route.mappls.com/route';
const PLACE = 'https://place.mappls.com/O2O/entity';
/** Delhi NCR centre, to rank nearby places first. */
const NCR_CENTRE = '28.58,77.2';
/** Any fixed road point, used to snap a place code to coordinates. */
const SNAP_TARGET = '77.2090,28.6139';

export type MapplsRoute = { distanceKm: number; durationMin: number; polyline: string | null };

async function get(url: string, key: string) {
  const sep = url.includes('?') ? '&' : '?';
  const res = await fetch(`${url}${sep}access_token=${key}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  // Never log the URL: it carries the key.
  if (!res.ok) throw new Error(`Mappls ${new URL(url).pathname} → HTTP ${res.status}`);
  return res.json();
}

const coords = (points: LatLng[]) => points.map((p) => `${p.lng},${p.lat}`).join(';');

export async function mapplsSearch(q: string, key: string): Promise<PlaceSuggestion[]> {
  const data = await get(
    `${SEARCH}/places/autosuggest/json?query=${encodeURIComponent(q)}&location=${NCR_CENTRE}&region=IND`,
    key,
  );
  return (data.suggestedLocations ?? [])
    .filter((s: any) => s.eLoc)
    .slice(0, 8)
    .map(
      (s: any): PlaceSuggestion => ({
        name: s.placeName,
        secondary: s.placeAddress,
        placeId: `mappls:${s.eLoc}`,
      }),
    );
}

/**
 * Coordinates for a Mappls place code (eLoc). Place Detail returns only the
 * name, so the point comes from the route API, which snaps the code to the road.
 */
export async function mapplsPlace(eLoc: string, key: string): Promise<Place | null> {
  const [detail, route] = await Promise.all([
    get(`${PLACE}/place-details/${encodeURIComponent(eLoc)}`, key).catch(() => null),
    get(`${ROUTE}/direction/route_adv/driving/${encodeURIComponent(eLoc)};${SNAP_TARGET}?overview=false&steps=false`, key),
  ]);
  const location = route.waypoints?.[0]?.location;
  if (!Array.isArray(location)) return null;
  return { name: detail?.name ?? 'Selected place', lat: location[1], lng: location[0] };
}

/** Road route with live traffic, falling back to the no-traffic route. */
export async function mapplsRoute(from: LatLng, to: LatLng, key: string): Promise<MapplsRoute> {
  const path = `driving/${coords([from, to])}?geometries=polyline&overview=full&steps=false`;
  let data: any;
  try {
    data = await get(`${ROUTE}/direction/route_eta/${path}`, key);
  } catch {
    data = await get(`${ROUTE}/direction/route_adv/${path}`, key);
  }
  const route = data.routes?.[0];
  if (!route) throw new Error('Mappls returned no route');
  return { distanceKm: route.distance / 1000, durationMin: route.duration / 60, polyline: route.geometry ?? null };
}

/** Road km between every pair of points (traffic-aware), as matrix[from][to]. */
export async function mapplsMatrixKm(points: LatLng[], key: string): Promise<number[][]> {
  const data = await get(
    `${ROUTE}/dm/distance_matrix_eta/driving/${coords(points)}?sources=all&destinations=all`,
    key,
  );
  const distances = data.results?.distances;
  if (!Array.isArray(distances) || distances.length !== points.length) throw new Error('Mappls matrix incomplete');
  return distances.map((row: number[]) => row.map((m) => m / 1000));
}

export const mapplsKey = () => env.mapplsKey;
