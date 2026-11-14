import type { ReactNode } from 'react';
import { BackButton } from './BackButton';

/** Blue gradient header with the wave at the bottom, as in the mockup. */
export function WaveHeader({
  title,
  back,
  left,
  right,
  children,
}: {
  title?: string;
  back?: boolean | string;
  left?: ReactNode;
  right?: ReactNode;
  /** Extra content under the title row (hero text on public pages). */
  children?: ReactNode;
}) {
  return (
    <header className="wave-header">
      <div className="bar">
        <div className="row">
          {back && <BackButton fallback={typeof back === 'string' ? back : '/home'} />}
          {left}
          {title && <h1 className="title">{title}</h1>}
          <div className="spacer" />
          {right}
        </div>
        {children}
      </div>
      <svg className="wave" viewBox="0 0 400 22" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0 H400 V8 C330 24 270 2 200 10 C130 18 70 22 0 8 Z" fill="var(--header-bottom)" />
        <path
          d="M0 8 C70 22 130 18 200 10 C270 2 330 24 400 8 V12 C330 28 270 6 200 14 C130 22 70 26 0 12 Z"
          fill="#fff"
          opacity="0.35"
        />
      </svg>
    </header>
  );
}

export function Brand() {
  return (
    <span className="brand">
      <span className="brand-logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="8" cy="8" r="3.2" />
          <circle cx="16" cy="8" r="3.2" />
          <path d="M2 19c0-3.3 2.7-6 6-6s6 2.7 6 6H2zm10 0c0-3.3 2.7-6 6-6s4 1.8 4 4v2H12z" />
        </svg>
      </span>
      CabSathi
    </span>
  );
}
