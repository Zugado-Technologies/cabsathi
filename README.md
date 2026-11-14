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
npm run test:multi-user   # 7 test users against the running API: who matches whom, gender filter, seats
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

## Maps, routes and fare comparison

| Setting | Where | What it turns on |
|---|---|---|
| `MAPPLS_REST_KEY` | `apps/api/.env` | Mappls (MapmyIndia), used first: place search (Autosuggest), road routes with traffic (Route ETA, then Route ADV), and real road distances between stops for matching (Distance Matrix ETA, cached for 6 hours) |
| `GOOGLE_MAPS_API_KEY` | `apps/api/.env` | Google place search and routes, used if Mappls is not set or fails |
| `OSRM_URL` | `apps/api/.env` | Our own free routing server, used when neither of the above works |
| `NEXT_PUBLIC_MAPPLS_MAP_KEY` | `apps/web/.env.local` | The Mappls map on Create Ride and Matching Rides (whitelist the site address in the Mappls console) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `apps/web/.env.local` | Google map, used if there is no Mappls map key |

With none of these set, everything still works locally: place search uses a built-in
Delhi NCR list, distances are estimated (straight line x 1.3), and the map is a drawn preview.

Fare comparison (Uber, Ola, Rapido, inDrive) uses fare cards in
`packages/shared/src/fareCards.ts`. The rates there are placeholders: check them
against each company's published rates before launch. No company gives live prices.

## Not connected yet

| Real service | Local stand-in |
|---|---|
| SMS OTP (MSG91 + DLT) | Fixed code `123456` |

## Hosting on Vercel

Two Vercel projects from this one repository:

| Project | Root Directory | Notes |
|---|---|---|
| `cabsathi-web` | `apps/web` | Next.js, detected automatically (`apps/web/vercel.json`) |
| `cabsathi-api` | `apps/api` | Builds one bundled function with `npm run build:vercel` (`apps/api/vercel.json`) |

Keep "Include files outside the root directory" switched on (the default) for both.
Set the Functions region to Mumbai (`bom1`) for both.

**Database:** a Postgres with PostGIS, e.g. Neon from the Vercel Marketplace (Mumbai or
Singapore region). Run the migrations once, and again whenever a new file is added to
`apps/api/migrations`:

```bash
DATABASE_URL="<the database URL>" npm run migrate -w @cabsathi/api
```

**Environment variables for `cabsathi-api`:**

| Name | Value |
|---|---|
| `DATABASE_URL` | The pooled database URL |
| `JWT_SECRET` | A long random string (`openssl rand -hex 32`) |
| `OTP_DEV_MODE` | `false` |
| `OTP_TEST_PHONES` | Test numbers that may log in with 123456 until SMS is set up, comma-separated |
| `CORS_ORIGINS` | The website address, e.g. `https://cabsathi-web.vercel.app` |
| `MAPPLS_REST_KEY` | Mappls key |
| `DB_POOL_MAX` | `3` |

**Environment variables for `cabsathi-web`:**

| Name | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | The API address, e.g. `https://cabsathi-api.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | The website address |
| `NEXT_PUBLIC_MAPPLS_MAP_KEY` | Mappls key (whitelist the website address in the Mappls console) |
