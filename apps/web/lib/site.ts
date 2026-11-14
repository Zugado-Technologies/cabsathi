export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const SITE_NAME = 'CabSathi';
export const SITE_TAGLINE = 'Share your cab, split the fare';
export const SITE_DESCRIPTION =
  'CabSathi helps people in Delhi NCR find others going the same way, share one cab and split the fare. Free to use, with matching by route and time.';

/** Browser key for the Google Maps JavaScript API. Empty = simple drawn route preview. */
export const GOOGLE_MAPS_BROWSER_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
/** Map ID for advanced markers; 'DEMO_MAP_ID' works for development. */
export const GOOGLE_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? 'DEMO_MAP_ID';
