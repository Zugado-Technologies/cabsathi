'use client';

import type { GenderPref, Place, RideEstimate } from '@cabsathi/shared';
import { CalendarDays, ChevronRight, CircleCheck, LockOpen, MapPin, ShieldCheck, User, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { FareCompare } from '@/components/FareCompare';
import { RouteMap, type MapPoint } from '@/components/RouteMap';
import { PlaceField } from '@/components/PlaceField';
import { SeatSlider } from '@/components/SeatSlider';
import { WaveHeader } from '@/components/WaveHeader';
import { api } from '@/lib/api';
import { currentPosition } from '@/lib/location';
import { dayLabel, istDate, rupees, timeLabel } from '@/lib/format';
import { useSession } from '@/lib/session';

/** "HH:MM" India time at least 30 minutes from now, rounded up to 15 minutes. */
function defaultSlot() {
  const ist = new Date(Date.now() + 5.5 * 3600_000 + 30 * 60_000);
  const mins = Math.ceil((ist.getUTCHours() * 60 + ist.getUTCMinutes()) / 15) * 15;
  return { day: mins >= 1440 ? 1 : 0, minutes: mins % 1440 };
}

const toHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export default function CreateRide() {
  const router = useRouter();
  const { user } = useSession();
  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [day, setDay] = useState(() => defaultSlot().day);
  const [minutes, setMinutes] = useState(() => defaultSlot().minutes);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [seats, setSeats] = useState(1);
  const [genderPref, setGenderPref] = useState<GenderPref>('any');
  const [estimate, setEstimate] = useState<RideEstimate | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(true);

  // Start from where the person is now. If location is blocked, they type or pick on the map.
  useEffect(() => {
    let cancelled = false;
    currentPosition()
      .then((at) => api.reversePlace(at.lat, at.lng))
      .then((here) => !cancelled && setFrom((prev) => prev ?? here))
      .catch(() => {})
      .finally(() => !cancelled && setLocating(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const departAt = istDate(day, minutes);
  const mapPoints = useMemo<MapPoint[]>(
    () =>
      from && to
        ? [
            { ...from, kind: 'pickup', label: from.name },
            { ...to, kind: 'drop', label: to.name },
          ]
        : [],
    [from, to],
  );
  const iso = departAt.toISOString();

  useEffect(() => {
    setEstimate(null);
    if (from && to) api.estimate(from, to).then(setEstimate).catch(() => {});
  }, [from, to]);

  const submit = async () => {
    if (!from || !to) return setError('Choose where you start and where you are going');
    if (departAt.getTime() < Date.now()) return setError('Pick a time in the future');
    if (genderPref === 'same' && !user?.gender) return setError('Add your gender in Profile to use “Same gender only”');
    setError(null);
    setSaving(true);
    try {
      const ride = await api.createRide({ from, to, departAt: iso, seats, genderPref });
      router.push(`/matches/${ride.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <>
      <WaveHeader title="Create a Ride" back />
      <div className="app-body">
        <section className="card stack" style={{ position: 'relative', zIndex: 5 }}>
          <Label icon={<MapPin size={20} color="var(--orange)" fill="var(--orange)" fillOpacity={0.25} />} text="From" />
          <PlaceField label="From" value={from} onChange={setFrom} placeholder={locating && !from ? 'Finding your location…' : 'Where are you starting?'} pinColor="var(--red)" trailing="clear" />
          <Label icon={<MapPin size={20} color="var(--green)" fill="var(--green)" fillOpacity={0.25} />} text="To" />
          <PlaceField label="To" value={to} onChange={setTo} placeholder="Where are you going?" pinColor="var(--green)" trailing="search" />
          <button
            type="button"
            className="field"
            style={{ padding: '12px', marginTop: 4, width: '100%' }}
            onClick={() => setPickerOpen((o) => !o)}
            aria-expanded={pickerOpen}
          >
            <CalendarDays size={20} color="var(--primary)" />
            <span style={{ fontSize: 16 }}>{dayLabel(iso)}</span>
            <span style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 6px' }} />
            <span style={{ fontSize: 16 }}>{timeLabel(iso)}</span>
          </button>
          {pickerOpen && (
            <div className="stack" style={{ paddingTop: 4 }}>
              <div className="chips">
                {[0, 1, 2].map((d) => (
                  <button key={d} type="button" className={`chip ${day === d ? 'on' : ''}`} onClick={() => setDay(d)}>
                    {d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : dayLabel(istDate(2, 0).toISOString()).split(',')[0]}
                  </button>
                ))}
              </div>
              <label className="field" style={{ padding: '0 12px' }}>
                <span className="muted" style={{ fontSize: 14 }}>
                  Leaving at
                </span>
                <input
                  type="time"
                  step={300}
                  value={toHHMM(minutes)}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(':').map(Number);
                    if (!Number.isNaN(h) && !Number.isNaN(m)) setMinutes(h * 60 + m);
                  }}
                  aria-label="Departure time"
                />
              </label>
            </div>
          )}
        </section>

        {from && to && (
          <section className="card stack" aria-label="Route">
            <RouteMap points={mapPoints} polyline={estimate?.polyline} height={170} />
          </section>
        )}

        <section className="card stack">
          <Label icon={<Users size={20} color="var(--primary)" />} text="Seats" />
          <div className="field" style={{ padding: 12 }}>
            <User size={18} color="var(--muted)" fill="var(--muted)" />
            <span style={{ flex: 1, fontSize: 16 }}>
              {seats} seat{seats > 1 ? 's' : ''}
            </span>
            <ChevronRight size={18} color="var(--faint)" />
          </div>
          <SeatSlider value={seats} onChange={setSeats} />
        </section>

        <section className="card stack">
          <Label icon={<ShieldCheck size={20} color="var(--primary)" />} text="Gender preference" />
          <div className="segment" role="radiogroup" aria-label="Gender preference">
            {(
              [
                ['any', 'Open to all'],
                ['same', 'Same gender only'],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={genderPref === v}
                className={genderPref === v ? 'on' : ''}
                onClick={() => setGenderPref(v)}
              >
                {v === 'any' && <LockOpen size={14} />}
                {label}
              </button>
            ))}
          </div>
        </section>

        {estimate && from && to && (
          <FareCompare km={estimate.distanceKm} minutes={estimate.durationMin} from={from} to={to} />
        )}

        <div className="stack">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 17 }} className="muted">
              Approx: <b style={{ color: 'var(--primary)' }}>{estimate ? rupees(estimate.soloFare) : '—'}</b>
            </span>
            <span className="muted">Suggested</span>
            <CircleCheck size={16} color="#fff" fill="var(--green)" />
            {estimate && (
              <span className="faint" style={{ fontSize: 13 }}>
                · {estimate.distanceKm} km · {estimate.durationMin} min
              </span>
            )}
          </div>
          {error && <p className="error">{error}</p>}
          <button type="button" className="btn-green" onClick={submit} disabled={saving}>
            {saving ? 'Creating…' : 'Create Ride'}
          </button>
        </div>
      </div>
    </>
  );
}

function Label({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="label">
      {icon}
      {text}
    </div>
  );
}
