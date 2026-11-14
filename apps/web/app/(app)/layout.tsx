import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { BottomNav, BottomNavBar } from '@/components/BottomNav';

/** The logged-in app: not for search engines. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Login is checked and data is loaded in the browser, so navigation here can't be instant. */
export const instant = false;

const Loading = () => (
  <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }} className="muted">
    Loading…
  </div>
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <main className="app-main">
        <Suspense fallback={<Loading />}>
          <AuthGate>{children}</AuthGate>
        </Suspense>
      </main>
      <Suspense fallback={<BottomNavBar path="" />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
