import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const envFile = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
};

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  otpDevMode: process.env.OTP_DEV_MODE === 'true',
  /**
   * Phone numbers (comma-separated, 10 digits) that may log in with the test code
   * 123456 when OTP_DEV_MODE is off, e.g. on a hosted test site before SMS is set up.
   */
  otpTestPhones: new Set(
    (process.env.OTP_TEST_PHONES ?? '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean),
  ),
  /** Websites allowed to call the API (comma-separated). Empty = any (local development only). */
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean),
  /** Database connections per server. Keep small on Vercel, where many copies can run. */
  dbPoolMax: Number(process.env.DB_POOL_MAX ?? 10),
  /** On Vercel, migrations are run once by hand (`npm run migrate`), not on every start. */
  migrateOnStart: process.env.MIGRATE_ON_START ? process.env.MIGRATE_ON_START === 'true' : !process.env.VERCEL,
  /** Mappls (MapmyIndia) static key: place search, routes, distance matrix. Tried first. */
  mapplsKey: process.env.MAPPLS_REST_KEY || null,
  /** Server-side Google key (Places API (New) + Routes API). Empty = use local stand-ins. */
  googleMapsKey: process.env.GOOGLE_MAPS_API_KEY || null,
  /** Our own OSRM server, e.g. http://localhost:5000. Used when there's no Google key. */
  osrmUrl: process.env.OSRM_URL?.replace(/\/$/, '') || null,
};
