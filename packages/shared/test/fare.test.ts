import { describe, expect, it } from 'vitest';
import { estimateSoloFare, fareRange, splitByDistance, splitExact } from '../src/fare';

describe('fare split from the documents (by distance)', () => {
  it.each([
    [400, 10, 20, 133, 267],
    [350, 18, 10, 225, 125],
    [300, 10, 10, 150, 150],
  ])('₹%d for %d km and %d km', (total, a, b, shareA, shareB) => {
    const s = splitByDistance(total, { a, b });
    expect(s).toEqual({ a: shareA, b: shareB });
    expect(s.a + s.b).toBe(total);
  });
});

describe('splitExact', () => {
  it('always adds up to the total', () => {
    const s = splitExact(100, { a: 1, b: 1, c: 1 });
    expect(s.a + s.b + s.c).toBe(100);
  });
});

describe('estimates', () => {
  it('gives about ₹350 for a 28 km NCR trip', () => {
    expect(estimateSoloFare(28)).toBeGreaterThan(330);
    expect(estimateSoloFare(28)).toBeLessThan(370);
  });

  it('gives a rounded range around a share', () => {
    expect(fareRange(128)).toEqual({ min: 120, max: 135 });
  });
});
