import {
  NCR_PLACES,
  estimateMinutes,
  estimateRoadKm,
  estimateSoloFare,
  haversineKm,
  type Place,
} from '@cabsathi/shared';

/** Popular commute corridors, each with its own SEO page at /cab-sharing/[slug]. */
interface Corridor {
  slug: string;
  fromArea: string;
  toArea: string;
  from: string;
  to: string;
  blurb: string;
}

const CORRIDORS: Corridor[] = [
  {
    slug: 'noida-to-gurgaon',
    fromArea: 'Noida',
    toArea: 'Gurgaon',
    from: 'Sector 62, Noida',
    to: 'Cyber Hub, Gurgaon',
    blurb:
      'One of the longest and costliest daily commutes in NCR. Most riders cross via the DND or Mahamaya flyover towards NH-48, so people leaving Noida for Cyber City, Udyog Vihar and Golf Course Road often share most of the route.',
  },
  {
    slug: 'gurgaon-to-noida',
    fromArea: 'Gurgaon',
    toArea: 'Noida',
    from: 'Cyber Hub, Gurgaon',
    to: 'Sector 62, Noida',
    blurb:
      'The evening return from Gurgaon offices to Noida. Leaving times bunch up around 6 to 8 PM, which makes it easier to find someone heading the same way.',
  },
  {
    slug: 'ghaziabad-to-noida',
    fromArea: 'Ghaziabad',
    toArea: 'Noida',
    from: 'Indirapuram, Ghaziabad',
    to: 'Sector 62, Noida',
    blurb:
      'A short but busy hop from Indirapuram, Vaishali and Raj Nagar to the Sector 62 and Sector 63 office belt.',
  },
  {
    slug: 'noida-to-delhi',
    fromArea: 'Noida',
    toArea: 'Delhi',
    from: 'Sector 18, Noida',
    to: 'Connaught Place, Delhi',
    blurb:
      'Noida to central Delhi via the DND or Akshardham. Popular with people working around Connaught Place, Barakhamba Road and ITO.',
  },
  {
    slug: 'delhi-to-gurgaon',
    fromArea: 'Delhi',
    toArea: 'Gurgaon',
    from: 'Saket, Delhi',
    to: 'Cyber Hub, Gurgaon',
    blurb:
      'South Delhi to Gurgaon over MG Road or NH-48. Riders from Saket, Malviya Nagar and Hauz Khas often head to the same Cyber City towers.',
  },
  {
    slug: 'dwarka-to-gurgaon',
    fromArea: 'Dwarka',
    toArea: 'Gurgaon',
    from: 'Dwarka Sector 21, Delhi',
    to: 'DLF Cyber City, Gurgaon',
    blurb: 'A quick cross-over from Dwarka to Gurgaon via the Dwarka Expressway or NH-48.',
  },
  {
    slug: 'delhi-airport-to-gurgaon',
    fromArea: 'Delhi Airport',
    toArea: 'Gurgaon',
    from: 'IGI Airport T3, Delhi',
    to: 'Cyber Hub, Gurgaon',
    blurb:
      'Landing at T3 and heading to Gurgaon? Flights land in waves, so other travellers are often going the same way at the same time.',
  },
  {
    slug: 'greater-noida-to-noida',
    fromArea: 'Greater Noida',
    toArea: 'Noida',
    from: 'Pari Chowk, Greater Noida',
    to: 'Sector 62, Noida',
    blurb: 'Along the Noida–Greater Noida Expressway, from Pari Chowk and Knowledge Park to the Noida office sectors.',
  },
  {
    slug: 'faridabad-to-delhi',
    fromArea: 'Faridabad',
    toArea: 'Delhi',
    from: 'Faridabad Sector 15',
    to: 'Nehru Place, Delhi',
    blurb: 'Faridabad to South Delhi along Mathura Road, popular with people working around Nehru Place and Okhla.',
  },
];

const place = (name: string): Place => {
  const p = NCR_PLACES.find((x) => x.name === name);
  if (!p) throw new Error(`Unknown place ${name}`);
  return p;
};

/** Places within `km` of a point, nearest first (excluding the point itself). */
function nearby(p: Place, km: number, limit = 4) {
  return NCR_PLACES.filter((x) => x.name !== p.name)
    .map((x) => ({ x, d: haversineKm(p, x) }))
    .filter(({ d }) => d <= km)
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map(({ x }) => x.name);
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export interface RoutePage extends Corridor {
  fromPlace: Place;
  toPlace: Place;
  distanceKm: number;
  minutes: number;
  soloFare: number;
  sharedFareEach: number;
  savingPct: number;
  pickupsNear: string[];
  dropsNear: string[];
}

export function routePage(c: Corridor): RoutePage {
  const fromPlace = place(c.from);
  const toPlace = place(c.to);
  const distanceKm = Math.round(estimateRoadKm(fromPlace, toPlace));
  const soloFare = roundTo(estimateSoloFare(distanceKm), 10);
  // Two people sharing almost the whole trip pay a little over half each.
  const sharedFareEach = roundTo(soloFare * 0.55, 10);
  return {
    ...c,
    fromPlace,
    toPlace,
    distanceKm,
    minutes: roundTo(estimateMinutes(distanceKm), 5),
    soloFare,
    sharedFareEach,
    savingPct: Math.round((1 - sharedFareEach / soloFare) * 100),
    pickupsNear: nearby(fromPlace, 8),
    dropsNear: nearby(toPlace, 8),
  };
}

export const ROUTES: RoutePage[] = CORRIDORS.map(routePage);
export const getRoute = (slug: string) => ROUTES.find((r) => r.slug === slug);
