import {
  bestGroupItinerary,
  lastDropped,
  round,
  segmentKm,
  settle,
  splitActualFare,
  type FareSplit,
  type FareSplitInput,
  type Ride,
  type Trip,
} from '@cabsathi/shared';
import { one, pool, query } from './db';
import { RIDE_COLUMNS, USER_COLUMNS, toRide, toUser } from './repo';
import { roadDistanceFn } from './roads';

/**
 * A trip is the "host" ride plus every ride whose request to it was accepted.
 * Any member's ride id finds the same trip.
 */
async function hostRideIdFor(rideId: string): Promise<string | null> {
  const row = await one(
    `SELECT CASE
              WHEN EXISTS (SELECT 1 FROM ride_requests WHERE to_ride_id = $1 AND status = 'accepted') THEN $1::uuid
              ELSE (SELECT to_ride_id FROM ride_requests WHERE from_ride_id = $1 AND status = 'accepted' LIMIT 1)
            END AS host`,
    [rideId],
  );
  return row?.host ?? null;
}

async function loadMembers(hostId: string) {
  const rows = await query(
    `SELECT ${RIDE_COLUMNS}, ${USER_COLUMNS}
       FROM rides r JOIN users u ON u.id = r.user_id
      WHERE r.id = $1
         OR r.id IN (SELECT from_ride_id FROM ride_requests WHERE to_ride_id = $1 AND status = 'accepted')
      ORDER BY (r.id = $1) DESC, r.created_at`,
    [hostId],
  );
  return rows.map((row) => ({ ride: toRide(row), user: toUser(row) }));
}

type Leg = Pick<Ride, 'id' | 'from' | 'to'>;

async function itineraryFor(rides: Leg[]) {
  const dist = await roadDistanceFn(rides.flatMap((r) => [r.from, r.to]));
  return bestGroupItinerary(
    rides.map((r) => ({ id: r.id, origin: r.from, destination: r.to })),
    dist,
  );
}

async function loadSplit(hostId: string): Promise<FareSplit | null> {
  const s = await one(`SELECT * FROM fare_splits WHERE host_ride_id = $1`, [hostId]);
  if (!s) return null;
  const payments = await query(`SELECT * FROM fare_payments WHERE host_ride_id = $1 ORDER BY amount DESC`, [hostId]);
  return {
    provider: s.provider,
    total: s.total,
    bookedByRideId: s.booked_by_ride_id,
    shares: s.shares,
    km: s.km,
    updatedAt: new Date(s.updated_at).toISOString(),
    payments: payments.map((p) => ({
      fromRideId: p.from_ride_id,
      toRideId: p.to_ride_id,
      amount: p.amount,
      paidAt: p.paid_at ? new Date(p.paid_at).toISOString() : null,
    })),
  };
}

export class TripError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** The trip for one of `userId`'s rides; only people in the trip can see it. */
export async function getTrip(rideId: string, userId: string): Promise<Trip> {
  const hostId = await hostRideIdFor(rideId);
  if (!hostId) throw new TripError(404, 'This ride has no confirmed co-rider yet');
  const members = await loadMembers(hostId);
  if (!members.some((m) => m.ride.userId === userId)) throw new TripError(403, 'You are not part of this trip');

  const it = await itineraryFor(members.map((m) => m.ride));
  const byId = new Map(members.map((m) => [m.ride.id, m.ride]));
  return {
    hostRideId: hostId,
    departAt: members[0].ride.departAt,
    members: members.map((m) => ({
      rideId: m.ride.id,
      user: m.user,
      from: m.ride.from,
      to: m.ride.to,
      isMe: m.ride.userId === userId,
    })),
    stops: it.stops.map((s) => {
      const ride = byId.get(s.rideId)!;
      return { rideId: s.rideId, kind: s.kind, place: s.kind === 'pickup' ? ride.from : ride.to };
    }),
    totalKm: round(it.totalKm),
    suggestedBookerRideId: lastDropped(it),
    split: await loadSplit(hostId),
  };
}

/** Save the real fare and work out who pays whom. Any member can enter or correct it. */
export async function saveFareSplit(rideId: string, userId: string, input: FareSplitInput): Promise<Trip> {
  const trip = await getTrip(rideId, userId);
  if (!trip.members.some((m) => m.rideId === input.bookedByRideId)) {
    throw new TripError(400, 'The person who booked must be in this trip');
  }
  const it = await itineraryFor(trip.members.map((m) => ({ id: m.rideId, from: m.from, to: m.to })));
  const shares = splitActualFare(input.total, it);
  const km = Object.fromEntries(Object.entries(segmentKm(it)).map(([id, v]) => [id, round(v)]));
  const payments = settle(shares, input.bookedByRideId);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const previous = await client.query(
      `SELECT from_ride_id, amount, paid_at FROM fare_payments WHERE host_ride_id = $1`,
      [trip.hostRideId],
    );
    await client.query(
      `INSERT INTO fare_splits (host_ride_id, provider, total, booked_by_ride_id, entered_by, shares, km, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())
       ON CONFLICT (host_ride_id) DO UPDATE SET
         provider = EXCLUDED.provider, total = EXCLUDED.total, booked_by_ride_id = EXCLUDED.booked_by_ride_id,
         entered_by = EXCLUDED.entered_by, shares = EXCLUDED.shares, km = EXCLUDED.km, updated_at = now()`,
      [trip.hostRideId, input.provider, input.total, input.bookedByRideId, userId, shares, km],
    );
    await client.query(`DELETE FROM fare_payments WHERE host_ride_id = $1`, [trip.hostRideId]);
    for (const p of payments) {
      // Keep "paid" only if the same person still owes the same amount.
      const before = previous.rows.find((r) => r.from_ride_id === p.from && r.amount === p.amount);
      await client.query(
        `INSERT INTO fare_payments (host_ride_id, from_ride_id, to_ride_id, amount, paid_at) VALUES ($1, $2, $3, $4, $5)`,
        [trip.hostRideId, p.from, p.to, p.amount, before?.paid_at ?? null],
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return getTrip(rideId, userId);
}

/** Mark a payment as paid (or not). Only the payer or the receiver can change it. */
export async function setPaid(rideId: string, userId: string, fromRideId: string, paid: boolean): Promise<Trip> {
  const trip = await getTrip(rideId, userId);
  const payment = trip.split?.payments.find((p) => p.fromRideId === fromRideId);
  if (!payment) throw new TripError(404, 'No payment found');
  const mine = trip.members.filter((m) => m.isMe).map((m) => m.rideId);
  if (!mine.includes(payment.fromRideId) && !mine.includes(payment.toRideId)) {
    throw new TripError(403, 'Only the payer or the receiver can change this');
  }
  await query(
    `UPDATE fare_payments SET paid_at = ${paid ? 'now()' : 'NULL'} WHERE host_ride_id = $1 AND from_ride_id = $2`,
    [trip.hostRideId, fromRideId],
  );
  return getTrip(rideId, userId);
}
