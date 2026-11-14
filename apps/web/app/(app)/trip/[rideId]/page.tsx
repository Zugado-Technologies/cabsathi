import { Suspense } from 'react';
import { TripView } from './TripView';

/** Ride ids are only known at request time, so the param is read inside Suspense. */
export default function TripPage({ params }: { params: Promise<{ rideId: string }> }) {
  return (
    <Suspense fallback={<div className="empty">Loading…</div>}>
      {params.then(({ rideId }) => (
        <TripView rideId={rideId} />
      ))}
    </Suspense>
  );
}
