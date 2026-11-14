# CabSathi

Share a cab with people going your way and split the fare.

One TypeScript codebase:

| Folder | What it is |
|---|---|
| `apps/web` | Website (Next.js): public SEO pages + the logged-in app, mobile-first |
| `apps/mobile` | Expo (React Native) app for Android/iOS — paused; the website comes first |
| `apps/api` | Node.js API (Fastify + PostgreSQL/PostGIS) |
| `packages/shared` | Code used by both: matching rules, fare split, data types, input checks |

## Run locally

Needs Node 20+ and Docker Desktop.

```bash
npm install
cp apps/api/.env.example apps/api/.env
npm run db:up        # local PostgreSQL + PostGIS in Docker (port 5433)
npm run db:seed      # demo people with rides tomorrow morning (Noida -> Gurgaon)
npm run api          # API on http://localhost:4000
npm run web          # website on http://localhost:3000
```

Login in local mode: any 10-digit mobile number, OTP is always `123456`.
To see matches, create a ride from Sector 62, Noida to Cyber Hub, Gurgaon tomorrow around 10:30 AM.

```bash
npm test             # matching and fare tests
npm run typecheck
```

## Website pages

| Page | Who it's for |
|---|---|
| `/`, `/cab-sharing/[route]`, `/faq`, `/safety` | Public, server-rendered, in the sitemap |
| `/home`, `/create-ride`, `/matches/[id]`, `/rides`, `/messages`, `/profile` | Logged-in app, not indexed |

## Matching rules

See `packages/shared/src/matching.ts` and `packages/shared/src/config.ts`.
Formulas follow the CabSathi Matching Formula document; limits use the shorter
of the two trips and each person's detour is checked against their own limit.

## Not connected yet (local stand-ins)

| Real service | Local stand-in |
|---|---|
| SMS OTP (MSG91 + DLT) | Fixed code `123456` |
| Google Places search | Built-in list of Delhi NCR places |
| Google Routes / OSRM distances | Straight-line distance x 1.3, 24 km/h |
