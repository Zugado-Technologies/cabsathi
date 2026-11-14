'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useSession } from '@/lib/session';

/** Sends logged-out visitors to /login and brings them back afterwards. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, user } = useSession();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [ready, user, router, path]);

  if (!ready || !user) {
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }} className="muted">
        Loading…
      </div>
    );
  }
  return <>{children}</>;
}
