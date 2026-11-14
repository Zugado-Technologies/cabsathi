import { FARE_CONFIG as F } from './config';
import type { Itinerary } from './matching';

/** Rough solo cab fare for a trip, in whole rupees. */
export const estimateSoloFare = (km: number) => Math.round(F.baseFare + F.perKm * km);

/**
 * Splits whole rupees so the parts add up exactly to `total`
 * (largest-remainder rounding).
 */
export function splitExact(total: number, weights: Record<string, number>): Record<string, number> {
  const ids = Object.keys(weights);
  const sum = ids.reduce((s, id) => s + weights[id], 0);
  if (sum <= 0) return Object.fromEntries(ids.map((id) => [id, 0]));
  const raw = ids.map((id) => ({ id, value: (total * weights[id]) / sum }));
  const result = Object.fromEntries(raw.map((r) => [r.id, Math.floor(r.value)]));
  let left = total - Object.values(result).reduce((s, v) => s + v, 0);
  raw
    .sort((x, y) => (y.value % 1) - (x.value % 1))
    .forEach((r) => {
      if (left > 0) {
        result[r.id] += 1;
        left -= 1;
      }
    });
  return result;
}

/** The document's rule: split in proportion to each person's km. */
export const splitByDistance = (total: number, kmByRider: Record<string, number>) =>
  splitExact(total, kmByRider);

/**
 * Segment split: each leg's cost is shared equally by whoever is in the cab on
 * that leg. Nobody pays more than their solo fare.
 */
export function splitBySegments(
  totalFare: number,
  it: Itinerary,
  soloFare: Record<string, number>,
): Record<string, number> {
  const inCab = new Set<string>();
  const weights: Record<string, number> = {};
  it.stops.forEach((stop, i) => {
    if (stop.kind === 'pickup') inCab.add(stop.rideId);
    else inCab.delete(stop.rideId);
    weights[stop.rideId] ??= 0;
    const leg = it.legsKm[i];
    if (leg === undefined || inCab.size === 0) return;
    inCab.forEach((id) => (weights[id] += leg / inCab.size));
  });
  const shares = splitExact(totalFare, weights);
  for (const id of Object.keys(shares)) {
    if (soloFare[id] !== undefined) shares[id] = Math.min(shares[id], soloFare[id]);
  }
  return shares;
}

/** A display range like "₹120 - ₹135" around a share. */
export function fareRange(share: number): { min: number; max: number } {
  const r = (v: number) => Math.round(v / F.roundTo) * F.roundTo;
  return { min: r(share * (1 - F.rangePct)), max: Math.max(r(share * (1 + F.rangePct)), r(share)) };
}
