import { NCR_PLACES, type Place } from '@cabsathi/shared';
import { pool, query, one } from './db';
import { migrate } from './migrate';
import { estimateTrip } from './routing';

/**
 * Demo people and rides for local testing. Re-running replaces them.
 * All demo phones start with 90000000.
 */
const at = (name: string, dLat = 0, dLng = 0): Place => {
  const p = NCR_PLACES.find((x) => x.name === name)!;
  return { name: p.name, lat: p.lat + dLat, lng: p.lng + dLng };
};

/** Tomorrow at the given India time, as ISO. */
function tomorrowIST(hh: number, mm: number) {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 3600_000);
  const d = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + 1, hh, mm));
  return new Date(d.getTime() - 5.5 * 3600_000).toISOString();
}

const people = [
  { phone: '9000000001', name: 'Nikita', gender: 'female', age: 26, rating: 4.4, rides: 12, verified: true,
    from: at('Sector 62, Noida', 0.006, 0.008), to: at('Cyber Hub, Gurgaon'), time: [10, 30] },
  { phone: '9000000002', name: 'Raj Malhotra', gender: 'male', age: 29, rating: 4.3, rides: 8, verified: true,
    from: at('Sector 62, Noida', -0.008, 0.009), to: at('DLF Cyber City, Gurgaon'), time: [10, 25] },
  { phone: '9000000003', name: 'Vishal Ahuja', gender: 'male', age: 32, rating: 4.8, rides: 31, verified: true,
    from: at('Sector 63, Noida'), to: at('DLF Phase 3, Gurgaon'), time: [10, 40] },
  { phone: '9000000004', name: 'Neha Sharma', gender: 'female', age: 24, rating: 4.9, rides: 5, verified: false,
    from: at('Sector 62, Noida', 0.002, -0.004), to: at('Udyog Vihar, Gurgaon'), time: [10, 35] },
  { phone: '9000000005', name: 'Arjun Mehta', gender: 'male', age: 35, rating: 4.6, rides: 19, verified: true,
    from: at('Indirapuram, Ghaziabad'), to: at('Noida City Centre'), time: [9, 0] },
] as const;

async function seed() {
  await migrate();
  await query(`DELETE FROM users WHERE phone LIKE '90000000%'`);
  const year = new Date().getFullYear();
  for (const p of people) {
    const user = await one(
      `INSERT INTO users (phone, name, gender, birth_year, rating, rides_count, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [p.phone, p.name, p.gender, year - p.age, p.rating, p.rides, p.verified],
    );
    const est = await estimateTrip(p.from, p.to);
    await query(
      `INSERT INTO rides (user_id, from_name, from_point, to_name, to_point, depart_at, seats,
                          gender_pref, distance_km, duration_min, solo_fare)
       VALUES ($1, $2, ST_MakePoint($3, $4)::geography, $5, ST_MakePoint($6, $7)::geography,
               $8, 1, 'any', $9, $10, $11)`,
      [user!.id, p.from.name, p.from.lng, p.from.lat, p.to.name, p.to.lng, p.to.lat,
       tomorrowIST(p.time[0], p.time[1]), est.distanceKm, est.durationMin, est.soloFare],
    );
  }
  console.log(`Seeded ${people.length} demo people with rides for tomorrow morning.`);
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
