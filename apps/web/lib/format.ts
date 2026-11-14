/** Display helpers. All times shown in India time. */
const TZ = 'Asia/Kolkata';

export function dayLabel(iso: string) {
  const d = new Date(iso);
  const key = (x: Date) => x.toLocaleDateString('en-CA', { timeZone: TZ });
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400_000);
  const date = d.toLocaleDateString('en-IN', { timeZone: TZ, month: 'long', day: 'numeric' });
  if (key(d) === key(today)) return `Today, ${date}`;
  if (key(d) === key(tomorrow)) return `Tomorrow, ${date}`;
  return d.toLocaleDateString('en-IN', { timeZone: TZ, weekday: 'short', month: 'long', day: 'numeric' });
}

export function shortDay(iso: string) {
  return dayLabel(iso).split(',')[0];
}

export function timeLabel(iso: string) {
  return new Date(iso)
    .toLocaleTimeString('en-IN', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true })
    .toUpperCase();
}

export function greeting() {
  const h = Number(new Date().toLocaleString('en-IN', { timeZone: TZ, hour: 'numeric', hour12: false }));
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export function initials(name: string | null) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

/** A Date for day offset (0 = today) at hh:mm India time. */
export function istDate(dayOffset: number, minutesOfDay: number) {
  const ist = new Date(Date.now() + 5.5 * 3600_000);
  const utc = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + dayOffset, 0, minutesOfDay);
  return new Date(utc - 5.5 * 3600_000);
}
