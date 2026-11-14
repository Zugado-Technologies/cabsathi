import type { LatLng } from './geo';

/**
 * Estimated fares for other cab apps, built from fare cards (base + per km +
 * per minute). No company gives us live prices, so these are ESTIMATES.
 *
 * IMPORTANT: the numbers below are rough placeholders for Delhi NCR and must
 * be checked against each company's published rate card before launch.
 * Surge, tolls, airport fees and promotions are not included.
 */
export interface FareCard {
  provider: 'uber' | 'ola' | 'rapido' | 'indrive';
  providerName: string;
  vehicle: string;
  /** Flat amount at the start of the trip. */
  base: number;
  perKm: number;
  perMin: number;
  minFare: number;
  /** Platform/booking fee added to every trip. */
  fee: number;
  /** Shown next to the estimate, e.g. inDrive's price is agreed per trip. */
  note?: string;
}

export const FARE_CARDS_VERIFIED_ON: string | null = null;

export const FARE_CARDS: FareCard[] = [
  { provider: 'uber', providerName: 'Uber', vehicle: 'Uber Go', base: 50, perKm: 11, perMin: 1, minFare: 90, fee: 15 },
  { provider: 'uber', providerName: 'Uber', vehicle: 'Uber Premier', base: 60, perKm: 14, perMin: 1.5, minFare: 120, fee: 15 },
  { provider: 'ola', providerName: 'Ola', vehicle: 'Ola Mini', base: 50, perKm: 10.5, perMin: 1, minFare: 90, fee: 15 },
  { provider: 'ola', providerName: 'Ola', vehicle: 'Ola Prime Sedan', base: 60, perKm: 13.5, perMin: 1.5, minFare: 110, fee: 15 },
  { provider: 'rapido', providerName: 'Rapido', vehicle: 'Rapido Cab Economy', base: 45, perKm: 10, perMin: 1, minFare: 80, fee: 10 },
  {
    provider: 'indrive',
    providerName: 'inDrive',
    vehicle: 'inDrive Car',
    base: 40,
    perKm: 9.5,
    perMin: 0.8,
    minFare: 80,
    fee: 0,
    note: 'Price is agreed with the driver',
  },
];

export interface ProviderFare {
  provider: FareCard['provider'];
  providerName: string;
  vehicle: string;
  /** Rough range in rupees for one cab, whole trip. */
  min: number;
  max: number;
  note?: string;
  /** Link that opens the provider's app with pickup and drop filled in, when one is documented. */
  bookUrl?: string;
}

const round5 = (n: number) => Math.round(n / 5) * 5;

/** Fare from one card for a trip. */
export function fareFromCard(card: FareCard, km: number, minutes: number): number {
  return Math.max(card.minFare, card.base + card.perKm * km + card.perMin * minutes) + card.fee;
}

/**
 * Uber's documented universal link: opens the app (or m.uber.com) with pickup
 * and drop set. It doesn't give us a price; the user sees it in Uber.
 */
export function uberLink(from: LatLng & { name?: string }, to: LatLng & { name?: string }) {
  const p = new URLSearchParams({
    action: 'setPickup',
    'pickup[latitude]': String(from.lat),
    'pickup[longitude]': String(from.lng),
    'dropoff[latitude]': String(to.lat),
    'dropoff[longitude]': String(to.lng),
  });
  if (from.name) p.set('pickup[nickname]', from.name);
  if (to.name) p.set('dropoff[nickname]', to.name);
  return `https://m.uber.com/ul/?${p.toString()}`;
}

/** Estimated fare range for each provider, cheapest first. */
export function compareFares(
  km: number,
  minutes: number,
  from?: LatLng & { name?: string },
  to?: LatLng & { name?: string },
): ProviderFare[] {
  return FARE_CARDS.map((c) => {
    const f = fareFromCard(c, km, minutes);
    return {
      provider: c.provider,
      providerName: c.providerName,
      vehicle: c.vehicle,
      min: round5(f * 0.92),
      max: round5(f * 1.12),
      note: c.note,
      bookUrl: c.provider === 'uber' && from && to ? uberLink(from, to) : undefined,
    };
  }).sort((a, b) => a.min - b.min);
}

/** About what each person pays when two share most of the trip. */
export const sharedEach = (fare: number) => round5(fare * 0.55);
