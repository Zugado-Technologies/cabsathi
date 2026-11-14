import { createHash, randomInt } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { one, query } from './db';
import { env } from './env';

const DEV_CODE = '123456';
const OTP_TTL_MIN = 5;
const MAX_ATTEMPTS = 5;

const hash = (phone: string, code: string) =>
  createHash('sha256').update(`${phone}:${code}:${env.jwtSecret}`).digest('hex');

export async function sendOtp(phone: string) {
  const code = env.otpDevMode ? DEV_CODE : String(randomInt(100000, 1000000));
  await query(
    `INSERT INTO otp_codes (phone, code_hash, expires_at, attempts)
     VALUES ($1, $2, now() + make_interval(mins => $3), 0)
     ON CONFLICT (phone) DO UPDATE
       SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, attempts = 0`,
    [phone, hash(phone, code), OTP_TTL_MIN],
  );
  if (env.otpDevMode) {
    console.log(`[dev] OTP for ${phone} is ${code}`);
  } else {
    // TODO: send through the SMS provider (MSG91) once DLT registration is done.
    throw new Error('SMS provider not configured');
  }
}

/** Returns the user id when the code is right, otherwise null. */
export async function verifyOtp(phone: string, code: string): Promise<string | null> {
  const row = await one(
    `UPDATE otp_codes SET attempts = attempts + 1
      WHERE phone = $1 AND expires_at > now() AND attempts < $2
      RETURNING code_hash`,
    [phone, MAX_ATTEMPTS],
  );
  if (!row || row.code_hash !== hash(phone, code)) return null;
  await query('DELETE FROM otp_codes WHERE phone = $1', [phone]);
  const user = await one(
    `INSERT INTO users (phone) VALUES ($1)
     ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
     RETURNING id`,
    [phone],
  );
  return user!.id;
}

/** Fastify pre-handler: requires a valid login token. */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch {
    return reply.code(401).send({ error: 'Please log in again' });
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}
