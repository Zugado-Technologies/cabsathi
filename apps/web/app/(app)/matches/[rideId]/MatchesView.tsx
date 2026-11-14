'use client';

import type { MatchCard as Match, ReceivedRequest, Ride } from '@cabsathi/shared';
import { MailOpen, RefreshCw, Search, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RouteMap, type MapPoint } from '@/components/RouteMap';
import { MatchCard } from '@/components/MatchCard';
import { Empty } from '@/components/ui';
import { WaveHeader } from '@/components/WaveHeader';
import { api } from '@/lib/api';
import { dayLabel, timeLabel } from '@/lib/format';

type Tab = 'nearby' | 'received';

/** How often to look for new matches and requests while the page is open. */
const POLL_MS = 15_000;

export function MatchesView({ rideId }: { rideId: string }) {
  const [tab, setTab] = useState<Tab>('nearby');
  const [ride, setRide] = useState<Ride | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [received, setReceived] = useState<ReceivedRequest[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  // Ids seen so far, to spot new matches and requests between refreshes.
  const seen = useRef<Set<string> | null>(null);

  const load = useCallback(
    async (quiet = false) => {
      try {
        const [r, m, rq] = await Promise.all([api.ride(rideId), api.matches(rideId), api.receivedRequests()]);
        const mine = rq.filter((x) => x.toRide.id === rideId);
        const ids = [...m.map((x) => `m${x.ride.id}`), ...mine.map((x) => `r${x.id}`)];
        if (seen.current) {
          const fresh = ids.filter((id) => !seen.current!.has(id)).length;
          if (fresh) setNewCount((n) => n + fresh);
        }
        seen.current = new Set([...(seen.current ?? []), ...ids]);
        setRide(r);
        setMatches(m);
        setReceived(mine);
        setUpdatedAt(new Date());
        setError(null);
      } catch (e) {
        // Background refreshes stay quiet; the last good list stays on screen.
        if (!quiet) {
          setError((e as Error).message);
          setMatches((prev) => prev ?? []);
        }
      }
    },
    [rideId],
  );

  useEffect(() => {
    load();
    const tick = () => document.visibilityState === 'visible' && load(true);
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    setNewCount(0);
    await load();
    setRefreshing(false);
  };

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

  // My route, plus where each matched person starts.
  const mapPoints = useMemo<MapPoint[]>(() => {
    if (!ride) return [];
    return [
      { ...ride.from, kind: 'pickup', label: `You: ${ride.from.name}` },
      { ...ride.to, kind: 'drop', label: ride.to.name },
      ...(matches ?? []).map((m) => ({ ...m.ride.from, kind: 'other' as const, label: m.user.name ?? 'Match' })),
    ];
  }, [ride, matches]);

  return (
    <>
      <WaveHeader
        title="Matching Rides"
        back="/rides"
        right={
          <button type="button" className="icon-btn" aria-label="Refresh matches" onClick={refresh} disabled={refreshing}>
            <RefreshCw size={24} className={refreshing ? 'spin' : undefined} />
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
        {newCount > 0 && (
          <button type="button" className="new-banner" onClick={() => setNewCount(0)} aria-live="polite">
            <Sparkles size={16} />
            {newCount === 1 ? '1 new match or request' : `${newCount} new matches or requests`}
          </button>
        )}
        {ride && <RouteMap points={mapPoints} polyline={ride.polyline} height={150} />}
        {updatedAt && (
          <p className="faint" style={{ fontSize: 12, marginTop: -6 }}>
            Updates automatically · last checked {updatedAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
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
