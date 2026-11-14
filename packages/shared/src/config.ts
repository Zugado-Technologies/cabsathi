/**
 * All matching and fare constants in one place.
 * Values follow the CabSathi Matching Formula document. Later these move to
 * the admin-editable Config table; the code reads them from here.
 */
export const MATCHING_CONFIG = {
  pickupRadius: { factor: 0.12, minKm: 1.5, maxKm: 10 },
  dropRadius: { factor: 0.15, minKm: 2, maxKm: 12 },
  maxDetour: { factor: 0.1, maxKm: 10 },
  minSharedRatio: 0.4,
  timeWindow: { minutesPerKm: 1, minMin: 10, maxMin: 60 },
  /** Score weights (sum to 100). Not defined in the source docs; tunable. */
  scoreWeights: { overlap: 35, detour: 30, time: 20, pickup: 15 },
  levels: { exact: 80, nearby: 65 },
  /** Max people in one cab (driver excluded). */
  cabCapacity: 4,
} as const;

export const FARE_CONFIG = {
  /** Rough Delhi NCR app-cab fare: base + per km. ~₹350 for 28 km. */
  baseFare: 40,
  perKm: 11,
  /** Shown range around a person's share, e.g. ±5%. */
  rangePct: 0.05,
  roundTo: 5,
} as const;

/** Used until a real routing provider (Google / OSRM) is plugged in. */
export const ESTIMATE_CONFIG = {
  /** Road distance is usually ~1.3x straight-line distance in NCR. */
  roadFactor: 1.3,
  avgSpeedKmh: 24,
} as const;
