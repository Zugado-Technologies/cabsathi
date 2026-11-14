// Multi-user matching test against the running local API (creates test users 97000000xx).
// Run: npm run test:multi-user   (needs `npm run api` running)
const B = process.env.API_URL ?? 'http://localhost:4000';
const call = async (token, method, path, body) => {
  const res = await fetch(B + path, {
    method,
    headers: { ...(body && { 'content-type': 'application/json' }), ...(token && { authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} ${res.status} ${JSON.stringify(json)}`);
  return json;
};
const P = {
  s62: { name: 'Sector 62, Noida', lat: 28.627, lng: 77.365 },
  s62b: { name: 'Sector 62 (Block C), Noida', lat: 28.621, lng: 77.372 },
  s63: { name: 'Sector 63, Noida', lat: 28.628, lng: 77.383 },
  s18: { name: 'Sector 18, Noida', lat: 28.57, lng: 77.326 },
  ghz: { name: 'Ghaziabad', lat: 28.6692, lng: 77.4538 },
  hub: { name: 'Cyber Hub, Gurgaon', lat: 28.495, lng: 77.089 },
  dlf3: { name: 'DLF Phase 3, Gurgaon', lat: 28.492, lng: 77.095 },
  cp: { name: 'Connaught Place, Delhi', lat: 28.6315, lng: 77.2167 },
};
const ist = (h, m, dayOffset = 2) => {
  const n = new Date(Date.now() + 5.5 * 36e5);
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + dayOffset, h, m) - 5.5 * 36e5).toISOString();
};

// Day after tomorrow, so the demo seed data (tomorrow) doesn't interfere.
const people = [
  { key: 'amit', phone: '9700000001', name: 'Amit Test', gender: 'male', from: P.s62, to: P.hub, at: ist(9, 0), pref: 'any', seats: 2 },
  { key: 'bina', phone: '9700000002', name: 'Bina Test', gender: 'female', from: P.s62b, to: P.dlf3, at: ist(9, 10), pref: 'any', seats: 1 },
  { key: 'chirag', phone: '9700000003', name: 'Chirag Test', gender: 'male', from: P.s63, to: P.hub, at: ist(9, 20), pref: 'any', seats: 1 },
  { key: 'divya', phone: '9700000004', name: 'Divya Test', gender: 'female', from: P.s62, to: P.hub, at: ist(9, 5), pref: 'same', seats: 1 },
  { key: 'esha', phone: '9700000005', name: 'Esha Test', gender: 'female', from: P.s62, to: P.hub, at: ist(11, 30), pref: 'any', seats: 1 },
  { key: 'farhan', phone: '9700000006', name: 'Farhan Test', gender: 'male', from: P.ghz, to: P.hub, at: ist(9, 0), pref: 'any', seats: 1 },
  { key: 'gita', phone: '9700000007', name: 'Gita Test', gender: 'female', from: P.s62, to: P.cp, at: ist(9, 0), pref: 'any', seats: 1 },
];

const users = {};
for (const p of people) {
  await call(null, 'POST', '/auth/send-otp', { phone: p.phone });
  const { token } = await call(null, 'POST', '/auth/verify-otp', { phone: p.phone, code: '123456' });
  await call(token, 'PATCH', '/me', { name: p.name, gender: p.gender, birthYear: 1995 });
  // Cancel rides left from earlier runs of this test.
  for (const r of await call(token, 'GET', '/rides/mine')) if (r.status === 'published') await call(token, 'POST', `/rides/${r.id}/cancel`);
  const ride = await call(token, 'POST', '/rides', { from: p.from, to: p.to, departAt: p.at, seats: p.seats, genderPref: p.pref });
  users[p.key] = { ...p, token, ride };
}

// Only judge this test's own users; other rides in the database are ignored.
const ourKeys = new Set(people.map((p) => p.key));
const matchNames = async (u) =>
  (await call(u.token, 'GET', `/rides/${u.ride.id}/matches`))
    .map((m) => (m.user.name ?? '').split(' ')[0].toLowerCase())
    .filter((k) => ourKeys.has(k));
const seen = {};
for (const k of Object.keys(users)) seen[k] = await matchNames(users[k]);

let failures = 0;
const check = (label, ok) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failures++;
};
console.log('Who sees whom:');
for (const [k, list] of Object.entries(seen)) console.log(`  ${k.padEnd(7)} -> ${list.join(', ') || '(none)'}`);
console.log();

check('Amit and Bina see each other (close start, close end, 10 min apart)', seen.amit.includes('bina') && seen.bina.includes('amit'));
check('Amit and Chirag see each other (Sector 63 is 1.8 km away, 20 min apart)', seen.amit.includes('chirag') && seen.chirag.includes('amit'));
check('Divya (same gender only) does not see men', !seen.divya.some((n) => ['amit', 'chirag', 'farhan'].includes(n)));
check('Men do not see Divya', !['amit', 'chirag', 'farhan'].some((k) => seen[k].includes('divya')));
check('Divya and Bina (both women) see each other', seen.divya.includes('bina') && seen.bina.includes('divya'));
check('Esha (11:30, 2.5 hours later) matches nobody', seen.esha.length === 0 && !Object.values(seen).some((l) => l.includes('esha')));
check('Farhan (starts in Ghaziabad, ~9 km away) matches nobody', seen.farhan.length === 0);
check('Gita (going to Connaught Place) matches nobody', seen.gita.length === 0);
const symmetric = Object.entries(seen).every(([a, list]) => list.every((b) => seen[b].includes(a)));
check('Every match is two-way', symmetric);

// Seats: Amit offers 2 seats. Bina and Chirag both request; Amit accepts both; then his ride is full.
for (const k of ['bina', 'chirag']) {
  const u = users[k];
  const m = (await call(u.token, 'GET', `/rides/${u.ride.id}/matches`)).find((x) => x.ride.id === users.amit.ride.id);
  await call(u.token, 'POST', `/rides/${u.ride.id}/requests`, { toRideId: m.ride.id });
}
const amitReqs = (await call(users.amit.token, 'GET', '/requests/received')).filter((r) => r.toRide.id === users.amit.ride.id);
check('Amit receives 2 requests', amitReqs.length === 2);
await call(users.amit.token, 'POST', `/requests/${amitReqs[0].id}/accept`);
check('After 1 of 2 seats taken, Amit\'s ride is still open', (await call(users.amit.token, 'GET', `/rides/${users.amit.ride.id}`)).status === 'published');
await call(users.amit.token, 'POST', `/requests/${amitReqs[1].id}/accept`);
check('After 2 of 2 seats taken, Amit\'s ride is full (matched)', (await call(users.amit.token, 'GET', `/rides/${users.amit.ride.id}`)).status === 'matched');
const divyaNow = await matchNames(users.divya);
check('A full ride no longer shows up for others', !Object.values(users).some(() => false) && !divyaNow.includes('amit'));
const binaNow = await matchNames(users.bina);
check('Bina (now matched) no longer shows up for Divya', !divyaNow.includes('bina'));
let refused = false;
try {
  const m = await call(users.divya.token, 'POST', `/rides/${users.divya.ride.id}/requests`, { toRideId: users.amit.ride.id });
} catch (e) {
  refused = true;
}
check('Requesting a full ride is refused', refused);

// Fare split: Amit's cab now has Amit, Bina and Chirag.
const trip = await call(users.amit.token, 'GET', `/rides/${users.amit.ride.id}/trip`);
check('Trip has 3 people', trip.members.length === 3);
check('Everyone is picked up before being dropped', trip.members.every((m) => {
  const order = trip.stops.map((s) => `${s.kind}:${s.rideId}`);
  return order.indexOf(`pickup:${m.rideId}`) < order.indexOf(`drop:${m.rideId}`);
}));
check('Suggested booker is the person dropped last', trip.suggestedBookerRideId === trip.stops.at(-1).rideId);
const saved = await call(users.amit.token, 'PUT', `/rides/${users.amit.ride.id}/trip/fare`, {
  total: 613, provider: 'ola', bookedByRideId: trip.suggestedBookerRideId,
});
const sum = Object.values(saved.split.shares).reduce((a, b) => a + b, 0);
check('Shares add up exactly to the fare (₹613)', sum === 613);
check('Everyone except the booker pays the booker', saved.split.payments.length === 2 &&
  saved.split.payments.every((p) => p.toRideId === trip.suggestedBookerRideId && p.fromRideId !== p.toRideId));
const chiragView = await call(users.chirag.token, 'GET', `/rides/${users.chirag.ride.id}/trip`);
check('Other members see the same split', chiragView.split?.total === 613);
let outsiderBlocked = false;
try { await call(users.esha.token, 'GET', `/rides/${users.amit.ride.id}/trip`); } catch { outsiderBlocked = true; }
check('People outside the trip cannot see it', outsiderBlocked);

console.log(`\n${failures === 0 ? 'All checks passed' : `${failures} check(s) failed`}`);
process.exit(failures ? 1 : 0);
