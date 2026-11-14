import { describe, expect, it } from 'vitest';
import {
  dropRadiusKm,
  estimateRoadKm,
  evaluatePair,
  maxDetourKm,
  pickupRadiusKm,
  timeWindowMin,
  type MatchableRide,
} from '../src/matching';
import { NCR_PLACES } from '../src/places';

const place = (name: string) => {
  const p = NCR_PLACES.find((x) => x.name === name);
  if (!p) throw new Error(`unknown place ${name}`);
  return p;
};

const ride = (id: string, from: string, to: string, departAt: string): MatchableRide => {
  const origin = place(from);
  const destination = place(to);
  return { id, origin, destination, distanceKm: estimateRoadKm(origin, destination), departAt };
};

describe('formula table from the matching document', () => {
  it.each([
    // distance, pickup, drop, detour, time
    [5, 1.5, 2, 0.5, 10],
    [10, 1.5, 2, 1, 10],
    [20, 2.4, 3, 2, 20],
    [50, 6, 7.5, 5, 50],
    [80, 9.6, 12, 8, 60],
    [100, 10, 12, 10, 60],
  ])('%d km ride', (d, pickup, drop, detour, time) => {
    expect(pickupRadiusKm(d)).toBeCloseTo(pickup);
    expect(dropRadiusKm(d)).toBeCloseTo(drop);
    expect(maxDetourKm(d)).toBeCloseTo(detour);
    expect(timeWindowMin(d)).toBeCloseTo(time);
  });
});

describe('evaluatePair', () => {
  const riya = ride('riya', 'Sector 62, Noida', 'Cyber Hub, Gurgaon', '2026-11-20T09:00:00+05:30');

  it('matches two people with close start, close end and close time', () => {
    const aman = ride('aman', 'Sector 63, Noida', 'DLF Phase 3, Gurgaon', '2026-11-20T09:10:00+05:30');
    const r = evaluatePair(riya, aman);
    expect(r.rejectReasons).toEqual([]);
    expect(r.matched).toBe(true);
    expect(r.overlap).toBeGreaterThan(0.9);
    expect(r.level).toBeDefined();
  });

  it('gives the same answer whichever side asks', () => {
    const aman = ride('aman', 'Sector 63, Noida', 'DLF Phase 3, Gurgaon', '2026-11-20T09:10:00+05:30');
    const ab = evaluatePair(riya, aman);
    const ba = evaluatePair(aman, riya);
    expect(ab.matched).toBe(ba.matched);
    expect(ab.score).toBe(ba.score);
  });

  it('rejects when start times are too far apart', () => {
    const late = ride('late', 'Sector 63, Noida', 'DLF Phase 3, Gurgaon', '2026-11-20T10:30:00+05:30');
    expect(evaluatePair(riya, late).rejectReasons).toContain('time_gap_too_big');
  });

  it('rejects when the start points are too far apart', () => {
    const far = ride('far', 'Ghaziabad', 'Cyber Hub, Gurgaon', '2026-11-20T09:00:00+05:30');
    expect(evaluatePair(riya, far).rejectReasons).toContain('pickup_too_far');
  });

  it('rejects when the destinations are in different places', () => {
    const cp = ride('cp', 'Sector 63, Noida', 'Connaught Place, Delhi', '2026-11-20T09:00:00+05:30');
    expect(evaluatePair(riya, cp).matched).toBe(false);
  });
});
