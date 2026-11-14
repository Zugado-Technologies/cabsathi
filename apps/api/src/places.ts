import { searchPlaces as searchLocal, type Place, type PlaceSuggestion } from '@cabsathi/shared';
import { env } from './env';
import { mapplsPlace, mapplsReverse, mapplsSearch } from './mappls';

const TIMEOUT_MS = 5000;
/** Bias results towards Delhi NCR. */
const NCR_BIAS = { circle: { center: { latitude: 28.58, longitude: 77.2 }, radius: 50000 } };

/**
 * Place search. Mappls Autosuggest first if its key is set. With a Google key: Places API (New) Autocomplete (pass the same
 * sessionToken to `placeDetails` so Google bills it as one session).
 * Without a key: the built-in NCR list, which already has coordinates.
 */
export async function searchPlaces(q: string, sessionToken?: string): Promise<PlaceSuggestion[]> {
  const input = q.trim();
  // No preset list: suggestions only appear once the person types.
  if (input.length < 2) return [];

  if (env.mapplsKey) {
    try {
      const found = await mapplsSearch(input, env.mapplsKey);
      if (found.length) return found;
    } catch (err) {
      console.warn('[places] Mappls search failed:', (err as Error).message);
    }
  }
  if (!env.googleMapsKey) return searchLocal(input);

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Goog-Api-Key': env.googleMapsKey },
      body: JSON.stringify({
        input,
        sessionToken,
        includedRegionCodes: ['in'],
        locationBias: NCR_BIAS,
        languageCode: 'en-IN',
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Places autocomplete ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return (data.suggestions ?? [])
      .map((s: any) => s.placePrediction)
      .filter(Boolean)
      .slice(0, 8)
      .map(
        (p: any): PlaceSuggestion => ({
          name: p.structuredFormat?.mainText?.text ?? p.text?.text,
          secondary: p.structuredFormat?.secondaryText?.text,
          placeId: p.placeId,
        }),
      );
  } catch (err) {
    console.warn('[places] Google search failed, using local list:', (err as Error).message);
    return searchLocal(input);
  }
}

/** Coordinates for a place id: `mappls:<eLoc>` or a Google place id. */
export async function placeDetails(placeId: string, sessionToken?: string): Promise<Place | null> {
  if (placeId.startsWith('mappls:')) {
    if (!env.mapplsKey) return null;
    try {
      return await mapplsPlace(placeId.slice('mappls:'.length), env.mapplsKey);
    } catch (err) {
      console.warn('[places] Mappls place lookup failed:', (err as Error).message);
      return null;
    }
  }
  if (!env.googleMapsKey) return null;
  const qs = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : '';
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}${qs}`, {
    headers: { 'X-Goog-Api-Key': env.googleMapsKey, 'X-Goog-FieldMask': 'displayName,formattedAddress,location' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    console.warn('[places] details failed:', res.status, await res.text());
    return null;
  }
  const p = await res.json();
  if (!p.location) return null;
  return {
    name: p.displayName?.text ?? p.formattedAddress ?? 'Selected place',
    lat: p.location.latitude,
    lng: p.location.longitude,
  };
}

/** Name for a point picked on the map or from the phone's location. */
export async function reversePlace(lat: number, lng: number): Promise<Place> {
  if (env.mapplsKey) {
    try {
      const r = await mapplsReverse({ lat, lng }, env.mapplsKey);
      if (r) return { name: r.name, lat, lng };
    } catch (err) {
      console.warn('[places] Mappls reverse geocode failed:', (err as Error).message);
    }
  }
  return { name: 'Pinned location', lat, lng };
}
