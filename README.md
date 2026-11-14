# CabSathi

Share a cab with people going your way and split the fare.

One TypeScript codebase:

| Folder | What it is |
|---|---|
| `apps/mobile` | Expo (React Native) app: Android, iOS and web |
| `apps/api` | Node.js API (Fastify + PostgreSQL/PostGIS) |
| `packages/shared` | Code used by both: matching rules, fare split, data types, input checks |

## Run locally

Needs Node 20+ and Docker.

```bash
npm install
npm run db:up      # local PostgreSQL + PostGIS in Docker (port 5433)
npm test           # matching and fare tests
```

## Matching rules

See `packages/shared/src/matching.ts` and `packages/shared/src/config.ts`.
Formulas follow the CabSathi Matching Formula document; limits use the shorter
of the two trips and each person's detour is checked against their own limit.
