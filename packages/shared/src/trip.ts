import { splitExact } from './fare';
import type { LatLng } from './geo';
import { estimateRoadKm, type DistanceFn, type Itinerary, type Stop } from './matching';

/**
 * A confirmed shared trip: who is in the cab, in which order they are picked
 * up and dropped, and how a real fare is split between them.
 */
export interface TripRider {
  /** The rider's ride id (one per person in the cab). */
  id: string;
  origin: LatLng;
  destination: LatLng;
}

const MAX_RIDERS = 4;

/**
 * Cheapest order to pick up and drop everyone (each person is picked up before
 * they are dropped). Tries every valid order; fine for up to 4 riders.
 */
export function bestGroupItinerary(riders: TripRider[], dist: DistanceFn = estimateRoadKm): Itinerary {
  if (riders.length === 0) throw new Error('No riders');
  if (riders.length > MAX_RIDERS) throw new Error(`At most ${MAX_RIDERS} riders per cab`);

  let best: { stops: Stop[]; legsKm: number[]; totalKm: number } | null = null;
  const stops: Stop[] = [];
  const picked = new Set<string>();
  const dropped = new Set<string>();

  const visit = (km: number, legs: number[]) => {
    if (best && km >= best.totalKm) return; // can't beat the best so far
    if (dropped.size === riders.length) {
      best = { stops: [...stops], legsKm: [...legs], totalKm: km };
      return;
    }
    for (const r of riders) {
      for (const kind of ['pickup', 'drop'] as const) {
        if (kind === 'pickup' && picked.has(r.id)) continue;
        if (kind === 'drop' && (!picked.has(r.id) || dropped.has(r.id))) continue;
        const point = kind === 'pickup' ? r.origin : r.destination;
        const leg = stops.length ? dist(stops[stops.length - 1].point, point) : 0;
        stops.push({ rideId: r.id, kind, point });
        (kind === 'pickup' ? picked : dropped).add(r.id);
        visit(km + leg, stops.length > 1 ? [...legs, leg] : legs);
        (kind === 'pickup' ? picked : dropped).delete(r.id);
        stops.pop();
      }
    }
  };
  visit(0, []);
  return best!;
}

/** Km each rider is "charged for": every leg is shared equally by who is in the cab. */
export function segmentKm(it: Itinerary): Record<string, number> {
  const inCab = new Set<string>();
  const km: Record<string, number> = {};
  it.stops.forEach((stop, i) => {
    km[stop.rideId] ??= 0;
    if (stop.kind === 'pickup') inCab.add(stop.rideId);
    else inCab.delete(stop.rideId);
    const leg = it.legsKm[i];
    if (leg === undefined || inCab.size === 0) return;
    inCab.forEach((id) => (km[id] += leg / inCab.size));
  });
  return km;
}

/**
 * Split the exact fare the cab app charged. Shares always add up to `total`.
 * Riders who travel alone for part of the trip pay more for that part.
 */
export function splitActualFare(total: number, it: Itinerary): Record<string, number> {
  if (!Number.isInteger(total) || total <= 0) throw new Error('Fare must be a whole number of rupees');
  return splitExact(total, segmentKm(it));
}

/** The rider dropped last — the suggested person to book the cab. */
export const lastDropped = (it: Itinerary) => it.stops[it.stops.length - 1].rideId;

export interface Settlement {
  /** Ride id of the person who pays. */
  from: string;
  /** Ride id of the person who paid the cab (the booker). */
  to: string;
  amount: number;
}

/** Everyone except the booker pays their share to the booker. */
export function settle(shares: Record<string, number>, bookerId: string): Settlement[] {
  if (!(bookerId in shares)) throw new Error('Booker is not in this trip');
  return Object.entries(shares)
    .filter(([id, amount]) => id !== bookerId && amount > 0)
    .map(([from, amount]) => ({ from, to: bookerId, amount }));
}
