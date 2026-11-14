import { Suspense } from 'react';
import { MatchesView } from './MatchesView';

/** Ride ids are only known at request time, so the param is read inside Suspense. */
export default function MatchesPage({ params }: { params: Promise<{ rideId: string }> }) {
  return (
    <Suspense fallback={<div className="empty">Loading…</div>}>
      {params.then(({ rideId }) => (
        <MatchesView rideId={rideId} />
      ))}
    </Suspense>
  );
}
