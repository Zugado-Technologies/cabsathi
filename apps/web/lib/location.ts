import type { LatLng } from '@cabsathi/shared';

/** Delhi NCR centre, used when we don't know where the person is. */
export const NCR_CENTRE: LatLng = { lat: 28.6139, lng: 77.209 };

/** The device's current position. Rejects with a readable message. */
export function currentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('This browser cannot share your location'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? 'Location is blocked. Allow it in your browser, or pick the place on the map.'
              : 'Could not find your location. Pick the place on the map.',
          ),
        ),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}
