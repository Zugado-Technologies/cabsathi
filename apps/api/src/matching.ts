import {
  MATCHING_CONFIG as C,
  estimateSoloFare,
  evaluatePair,
  fareRange,
  splitBySegments,
  type MatchCard,
  type Ride,
} from '@cabsathi/shared';
import { query } from './db';
import { RIDE_COLUMNS, USER_COLUMNS, toRide, toUser } from './repo';

/** How "my ride" and "their ride" fit together, as shown on a match card. */
export function describeMatch(mine: Ride, theirs: Ride) {
  const pair = evaluatePair(
    { id: mine.id, origin: mine.from, destination: mine.to, distanceKm: mine.distanceKm, departAt: mine.departAt },
    { id: theirs.id, origin: theirs.from, destination: theirs.to, distanceKm: theirs.distanceKm, departAt: theirs.departAt },
  );
  const sharedFare = estimateSoloFare(pair.itinerary.totalKm);
  const shares = splitBySegments(sharedFare, pair.itinerary, {
    [mine.id]: mine.soloFare,
    [theirs.id]: theirs.soloFare,
  });
  const myShare = shares[mine.id];
  return {
    pair,
    card: {
      level: pair.level ?? 'flexible',
      score: pair.score,
      pickupGapKm: pair.pickupGapKm,
      minsToMeet: pair.minsToMeet,
      sharedKm: pair.sharedKm,
      overlapPct: Math.round(pair.overlap * 100),
      myDetourKm: pair.detourKm[mine.id],
      timeGapMin: pair.timeGapMin,
      myShare,
      shareRange: fareRange(myShare),
    },
  };
}

/**
 * Stage 1: cheap search in PostGIS (time window + start/end radius using the
 * shorter trip + gender preference both ways).
 * Stage 2: exact pair check (detour, shared distance) and scoring in shared code.
 */
export async function findMatches(myRide: Ride, myGender: string | null): Promise<MatchCard[]> {
  const rows = await query(
    `SELECT ${RIDE_COLUMNS}, ${USER_COLUMNS}, rq.status AS request_status
       FROM rides r
       JOIN users u ON u.id = r.user_id
       LEFT JOIN ride_requests rq ON rq.from_ride_id = $1 AND rq.to_ride_id = r.id
      WHERE r.status = 'published'
        AND r.user_id <> $2
        AND r.depart_at BETWEEN $3::timestamptz - make_interval(mins => $10)
                            AND $3::timestamptz + make_interval(mins => $10)
        AND ST_DWithin(r.from_point, ST_MakePoint($4, $5)::geography,
              1000 * LEAST($11, GREATEST($12, $13 * LEAST(r.distance_km, $8))))
        AND ST_DWithin(r.to_point, ST_MakePoint($6, $7)::geography,
              1000 * LEAST($14, GREATEST($15, $16 * LEAST(r.distance_km, $8))))
        AND ($9 = 'any' OR u.gender = $17)
        AND (r.gender_pref = 'any' OR u.gender = $17)
      LIMIT 50`,
    [
      myRide.id,
      myRide.userId,
      myRide.departAt,
      myRide.from.lng,
      myRide.from.lat,
      myRide.to.lng,
      myRide.to.lat,
      myRide.distanceKm,
      myRide.genderPref,
      C.timeWindow.maxMin,
      C.pickupRadius.maxKm,
      C.pickupRadius.minKm,
      C.pickupRadius.factor,
      C.dropRadius.maxKm,
      C.dropRadius.minKm,
      C.dropRadius.factor,
      myGender,
    ],
  );

  const cards: MatchCard[] = [];
  for (const row of rows) {
    const theirs = toRide(row);
    const { pair, card } = describeMatch(myRide, theirs);
    if (!pair.matched) continue;
    cards.push({ ...card, ride: theirs, user: toUser(row), requestStatus: row.request_status ?? null });
  }
  return cards.sort((a, b) => b.score - a.score);
}
