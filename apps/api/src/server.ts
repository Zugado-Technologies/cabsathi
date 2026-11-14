import Fastify from 'fastify';
import { buildApp } from './buildApp';
import { stripApiPrefix } from './paths';
import { env } from './env';
import { migrate } from './migrate';

// Locally, new database migrations run on start. On Vercel they are run once by hand.
if (env.migrateOnStart) await migrate();
// Fastify is created here (not in a helper) because Vercel looks for an entry file that imports it.
const app = buildApp(Fastify({ logger: { level: 'info' }, rewriteUrl: (req) => stripApiPrefix(req.url) }));
await app.listen({ port: env.port, host: '0.0.0.0' });
