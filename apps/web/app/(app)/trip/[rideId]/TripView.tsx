'use client';

import { estimateMinutes, PROVIDERS, type Provider, type Trip } from '@cabsathi/shared';
import { ArrowRight, CircleCheck, Circle, Info, MapPin, ReceiptIndianRupee } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FareCompare } from '@/components/FareCompare';
import { RouteMap, type MapPoint } from '@/components/RouteMap';
import { Avatar } from '@/components/ui';
import { WaveHeader } from '@/components/WaveHeader';
import { api } from '@/lib/api';
import { dayLabel, timeLabel } from '@/lib/format';

const PROVIDER_NAME: Record<Provider, string> = {
  uber: 'Uber',
  ola: 'Ola',
  rapido: 'Rapido',
  indrive: 'inDrive',
  other: 'Other',
};

export function TripView({ rideId }: { rideId: string }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      setTrip(await api.trip(rideId));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [rideId]);

  useEffect(() => {
    load();
    // Others in the trip may enter the fare or mark payments; keep it fresh.
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 15_000);
    return () => clearInterval(t);
  }, [load]);

  const first = (name: string | null | undefined) => (name ?? 'Co-rider').split(' ')[0];
  const member = (id: string) => trip?.members.find((m) => m.rideId === id);
  const label = (id: string) => (member(id)?.isMe ? 'You' : first(member(id)?.user.name));

  const mapPoints = useMemo<MapPoint[]>(
    () =>
      (trip?.stops ?? []).map((s) => ({
        ...s.place,
        kind: s.kind === 'pickup' ? 'pickup' : 'drop',
        label: `${s.kind === 'pickup' ? 'Pick up' : 'Drop'} ${label(s.rideId)}`,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trip],
  );

  if (error && !trip) {
    return (
      <>
        <WaveHeader title="Your Trip" back="/rides" />
        <div className="app-body">
          <p className="error">{error}</p>
        </div>
      </>
    );
  }
  if (!trip) return <div className="empty">Loading your trip…</div>;

  const firstStop = trip.stops[0].place;
  const lastStop = trip.stops[trip.stops.length - 1].place;
  // Every stop between the first pickup and the final drop goes into the cab
  // app as a stop, in order; skip repeats of the same place.
  const middleStops = trip.stops.slice(1, -1).filter((s, i, all) => {
    const name = s.place.name;
    return name !== firstStop.name && name !== lastStop.name && (i === 0 || all[i - 1].place.name !== name);
  });
  const booker = member(trip.split?.bookedByRideId ?? trip.suggestedBookerRideId)!;

  return (
    <>
      <WaveHeader title="Your Trip" back="/rides" />
      <div className="app-body">
        <p className="muted" style={{ fontSize: 14 }}>
          {dayLabel(trip.departAt)}, {timeLabel(trip.departAt)} · {trip.members.length} people · ~{trip.totalKm} km
        </p>

        <section className={`booker-card ${booker.isMe ? 'me' : ''}`} aria-label="Who books the cab">
          <Avatar name={booker.user.name} size={44} verified={booker.user.verified} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>
              {booker.isMe ? 'You book this cab' : `${first(booker.user.name)} books this cab`}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.4, marginTop: 2 }}>
              {booker.isMe
                ? `You're dropped last, so the cab app trip ends with you. Everyone pays you their share.`
                : `${first(booker.user.name)} is dropped last, so the cab app trip ends with them. You'll pay them your share.`}
            </div>
          </div>
        </section>

        <section className="card stack" aria-label="People in this cab">
          <h3 className="label" style={{ fontSize: 16 }}>
            In this cab
          </h3>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {trip.members.map((m) => (
              <div key={m.rideId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar name={m.user.name} size={36} verified={m.user.verified} />
                <span style={{ fontWeight: 700 }}>{m.isMe ? 'You' : m.user.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card stack" aria-label="Pickup and drop order">
          <h3 className="label" style={{ fontSize: 16 }}>
            Pickup and drop order
          </h3>
          <RouteMap points={mapPoints} height={150} />
          <ol className="timeline">
            {trip.stops.map((s, i) => (
              <li key={i}>
                <MapPin size={16} color={s.kind === 'pickup' ? 'var(--red)' : 'var(--green)'} fill="currentColor" fillOpacity={0.15} />
                <span>
                  <b>
                    {s.kind === 'pickup' ? 'Pick up' : 'Drop'} {label(s.rideId)}
                  </b>
                  <span className="muted"> · {s.place.name}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="card stack" aria-label="Book the cab">
          <h3 className="label" style={{ fontSize: 16 }}>
            Book the cab
          </h3>
          {booker.isMe ? (
            <ol className="steps">
              <li>
                Open the cab app (estimates below; Uber opens with pickup and drop filled in).
              </li>
              <li>
                Set pickup to <b>{firstStop.name}</b> and drop to <b>{lastStop.name}</b>.
              </li>
              {middleStops.length > 0 && (
                <li>
                  Add {middleStops.length === 1 ? 'a stop' : 'stops in this order'}:{' '}
                  <b>{middleStops.map((s) => s.place.name).join(' → ')}</b>.
                </li>
              )}
              <li>After booking, enter the exact fare below so everyone sees their share.</li>
            </ol>
          ) : (
            <p style={{ fontSize: 14, lineHeight: 1.5 }}>
              {trip.split
                ? `${first(booker.user.name)} booked on ${trip.split.provider === 'other' ? 'a cab app' : trip.split.provider[0].toUpperCase() + trip.split.provider.slice(1)}.`
                : `${first(booker.user.name)} will book the cab and enter the exact fare here. This is roughly what to expect:`}
            </p>
          )}
          <FareCompare
            km={trip.totalKm}
            minutes={Math.round(estimateMinutes(trip.totalKm))}
            from={firstStop}
            to={lastStop}
            title="Estimated fare for the whole cab"
            showShared={false}
          />
        </section>

        <FareSplitSection
          trip={trip}
          rideId={rideId}
          editing={editing || !trip.split}
          onEdit={() => setEditing(true)}
          onSaved={(t) => {
            setTrip(t);
            setEditing(false);
          }}
          label={label}
        />
        {error && <p className="error">{error}</p>}
      </div>
    </>
  );
}

function FareSplitSection({
  trip,
  rideId,
  editing,
  onEdit,
  onSaved,
  label,
}: {
  trip: Trip;
  rideId: string;
  editing: boolean;
  onEdit: () => void;
  onSaved: (t: Trip) => void;
  label: (rideId: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState(trip.split ? String(trip.split.total) : '');
  const [provider, setProvider] = useState<Provider>(trip.split?.provider ?? 'uber');
  const [bookedBy, setBookedBy] = useState(trip.split?.bookedByRideId ?? trip.suggestedBookerRideId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyPay, setBusyPay] = useState<string | null>(null);
  const [changeBooker, setChangeBooker] = useState(
    !!trip.split && trip.split.bookedByRideId !== trip.suggestedBookerRideId,
  );

  const myRideIds = trip.members.filter((m) => m.isMe).map((m) => m.rideId);

  const save = async () => {
    const amount = Number(total);
    if (!total || !Number.isInteger(amount) || amount <= 0) return setError('Enter the fare in whole rupees, e.g. 540');
    setError(null);
    setSaving(true);
    try {
      onSaved(await api.saveFare(rideId, { total: amount, provider, bookedByRideId: bookedBy }));
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const togglePaid = async (fromRideId: string, paid: boolean) => {
    setBusyPay(fromRideId);
    try {
      onSaved(await api.setPaid(rideId, fromRideId, paid));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyPay(null);
    }
  };

  // Entry form (first time, or when correcting the fare).
  if (editing) {
    if (!open && !trip.split) {
      const iBook = myRideIds.includes(trip.suggestedBookerRideId);
      return (
        <section className="card stack" aria-label="Split the fare">
          <p style={{ fontSize: 14 }} className="muted">
            {iBook
              ? 'Booked the cab? Enter the exact fare the app showed and CabSathi works out who pays whom.'
              : `Waiting for ${label(trip.suggestedBookerRideId)} to book and enter the fare. You'll see your share here.`}
          </p>
          {iBook ? (
            <button type="button" className="btn-green" onClick={() => setOpen(true)}>
              <ReceiptIndianRupee size={22} /> Split the fare
            </button>
          ) : (
            <button type="button" style={{ color: 'var(--primary)', fontWeight: 700, alignSelf: 'flex-start' }} onClick={() => setOpen(true)}>
              Booked it yourself? Enter the fare
            </button>
          )}
        </section>
      );
    }
    return (
      <section className="card stack" aria-label="Enter the exact fare">
        <h3 className="label" style={{ fontSize: 16 }}>
          Enter the exact fare
        </h3>
        <label className="stack" style={{ gap: 6 }}>
          <b style={{ fontSize: 14 }}>Booked on</b>
          <div className="chips">
            {PROVIDERS.map((p) => (
              <button key={p} type="button" className={`chip ${provider === p ? 'on' : ''}`} onClick={() => setProvider(p)}>
                {PROVIDER_NAME[p]}
              </button>
            ))}
          </div>
        </label>
        <label className="stack" style={{ gap: 6 }}>
          <b style={{ fontSize: 14 }}>Fare shown in the app</b>
          <span className="field">
            <b>₹</b>
            <input
              inputMode="numeric"
              placeholder="540"
              value={total}
              autoFocus
              onChange={(e) => {
                setTotal(e.target.value.replace(/\D/g, '').slice(0, 5));
                setError(null);
              }}
              aria-label="Fare in rupees"
            />
          </span>
        </label>
        {!changeBooker ? (
          <p style={{ fontSize: 14 }}>
            Paid by <b>{label(bookedBy)}</b>{' '}
            <button type="button" style={{ color: 'var(--primary)', fontWeight: 700 }} onClick={() => setChangeBooker(true)}>
              Someone else booked?
            </button>
          </p>
        ) : (
        <div className="stack" style={{ gap: 6 }}>
          <b style={{ fontSize: 14 }}>Who booked and paid?</b>
          <div className="chips">
            {trip.members.map((m) => (
              <button
                key={m.rideId}
                type="button"
                className={`chip ${bookedBy === m.rideId ? 'on' : ''}`}
                onClick={() => setBookedBy(m.rideId)}
              >
                {label(m.rideId)}
                {m.rideId === trip.suggestedBookerRideId ? ' (dropped last)' : ''}
              </button>
            ))}
          </div>
        </div>
        )}
        {error && <p className="error">{error}</p>}
        <button type="button" className="btn-green" onClick={save} disabled={saving}>
          {saving ? 'Working it out…' : 'Show who pays whom'}
        </button>
      </section>
    );
  }

  // Result.
  const split = trip.split!;
  const bookerLabel = label(split.bookedByRideId);
  return (
    <section className="card stack" aria-label="Fare split">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <h3 className="label" style={{ fontSize: 16, flex: 1 }}>
          Fare split
        </h3>
        <span className="muted" style={{ fontSize: 13 }}>
          {PROVIDER_NAME[split.provider]} · ₹{split.total}
        </span>
      </div>

      <ul className="share-list">
        {trip.members.map((m) => (
          <li key={m.rideId}>
            <span style={{ flex: 1 }}>
              <b>{label(m.rideId)}</b>
              <span className="faint" style={{ fontSize: 12 }}>
                {' '}
                · charged for {split.km[m.rideId]} km
              </span>
            </span>
            <b>₹{split.shares[m.rideId]}</b>
          </li>
        ))}
      </ul>

      <h4 style={{ margin: '4px 0 0', fontSize: 15 }}>Who pays whom</h4>
      {split.payments.length === 0 ? (
        <p className="muted">Nothing to settle.</p>
      ) : (
        <ul className="pay-list">
          {split.payments.map((p) => {
            const mineToPay = myRideIds.includes(p.fromRideId);
            const mineToGet = myRideIds.includes(p.toRideId);
            const text = mineToPay
              ? `You pay ${label(p.toRideId)}`
              : mineToGet
                ? `${label(p.fromRideId)} pays you`
                : `${label(p.fromRideId)} pays ${label(p.toRideId)}`;
            return (
              <li key={p.fromRideId} className={p.paidAt ? 'paid' : ''}>
                {p.paidAt ? <CircleCheck size={20} color="var(--green)" /> : <Circle size={20} color="var(--faint)" />}
                <span style={{ flex: 1 }}>
                  {text} <b>₹{p.amount}</b>
                  {p.paidAt && <span className="ok"> · paid</span>}
                </span>
                {(mineToPay || mineToGet) && (
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ color: p.paidAt ? 'var(--muted)' : 'var(--green-dark)', padding: '6px 10px', fontSize: 13 }}
                    disabled={busyPay === p.fromRideId}
                    onClick={() => togglePaid(p.fromRideId, !p.paidAt)}
                  >
                    {p.paidAt ? 'Undo' : mineToPay ? 'I paid' : 'Got it'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="faint" style={{ fontSize: 12, display: 'flex', gap: 6, lineHeight: 1.4 }}>
        <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        Each stretch of the trip is shared equally by whoever is in the cab, so people who ride further pay more.
        Everyone pays {bookerLabel === 'You' ? 'you' : bookerLabel}, who paid the cab.
      </p>
      {error && <p className="error">{error}</p>}
      <button type="button" style={{ color: 'var(--primary)', fontWeight: 700, alignSelf: 'flex-start' }} onClick={onEdit}>
        Fare changed? Edit amount <ArrowRight size={14} style={{ verticalAlign: -2 }} />
      </button>
    </section>
  );
}
