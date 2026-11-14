import type { Ride, UserPublic } from '@cabsathi/shared';
import { BadgeCheck, CarFront, Clock, Navigation } from 'lucide-react';
import type { ReactNode } from 'react';
import { shortDay, timeLabel } from '@/lib/format';
import { Avatar, Stars } from './ui';

const LEVEL = { exact: 'Exact match', nearby: 'Nearby match', flexible: 'Flexible match' } as const;

/** One ride card on the Matching Rides screen, laid out like the mockup. */
export function MatchCard({
  ride,
  user,
  level,
  overlapPct,
  pickupGapKm,
  minsToMeet,
  shareRange,
  action,
}: {
  ride: Ride;
  user: UserPublic;
  level: keyof typeof LEVEL;
  overlapPct: number;
  pickupGapKm: number;
  minsToMeet: number;
  shareRange: { min: number; max: number };
  action: ReactNode;
}) {
  return (
    <article className="card match">
      <div className="top">
        <div className="title">
          <CarFront size={20} color="var(--primary)" />
          {ride.from.name}
        </div>
        <div className="meta">
          <Navigation size={12} color="var(--green)" fill="var(--green)" />
          <span>
            to {ride.to.name} · Approx {Math.round(ride.distanceKm)} km · {shortDay(ride.departAt)}{' '}
            {timeLabel(ride.departAt)} · {ride.seats} Seat{ride.seats > 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <div className="person">
        <Avatar name={user.name} verified={user.verified} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="name">
            {user.name ?? 'CabSathi user'}
            {user.age ? ` ${user.age}` : ''}
            {user.verified && <BadgeCheck size={16} color="#fff" fill="var(--green)" />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <Stars rating={user.rating} />
            <span className="muted" style={{ fontSize: 12 }}>
              {overlapPct}% shared
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14 }}>{pickupGapKm} km away</div>
          <div className="muted" style={{ fontSize: 12, display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'flex-end', marginTop: 3 }}>
            <Clock size={12} color="var(--green)" />
            {minsToMeet} min{minsToMeet === 1 ? '' : 's'} to meet
          </div>
        </div>
      </div>
      <div className="price-box">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="price">
              ₹{shareRange.min} - ₹{shareRange.max}
            </span>
            <span className="per">
              per
              <br />
              person
            </span>
          </div>
          <div className="muted" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--orange)' }} />
            {LEVEL[level]} · suggested fare
          </div>
        </div>
        {action}
      </div>
    </article>
  );
}
