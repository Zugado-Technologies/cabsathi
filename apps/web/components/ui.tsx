import { Check, Star, StarHalf } from 'lucide-react';
import { initials } from '@/lib/format';

const AVATAR_BG = ['#DBEAFE', '#FCE7F3', '#DCFCE7', '#FEF3C7', '#EDE9FE'];
const AVATAR_FG = ['#1D4ED8', '#BE185D', '#15803D', '#B45309', '#6D28D9'];

export function Avatar({ name, size = 44, verified }: { name: string | null; size?: number; verified?: boolean }) {
  const i = (name ?? '').length % AVATAR_BG.length;
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: AVATAR_BG[i], color: AVATAR_FG[i], fontSize: size * 0.36 }}
    >
      {initials(name)}
      {verified && (
        <span className="tick" aria-label="Verified">
          <Check size={10} strokeWidth={4} />
        </span>
      )}
    </span>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) =>
        rating >= n - 0.25 ? (
          <Star key={n} size={13} fill="currentColor" strokeWidth={0} />
        ) : rating >= n - 0.75 ? (
          <StarHalf key={n} size={13} fill="currentColor" strokeWidth={0} />
        ) : (
          <Star key={n} size={13} strokeWidth={1.5} />
        ),
      )}
    </span>
  );
}

export function Empty({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="empty">
      {icon}
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
