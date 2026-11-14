import { buildApp } from './app';
import { env } from './env';
import { migrate } from './migrate';

await migrate();
const app = buildApp();
await app.listen({ port: env.port, host: '0.0.0.0' });
