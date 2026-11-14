import { describe, expect, it } from 'vitest';
import type { LatLng } from '../src/geo';
import { bestGroupItinerary, lastDropped, segmentKm, settle, splitActualFare, type TripRider } from '../src/trip';

// A straight "road" along one line makes the expected numbers easy to read:
// 1 unit of longitude = 1 km.
const at = (km: number): LatLng => ({ lat: 0, lng: km });
const flatKm = (a: LatLng, b: LatLng) => Math.abs(a.lng - b.lng);

describe('bestGroupItinerary', () => {
  it('picks everyone up before dropping them, in the cheapest order', () => {
    const riders: TripRider[] = [
      { id: 'a', origin: at(0), destination: at(30) },
      { id: 'b', origin: at(2), destination: at(20) },
    ];
    const trip = bestGroupItinerary(riders, flatKm);
    expect(trip.stops.map((s) => `${s.kind[0]}${s.rideId}`)).toEqual(['pa', 'pb', 'db', 'da']);
    expect(trip.totalKm).toBe(30);
  });

  it('handles 3 riders', () => {
    const riders: TripRider[] = [
      { id: 'a', origin: at(0), destination: at(40) },
      { id: 'b', origin: at(1), destination: at(10) },
      { id: 'c', origin: at(2), destination: at(25) },
    ];
    const trip = bestGroupItinerary(riders, flatKm);
    expect(trip.totalKm).toBe(40);
    expect(lastDropped(trip)).toBe('a');
  });
});

describe('splitActualFare', () => {
  const riders: TripRider[] = [
    { id: 'a', origin: at(0), destination: at(30) },
    { id: 'b', origin: at(0), destination: at(20) },
  ];
  const trip = bestGroupItinerary(riders, flatKm);

  it('shares each stretch between the people in the cab', () => {
    // 0-20 km shared by two (10 km each), 20-30 km A alone: A 20 km, B 10 km.
    expect(segmentKm(trip)).toEqual({ a: 20, b: 10 });
    expect(splitActualFare(540, trip)).toEqual({ a: 360, b: 180 });
  });

  it('always adds up to the exact fare', () => {
    for (const total of [99, 100, 541, 1003]) {
      const s = splitActualFare(total, trip);
      expect(s.a + s.b).toBe(total);
    }
  });

  it('rejects a fare that is not whole rupees', () => {
    expect(() => splitActualFare(0, trip)).toThrow();
    expect(() => splitActualFare(12.5, trip)).toThrow();
  });
});

describe('settle', () => {
  it('everyone pays the booker', () => {
    expect(settle({ a: 360, b: 180 }, 'a')).toEqual([{ from: 'b', to: 'a', amount: 180 }]);
    expect(settle({ a: 200, b: 150, c: 100 }, 'c')).toEqual([
      { from: 'a', to: 'c', amount: 200 },
      { from: 'b', to: 'c', amount: 150 },
    ]);
  });
});
