import type { Ride, UserPublic } from '@cabsathi/shared';

/** SQL fragment selecting a ride with lat/lng pulled out of the geography columns. */
export const RIDE_COLUMNS = `
  r.id, r.user_id, r.from_name, r.to_name, r.depart_at, r.seats, r.gender_pref,
  r.distance_km, r.duration_min, r.solo_fare, r.status, r.route_polyline,
  ST_Y(r.from_point::geometry) AS from_lat, ST_X(r.from_point::geometry) AS from_lng,
  ST_Y(r.to_point::geometry) AS to_lat, ST_X(r.to_point::geometry) AS to_lng`;

export const USER_COLUMNS = `
  u.id AS u_id, u.name AS u_name, u.gender AS u_gender, u.birth_year AS u_birth_year,
  u.rating AS u_rating, u.rides_count AS u_rides_count, u.verified AS u_verified`;

export function toRide(row: any): Ride {
  return {
    id: row.id,
    userId: row.user_id,
    from: { name: row.from_name, lat: row.from_lat, lng: row.from_lng },
    to: { name: row.to_name, lat: row.to_lat, lng: row.to_lng },
    departAt: new Date(row.depart_at).toISOString(),
    seats: row.seats,
    genderPref: row.gender_pref,
    distanceKm: row.distance_km,
    durationMin: row.duration_min,
    soloFare: row.solo_fare,
    status: row.status,
    polyline: row.route_polyline ?? null,
  };
}

export function toUser(row: any, prefix = 'u_'): UserPublic {
  const birthYear = row[`${prefix}birth_year`];
  return {
    id: row[`${prefix}id`],
    name: row[`${prefix}name`],
    gender: row[`${prefix}gender`],
    age: birthYear ? new Date().getFullYear() - birthYear : null,
    rating: row[`${prefix}rating`],
    ridesCount: row[`${prefix}rides_count`],
    verified: row[`${prefix}verified`],
  };
}
