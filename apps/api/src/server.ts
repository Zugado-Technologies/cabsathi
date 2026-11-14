import Fastify from 'fastify';
import { buildApp } from './buildApp';
import { env } from './env';
import { migrate } from './migrate';

// Locally, new database migrations run on start. On Vercel they are run once by hand.
if (env.migrateOnStart) await migrate();
const app = buildApp(Fastify({ logger: { level: 'info' } }));
await app.listen({ port: env.port, host: '0.0.0.0' });
