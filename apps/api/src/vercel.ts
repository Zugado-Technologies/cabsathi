import type { IncomingMessage, ServerResponse } from 'node:http';
import Fastify from 'fastify';
import { buildApp } from './buildApp';

/**
 * Entry for Vercel. `scripts/build-vercel.mjs` bundles this file (with the shared
 * package) into one Vercel Function, and every request is passed to Fastify.
 * Database migrations are not run here: run `npm run migrate` once per release.
 */
const app = buildApp(Fastify({ logger: { level: 'info' } }));
const ready = app.ready();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await ready;
  app.server.emit('request', req, res);
}
