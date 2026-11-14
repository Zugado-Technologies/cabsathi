import {
  estimateMinutes,
  estimateRoadKm,
  estimateSoloFare,
  round,
  type LatLng,
  type RideEstimate,
} from '@cabsathi/shared';

/**
 * Trip distance and time. For local development this estimates from
 * straight-line distance; later it calls Google Routes API or our own OSRM.
 */
export async function estimateTrip(from: LatLng, to: LatLng): Promise<RideEstimate> {
  const distanceKm = round(estimateRoadKm(from, to));
  return {
    distanceKm,
    durationMin: Math.max(1, Math.round(estimateMinutes(distanceKm))),
    soloFare: estimateSoloFare(distanceKm),
  };
}
