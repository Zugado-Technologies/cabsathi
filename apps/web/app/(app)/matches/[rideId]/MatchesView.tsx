'use client';

import type { MatchCard as Match, ReceivedRequest, Ride } from '@cabsathi/shared';
import { MailOpen, RefreshCw, Search, Settings } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { MatchCard } from '@/components/MatchCard';
import { Empty } from '@/components/ui';
import { WaveHeader } from '@/components/WaveHeader';
import { api } from '@/lib/api';
import { dayLabel, timeLabel } from '@/lib/format';

type Tab = 'nearby' | 'received';

export function MatchesView({ rideId }: { rideId: string }) {
  const [tab, setTab] = useState<Tab>('nearby');
  const [ride, setRide] = useState<Ride | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [received, setReceived] = useState<ReceivedRequest[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [r, m, rq] = await Promise.all([api.ride(rideId), api.matches(rideId), api.receivedRequests()]);
      setRide(r);
      setMatches(m);
      setReceived(rq.filter((x) => x.toRide.id === rideId));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setMatches([]);
    }
  }, [rideId]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await fn();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const pending = received.filter((r) => r.status === 'pending').length;

  return (
    <>
      <WaveHeader
        title="Matching Rides"
        back="/rides"
        right={
          <button type="button" className="icon-btn" aria-label="Refresh matches" onClick={load}>
            {busy === 'refresh' ? <RefreshCw size={24} /> : <Settings size={24} fill="#fff" fillOpacity={0.2} />}
          </button>
        }
      />
      <div className="app-body">
        <div className="tabs" role="tablist">
          {(['nearby', 'received'] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
              {t === 'nearby' ? 'Nearby Requests' : `Received Requests${pending ? ` (${pending})` : ''}`}
            </button>
          ))}
        </div>
        {ride && (
          <p className="muted" style={{ fontSize: 13 }}>
            Your ride: {ride.from.name} → {ride.to.name} · {dayLabel(ride.departAt)}, {timeLabel(ride.departAt)}
            {ride.status !== 'published' ? ` · ${ride.status}` : ''}
          </p>
        )}
        {error && <p className="error">{error}</p>}

        {matches === null ? (
          <div className="empty">Finding people going your way…</div>
        ) : tab === 'nearby' ? (
          matches.length === 0 ? (
            <Empty
              icon={<Search size={36} color="var(--faint)" />}
              title="No matching rides yet"
              body="We’ll show people going your way here as soon as they post a ride. Check back closer to your time."
            />
          ) : (
            matches.map((m) => (
              <MatchCard
                key={m.ride.id}
                {...m}
                action={
                  m.requestStatus ? (
                    <span className="status-pill">{m.requestStatus === 'pending' ? 'Requested' : m.requestStatus}</span>
                  ) : (
                    <button
                      type="button"
                      className="btn-green sm"
                      disabled={busy === m.ride.id}
                      onClick={() => act(m.ride.id, () => api.sendRequest(rideId, m.ride.id))}
                    >
                      {busy === m.ride.id ? 'Sending…' : 'Send request'}
                    </button>
                  )
                }
              />
            ))
          )
        ) : received.length === 0 ? (
          <Empty
            icon={<MailOpen size={36} color="var(--faint)" />}
            title="No requests yet"
            body="When someone asks to share your cab, it shows up here."
          />
        ) : (
          received.map((r) => (
            <MatchCard
              key={r.id}
              ride={r.fromRide}
              user={r.fromUser}
              level={r.match?.level ?? 'flexible'}
              overlapPct={r.match?.overlapPct ?? 0}
              pickupGapKm={r.match?.pickupGapKm ?? 0}
              minsToMeet={r.match?.minsToMeet ?? 0}
              shareRange={r.match?.shareRange ?? { min: 0, max: 0 }}
              action={
                r.status === 'pending' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      type="button"
                      className="btn-green sm"
                      disabled={busy !== null}
                      onClick={() => act(`a${r.id}`, () => api.acceptRequest(r.id))}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ color: 'var(--red)' }}
                      disabled={busy !== null}
                      onClick={() => act(`r${r.id}`, () => api.rejectRequest(r.id))}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="status-pill" style={{ background: 'var(--green-light)', color: 'var(--green-dark)' }}>
                    Accepted
                  </span>
                )
              }
            />
          ))
        )}
      </div>
    </>
  );
}
