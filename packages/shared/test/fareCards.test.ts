import { describe, expect, it } from 'vitest';
import { FARE_CARDS, compareFares, fareFromCard, sharedEach, uberLink } from '../src/fareCards';

describe('compareFares', () => {
  it('returns one estimate per fare card, cheapest first', () => {
    const list = compareFares(28, 70);
    expect(list).toHaveLength(FARE_CARDS.length);
    for (let i = 1; i < list.length; i++) expect(list[i].min).toBeGreaterThanOrEqual(list[i - 1].min);
    for (const f of list) expect(f.max).toBeGreaterThan(f.min);
  });

  it('uses the minimum fare for very short trips', () => {
    const card = FARE_CARDS[0];
    expect(fareFromCard(card, 0.5, 2)).toBe(card.minFare + card.fee);
  });

  it('adds an Uber link only when pickup and drop are known', () => {
    expect(compareFares(10, 20).some((f) => f.bookUrl)).toBe(false);
    const withPlaces = compareFares(10, 20, { lat: 28.6, lng: 77.3 }, { lat: 28.5, lng: 77.1 });
    expect(withPlaces.find((f) => f.provider === 'uber')?.bookUrl).toContain('m.uber.com/ul/');
    expect(withPlaces.find((f) => f.provider === 'ola')?.bookUrl).toBeUndefined();
  });
});

describe('uberLink', () => {
  it('encodes pickup and drop', () => {
    const url = new URL(uberLink({ lat: 28.627, lng: 77.365, name: 'Sector 62' }, { lat: 28.495, lng: 77.089 }));
    expect(url.searchParams.get('pickup[latitude]')).toBe('28.627');
    expect(url.searchParams.get('dropoff[longitude]')).toBe('77.089');
    expect(url.searchParams.get('pickup[nickname]')).toBe('Sector 62');
  });
});

describe('sharedEach', () => {
  it('is a little over half, rounded to ₹5', () => {
    expect(sharedEach(400)).toBe(220);
  });
});
