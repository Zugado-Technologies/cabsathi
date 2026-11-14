import { MATCHING_CONFIG as C, ESTIMATE_CONFIG } from './config';
import { clamp, haversineKm, round, type LatLng } from './geo';

/** The parts of a ride the matching engine needs. */
export interface MatchableRide {
  id: string;
  origin: LatLng;
  destination: LatLng;
  /** Road distance of the solo trip in km. */
  distanceKm: number;
  /** ISO date-time of planned departure. */
  departAt: string;
}

export type MatchLevel = 'exact' | 'nearby' | 'flexible';

export type RejectReason =
  | 'pickup_too_far'
  | 'drop_too_far'
  | 'time_gap_too_big'
  | 'detour_too_big'
  | 'shared_too_small';

/** Road distance estimator between two points. Swap for Google/OSRM later. */
export type DistanceFn = (a: LatLng, b: LatLng) => number;

export const estimateRoadKm: DistanceFn = (a, b) =>
  haversineKm(a, b) * ESTIMATE_CONFIG.roadFactor;

export const estimateMinutes = (km: number) =>
  (km / ESTIMATE_CONFIG.avgSpeedKmh) * 60;

// ---- The formulas from the documents -------------------------------------

export const pickupRadiusKm = (d: number) =>
  clamp(d * C.pickupRadius.factor, C.pickupRadius.minKm, C.pickupRadius.maxKm);

export const dropRadiusKm = (d: number) =>
  clamp(d * C.dropRadius.factor, C.dropRadius.minKm, C.dropRadius.maxKm);

export const maxDetourKm = (d: number) =>
  Math.min(d * C.maxDetour.factor, C.maxDetour.maxKm);

export const timeWindowMin = (d: number) =>
  clamp(d * C.timeWindow.minutesPerKm, C.timeWindow.minMin, C.timeWindow.maxMin);

// ---- Itinerary: how one cab carries both people ---------------------------

export type Stop = { rideId: string; kind: 'pickup' | 'drop'; point: LatLng };

export interface Itinerary {
  stops: Stop[];
  /** Distance of each leg between consecutive stops. */
  legsKm: number[];
  totalKm: number;
}

function buildItinerary(stops: Stop[], dist: DistanceFn): Itinerary {
  const legsKm = stops.slice(1).map((s, i) => dist(stops[i].point, s.point));
  return { stops, legsKm, totalKm: legsKm.reduce((a, b) => a + b, 0) };
}

/** Km a rider spends in the cab: from their pickup stop to their drop stop. */
export function inCabKm(it: Itinerary, rideId: string): number {
  const from = it.stops.findIndex((s) => s.rideId === rideId && s.kind === 'pickup');
  const to = it.stops.findIndex((s) => s.rideId === rideId && s.kind === 'drop');
  return it.legsKm.slice(from, to).reduce((a, b) => a + b, 0);
}

/** All 4 orders for two riders: who is picked first x who is dropped first. */
function pairItineraries(a: MatchableRide, b: MatchableRide, dist: DistanceFn) {
  const p = (r: MatchableRide): Stop => ({ rideId: r.id, kind: 'pickup', point: r.origin });
  const d = (r: MatchableRide): Stop => ({ rideId: r.id, kind: 'drop', point: r.destination });
  return [
    [p(a), p(b), d(a), d(b)],
    [p(a), p(b), d(b), d(a)],
    [p(b), p(a), d(a), d(b)],
    [p(b), p(a), d(b), d(a)],
  ].map((stops) => buildItinerary(stops, dist));
}

// ---- Pair evaluation -------------------------------------------------------

export interface PairResult {
  matched: boolean;
  rejectReasons: RejectReason[];
  level?: MatchLevel;
  /** 0-100, higher is better. */
  score: number;
  pickupGapKm: number;
  dropGapKm: number;
  timeGapMin: number;
  /** Km both people are in the cab together. */
  sharedKm: number;
  /** sharedKm / shorter trip, 0-1. */
  overlap: number;
  /** Extra km for each rider vs riding alone. */
  detourKm: Record<string, number>;
  /** Minutes for the cab to reach the other person's pickup. */
  minsToMeet: number;
  itinerary: Itinerary;
  limits: {
    pickupRadiusKm: number;
    dropRadiusKm: number;
    timeWindowMin: number;
    maxDetourKm: Record<string, number>;
  };
}

/**
 * Checks whether rides A and B can share one cab ("same start & end" match).
 * Limits use the SHORTER trip, and each rider's detour is checked against
 * their own limit, so the result is the same whichever side asks.
 */
export function evaluatePair(
  a: MatchableRide,
  b: MatchableRide,
  dist: DistanceFn = estimateRoadKm,
): PairResult {
  const shorter = Math.min(a.distanceKm, b.distanceKm);
  const limits = {
    pickupRadiusKm: pickupRadiusKm(shorter),
    dropRadiusKm: dropRadiusKm(shorter),
    timeWindowMin: timeWindowMin(shorter),
    maxDetourKm: { [a.id]: maxDetourKm(a.distanceKm), [b.id]: maxDetourKm(b.distanceKm) },
  };

  const pickupGapKm = haversineKm(a.origin, b.origin);
  const dropGapKm = haversineKm(a.destination, b.destination);
  const timeGapMin =
    Math.abs(new Date(a.departAt).getTime() - new Date(b.departAt).getTime()) / 60000;

  // Best order = the one with the smallest total trip.
  const itinerary = pairItineraries(a, b, dist).reduce((best, it) =>
    it.totalKm < best.totalKm ? it : best,
  );
  const detourKm = {
    [a.id]: Math.max(0, inCabKm(itinerary, a.id) - a.distanceKm),
    [b.id]: Math.max(0, inCabKm(itinerary, b.id) - b.distanceKm),
  };
  // Shared = from the second pickup to the first drop.
  const sharedKm = itinerary.legsKm.slice(1, 2).reduce((x, y) => x + y, 0);
  const overlap = Math.min(1, sharedKm / shorter);

  const rejectReasons: RejectReason[] = [];
  if (pickupGapKm > limits.pickupRadiusKm) rejectReasons.push('pickup_too_far');
  if (dropGapKm > limits.dropRadiusKm) rejectReasons.push('drop_too_far');
  if (timeGapMin > limits.timeWindowMin) rejectReasons.push('time_gap_too_big');
  if (detourKm[a.id] > limits.maxDetourKm[a.id] || detourKm[b.id] > limits.maxDetourKm[b.id])
    rejectReasons.push('detour_too_big');
  if (overlap < C.minSharedRatio) rejectReasons.push('shared_too_small');

  const w = C.scoreWeights;
  const worstDetourRatio = Math.max(
    detourKm[a.id] / Math.max(limits.maxDetourKm[a.id], 0.01),
    detourKm[b.id] / Math.max(limits.maxDetourKm[b.id], 0.01),
  );
  const score = Math.round(
    w.overlap * overlap +
      w.detour * clamp(1 - worstDetourRatio, 0, 1) +
      w.time * clamp(1 - timeGapMin / limits.timeWindowMin, 0, 1) +
      w.pickup * clamp(1 - pickupGapKm / limits.pickupRadiusKm, 0, 1),
  );
  const matched = rejectReasons.length === 0;
  const level: MatchLevel | undefined = !matched
    ? undefined
    : score >= C.levels.exact
      ? 'exact'
      : score >= C.levels.nearby
        ? 'nearby'
        : 'flexible';

  return {
    matched,
    rejectReasons,
    level,
    score,
    pickupGapKm: round(pickupGapKm),
    dropGapKm: round(dropGapKm),
    timeGapMin: Math.round(timeGapMin),
    sharedKm: round(sharedKm),
    overlap: round(overlap, 2),
    detourKm: { [a.id]: round(detourKm[a.id]), [b.id]: round(detourKm[b.id]) },
    minsToMeet: Math.max(1, Math.round(estimateMinutes(dist(a.origin, b.origin)))),
    itinerary,
    limits,
  };
}
