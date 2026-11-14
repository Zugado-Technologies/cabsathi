import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import {
  createRideSchema,
  estimateRideSchema,
  fareSplitSchema,
  placeSchema,
  sendOtpSchema,
  updateProfileSchema,
  verifyOtpSchema,
  type ReceivedRequest,
} from '@cabsathi/shared';
import Fastify, { type FastifyRequest } from 'fastify';
import { ZodError, type ZodSchema } from 'zod';
import { requireAuth, sendOtp, verifyOtp } from './auth';
import { one, pool, query } from './db';
import { env } from './env';
import { describeMatch, findMatches } from './matching';
import { placeDetails, reversePlace, searchPlaces } from './places';
import { RIDE_COLUMNS, USER_COLUMNS, toRide, toUser } from './repo';
import { estimateTrip } from './routing';
import { TripError, getTrip, saveFareSplit, setPaid } from './trip';

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const parse = <T>(schema: ZodSchema<T>, data: unknown): T => schema.parse(data);
const me = (req: FastifyRequest) => req.user.sub;

async function getUser(id: string) {
  const row = await one(`SELECT ${USER_COLUMNS}, u.phone FROM users u WHERE u.id = $1`, [id]);
  if (!row) throw new HttpError(404, 'User not found');
  return { ...toUser(row), phone: row.phone as string };
}

async function getRide(id: string) {
  const row = await one(`SELECT ${RIDE_COLUMNS} FROM rides r WHERE r.id = $1`, [id]);
  if (!row) throw new HttpError(404, 'Ride not found');
  return toRide(row);
}

async function getOwnRide(id: string, userId: string) {
  const ride = await getRide(id);
  if (ride.userId !== userId) throw new HttpError(403, 'This is not your ride');
  return ride;
}

export function buildApp() {
  const app = Fastify({ logger: { level: 'info' } });
  app.register(cors, { origin: true });
  app.register(jwt, { secret: env.jwtSecret, sign: { expiresIn: '30d' } });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ZodError) {
      return reply.code(400).send({ error: err.issues[0]?.message ?? 'Invalid input' });
    }
    if (err instanceof HttpError || err instanceof TripError) return reply.code(err.status).send({ error: err.message });
    const { statusCode, message } = err as { statusCode?: number; message?: string };
    if (statusCode && statusCode < 500) return reply.code(statusCode).send({ error: message ?? 'Bad request' });
    app.log.error(err);
    return reply.code(500).send({ error: 'Something went wrong' });
  });

  app.get('/health', async () => {
    await pool.query('SELECT 1');
    return { ok: true };
  });

  // ---- Auth ---------------------------------------------------------------
  app.post('/auth/send-otp', async (req) => {
    const { phone } = parse(sendOtpSchema, req.body);
    await sendOtp(phone);
    return { sent: true, devMode: env.otpDevMode };
  });

  app.post('/auth/verify-otp', async (req) => {
    const { phone, code } = parse(verifyOtpSchema, req.body);
    const userId = await verifyOtp(phone, code);
    if (!userId) throw new HttpError(401, 'Wrong or expired code');
    return { token: app.jwt.sign({ sub: userId }), user: await getUser(userId) };
  });

  // ---- Everything below needs login ---------------------------------------
  app.register(async (auth) => {
    auth.addHook('preHandler', requireAuth);

    auth.get('/me', async (req) => getUser(me(req)));

    auth.patch('/me', async (req) => {
      const body = parse(updateProfileSchema, req.body);
      await query(
        `UPDATE users SET name = COALESCE($2, name), gender = COALESCE($3, gender),
                birth_year = COALESCE($4, birth_year) WHERE id = $1`,
        [me(req), body.name ?? null, body.gender ?? null, body.birthYear ?? null],
      );
      return getUser(me(req));
    });

    auth.get('/places', async (req) => {
      const { q = '', session } = req.query as { q?: string; session?: string };
      return searchPlaces(q.slice(0, 100), session);
    });

    auth.get('/places/reverse', async (req) => {
      const { lat, lng } = req.query as { lat?: string; lng?: string };
      const point = placeSchema.pick({ lat: true, lng: true }).safeParse({ lat: Number(lat), lng: Number(lng) });
      if (!point.success) throw new HttpError(400, 'Send a valid lat and lng');
      return reversePlace(point.data.lat, point.data.lng);
    });

    auth.get('/places/:id', async (req) => {
      const { session } = req.query as { session?: string };
      const place = await placeDetails((req.params as { id: string }).id, session);
      if (!place) throw new HttpError(404, 'Place not found');
      return place;
    });

    auth.post('/rides/estimate', async (req) => {
      const { from, to } = parse(estimateRideSchema, req.body);
      return estimateTrip(from, to);
    });

    auth.post('/rides', async (req, reply) => {
      const body = parse(createRideSchema, req.body);
      if (new Date(body.departAt).getTime() < Date.now() - 5 * 60_000) {
        throw new HttpError(400, 'Pick a time in the future');
      }
      const est = await estimateTrip(body.from, body.to);
      if (est.distanceKm < 1) throw new HttpError(400, 'From and To are too close');
      const row = await one(
        `INSERT INTO rides (user_id, from_name, from_point, to_name, to_point, depart_at,
                            seats, gender_pref, distance_km, duration_min, solo_fare, route_polyline)
         VALUES ($1, $2, ST_MakePoint($3, $4)::geography, $5, ST_MakePoint($6, $7)::geography,
                 $8, $9, $10, $11, $12, $13, $14)
         RETURNING id`,
        [
          me(req), body.from.name, body.from.lng, body.from.lat, body.to.name, body.to.lng,
          body.to.lat, body.departAt, body.seats, body.genderPref, est.distanceKm,
          est.durationMin, est.soloFare, est.polyline,
        ],
      );
      reply.code(201);
      return getRide(row!.id);
    });

    auth.get('/rides/mine', async (req) => {
      const rows = await query(
        `SELECT ${RIDE_COLUMNS} FROM rides r
          WHERE r.user_id = $1 AND r.depart_at > now() - interval '1 day'
          ORDER BY r.depart_at`,
        [me(req)],
      );
      return rows.map(toRide);
    });

    auth.get('/rides/:id', async (req) => getRide((req.params as { id: string }).id));

    auth.post('/rides/:id/cancel', async (req) => {
      const ride = await getOwnRide((req.params as { id: string }).id, me(req));
      await query(`UPDATE rides SET status = 'cancelled' WHERE id = $1`, [ride.id]);
      await query(
        `UPDATE ride_requests SET status = 'cancelled', updated_at = now()
          WHERE (from_ride_id = $1 OR to_ride_id = $1) AND status = 'pending'`,
        [ride.id],
      );
      return getRide(ride.id);
    });

    auth.get('/rides/:id/matches', async (req) => {
      const ride = await getOwnRide((req.params as { id: string }).id, me(req));
      const user = await getUser(me(req));
      return findMatches(ride, user.gender);
    });

    // Send a request from my ride to another person's ride.
    auth.post('/rides/:id/requests', async (req, reply) => {
      const mine = await getOwnRide((req.params as { id: string }).id, me(req));
      const { toRideId } = req.body as { toRideId: string };
      const theirs = await getRide(toRideId);
      if (theirs.userId === me(req)) throw new HttpError(400, 'You cannot request your own ride');
      if (theirs.status !== 'published') throw new HttpError(409, 'This ride is no longer open');
      const { pair } = await describeMatch(mine, theirs);
      if (!pair.matched) throw new HttpError(409, 'These rides no longer match');
      const row = await one(
        `INSERT INTO ride_requests (from_ride_id, to_ride_id) VALUES ($1, $2)
         ON CONFLICT (from_ride_id, to_ride_id)
           DO UPDATE SET status = 'pending', updated_at = now()
         RETURNING id, status`,
        [mine.id, theirs.id],
      );
      reply.code(201);
      return row;
    });

    // Requests other people sent to my rides.
    auth.get('/requests/received', async (req) => {
      const rows = await query(
        `SELECT rq.id AS rq_id, rq.status AS rq_status, rq.created_at AS rq_created_at,
                rq.from_ride_id, rq.to_ride_id, ${USER_COLUMNS}
           FROM ride_requests rq
           JOIN rides fr ON fr.id = rq.from_ride_id
           JOIN rides tr ON tr.id = rq.to_ride_id
           JOIN users u ON u.id = fr.user_id
          WHERE tr.user_id = $1 AND rq.status IN ('pending', 'accepted')
          ORDER BY rq.created_at DESC`,
        [me(req)],
      );
      const result: ReceivedRequest[] = [];
      for (const row of rows) {
        const fromRide = await getRide(row.from_ride_id);
        const toRide = await getRide(row.to_ride_id);
        const { pair, card } = await describeMatch(toRide, fromRide);
        result.push({
          id: row.rq_id,
          status: row.rq_status,
          createdAt: new Date(row.rq_created_at).toISOString(),
          fromRide,
          fromUser: toUser(row),
          toRide,
          match: pair.matched ? card : null,
        });
      }
      return result;
    });

    // ---- Shared trip: order of stops and the real fare split ----------------
    auth.get('/rides/:id/trip', async (req) => getTrip((req.params as { id: string }).id, me(req)));

    auth.put('/rides/:id/trip/fare', async (req) =>
      saveFareSplit((req.params as { id: string }).id, me(req), parse(fareSplitSchema, req.body)),
    );

    auth.post('/rides/:id/trip/payments/:fromRideId', async (req) => {
      const { id, fromRideId } = req.params as { id: string; fromRideId: string };
      const { paid } = (req.body ?? {}) as { paid?: boolean };
      return setPaid(id, me(req), fromRideId, paid !== false);
    });

    const answer = (status: 'accepted' | 'rejected') => async (req: FastifyRequest) => {
      const id = (req.params as { id: string }).id;
      const rq = await one(
        `SELECT rq.*, tr.user_id AS owner_id, tr.seats FROM ride_requests rq
           JOIN rides tr ON tr.id = rq.to_ride_id WHERE rq.id = $1`,
        [id],
      );
      if (!rq) throw new HttpError(404, 'Request not found');
      if (rq.owner_id !== me(req)) throw new HttpError(403, 'Not your request to answer');
      if (rq.status !== 'pending') throw new HttpError(409, 'Request already answered');
      await query(`UPDATE ride_requests SET status = $2, updated_at = now() WHERE id = $1`, [id, status]);
      if (status === 'accepted') {
        // Close the ride for new requests once all seats are taken.
        await query(
          `UPDATE rides SET status = 'matched'
            WHERE id = $1 AND seats <= (SELECT count(*) FROM ride_requests
                                         WHERE to_ride_id = $1 AND status = 'accepted')`,
          [rq.to_ride_id],
        );
        await query(`UPDATE rides SET status = 'matched' WHERE id = $1`, [rq.from_ride_id]);
        // Rides that are now full turn down their other waiting requests.
        await query(
          `UPDATE ride_requests SET status = 'rejected', updated_at = now()
            WHERE status = 'pending'
              AND (to_ride_id IN (SELECT id FROM rides WHERE id IN ($1, $2) AND status = 'matched')
                OR from_ride_id = $2)`,
          [rq.to_ride_id, rq.from_ride_id],
        );
      }
      return { id, status };
    };
    auth.post('/requests/:id/accept', answer('accepted'));
    auth.post('/requests/:id/reject', answer('rejected'));
  });

  return app;
}
