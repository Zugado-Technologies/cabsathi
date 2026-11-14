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
  /** Server-side Google key (Places API (New) + Routes API). Empty = use local stand-ins. */
  googleMapsKey: process.env.GOOGLE_MAPS_API_KEY || null,
  /** Our own OSRM server, e.g. http://localhost:5000. Used when there's no Google key. */
  osrmUrl: process.env.OSRM_URL?.replace(/\/$/, '') || null,
};
