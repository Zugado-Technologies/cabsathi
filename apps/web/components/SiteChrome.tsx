import Link from 'next/link';
import type { ReactNode } from 'react';
import { ROUTES } from '@/lib/routes';
import { Brand, WaveHeader } from './WaveHeader';

/** Header for public pages: logo, links, and the app button. */
export function SiteHeader({ children }: { children?: ReactNode }) {
  return (
    <WaveHeader
      left={
        <Link href="/" aria-label="CabSathi home">
          <Brand />
        </Link>
      }
      right={
        <nav className="site-nav" aria-label="Site">
          <span className="nav-links">
            <Link href="/#routes">Routes</Link>
            <Link href="/safety">Safety</Link>
            <Link href="/faq">FAQ</Link>
          </span>
          <Link href="/home" className="cta">
            Open app
          </Link>
        </nav>
      }
    >
      {children}
    </WaveHeader>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container cols">
        <div>
          <h4>CabSathi</h4>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            Find people going your way, share one cab and split the fare. CabSathi connects riders; it doesn&apos;t run cabs.
          </p>
        </div>
        <div>
          <h4>Popular routes</h4>
          <ul>
            {ROUTES.slice(0, 6).map((r) => (
              <li key={r.slug}>
                <Link href={`/cab-sharing/${r.slug}`}>
                  {r.fromArea} to {r.toArea}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Help</h4>
          <ul>
            <li>
              <Link href="/safety">Safety</Link>
            </li>
            <li>
              <Link href="/faq">FAQ</Link>
            </li>
            <li>
              <Link href="/login">Log in</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="container" style={{ marginTop: 24, fontSize: 13, opacity: 0.7 }}>
        Fares shown are estimates. Final fare is what the cab app charges.
      </div>
    </footer>
  );
}
