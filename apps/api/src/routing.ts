import {
  estimateMinutes,
  estimateRoadKm,
  estimateSoloFare,
  round,
  type LatLng,
  type RideEstimate,
} from '@cabsathi/shared';
import { env } from './env';
import { mapplsRoute } from './mappls';

type Route = { distanceKm: number; durationMin: number; polyline: string | null };

const TIMEOUT_MS = 5000;

/** Google Routes API: real road distance and time with traffic. */
async function googleRoute(from: LatLng, to: LatLng, key: string): Promise<Route> {
  const point = (p: LatLng) => ({ location: { latLng: { latitude: p.lat, longitude: p.lng } } });
  const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
    },
    body: JSON.stringify({
      origin: point(from),
      destination: point(to),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      regionCode: 'IN',
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Google Routes ${res.status}: ${await res.text()}`);
  const route = (await res.json()).routes?.[0];
  if (!route) throw new Error('Google Routes returned no route');
  return {
    distanceKm: route.distanceMeters / 1000,
    durationMin: parseInt(route.duration, 10) / 60,
    polyline: route.polyline?.encodedPolyline ?? null,
  };
}

/** Our own OSRM server (OpenStreetMap): free, no traffic. */
async function osrmRoute(from: LatLng, to: LatLng, baseUrl: string): Promise<Route> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const res = await fetch(`${baseUrl}/route/v1/driving/${coords}?overview=full&geometries=polyline`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const route = (await res.json()).routes?.[0];
  if (!route) throw new Error('OSRM returned no route');
  // OSRM's free-flow times are optimistic for NCR traffic.
  return { distanceKm: route.distance / 1000, durationMin: (route.duration / 60) * 1.4, polyline: route.geometry };
}

/**
 * Trip distance and time: Mappls, then Google, then our OSRM server (whichever is set),
 * else an estimate from straight-line distance. Falls back if a service fails.
 */
export async function estimateTrip(from: LatLng, to: LatLng): Promise<RideEstimate> {
  const tries: [RideEstimate['source'], () => Promise<Route>][] = [];
  if (env.mapplsKey) tries.push(['mappls', () => mapplsRoute(from, to, env.mapplsKey!)]);
  if (env.googleMapsKey) tries.push(['google', () => googleRoute(from, to, env.googleMapsKey!)]);
  if (env.osrmUrl) tries.push(['osrm', () => osrmRoute(from, to, env.osrmUrl!)]);

  for (const [source, get] of tries) {
    try {
      const r = await get();
      const distanceKm = round(r.distanceKm);
      return {
        distanceKm,
        durationMin: Math.max(1, Math.round(r.durationMin)),
        soloFare: estimateSoloFare(distanceKm),
        polyline: r.polyline,
        source,
      };
    } catch (err) {
      console.warn(`[routing] ${source} failed, trying next:`, (err as Error).message);
    }
  }

  const distanceKm = round(estimateRoadKm(from, to));
  return {
    distanceKm,
    durationMin: Math.max(1, Math.round(estimateMinutes(distanceKm))),
    soloFare: estimateSoloFare(distanceKm),
    polyline: null,
    source: 'estimate',
  };
}
