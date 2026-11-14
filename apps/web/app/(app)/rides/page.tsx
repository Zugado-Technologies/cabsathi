'use client';

import type { Ride } from '@cabsathi/shared';
import { Car, Circle, MapPin, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Empty } from '@/components/ui';
import { WaveHeader } from '@/components/WaveHeader';
import { api } from '@/lib/api';
import { dayLabel, rupees, timeLabel } from '@/lib/format';

const STATUS = {
  published: { label: 'Looking for matches', bg: '#EEF2FA', fg: 'var(--primary)' },
  matched: { label: 'Matched', bg: 'var(--green-light)', fg: 'var(--green-dark)' },
  cancelled: { label: 'Cancelled', bg: '#FDECEC', fg: 'var(--red)' },
  completed: { label: 'Completed', bg: '#F1F4F9', fg: 'var(--muted)' },
};

export default function Rides() {
  const [rides, setRides] = useState<Ride[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .myRides()
      .then(setRides)
      .catch((e) => {
        setError((e as Error).message);
        setRides([]);
      });
  }, []);

  return (
    <>
      <WaveHeader title="My Rides" />
      <div className="app-body">
        {error && <p className="error">{error}</p>}
        {rides === null ? (
          <div className="empty">Loading…</div>
        ) : rides.length === 0 ? (
          <>
            <Empty icon={<Car size={36} color="var(--faint)" />} title="No rides yet" body="Create a ride and we’ll find people going your way." />
            <Link href="/create-ride" className="btn-green">
              <Plus size={24} strokeWidth={3} /> Create Ride
            </Link>
          </>
        ) : (
          rides.map((r) => {
            const s = STATUS[r.status];
            return (
              <Link key={r.id} href={`/matches/${r.id}`} className="card stack">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <b style={{ flex: 1, fontSize: 16 }}>
                    {dayLabel(r.departAt)}, {timeLabel(r.departAt)}
                  </b>
                  <span className="pill" style={{ background: s.bg, color: s.fg }}>
                    {s.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Circle size={10} color="var(--red)" fill="var(--red)" /> {r.from.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={12} color="var(--green)" fill="var(--green)" /> {r.to.name}
                </div>
                <span className="muted" style={{ fontSize: 13 }}>
                  {r.distanceKm} km · {r.seats} seat{r.seats > 1 ? 's' : ''} · solo fare approx {rupees(r.soloFare)}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
