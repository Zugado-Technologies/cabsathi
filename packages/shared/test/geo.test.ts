import { describe, expect, it } from 'vitest';
import { decodePolyline } from '../src/geo';

describe('decodePolyline', () => {
  it('decodes the example from Google\'s polyline docs', () => {
    const pts = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(pts).toHaveLength(3);
    expect(pts[0].lat).toBeCloseTo(38.5);
    expect(pts[0].lng).toBeCloseTo(-120.2);
    expect(pts[2].lat).toBeCloseTo(43.252);
    expect(pts[2].lng).toBeCloseTo(-126.453);
  });
});
