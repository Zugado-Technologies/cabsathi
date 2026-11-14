import { compareFares, sharedEach, type LatLng } from '@cabsathi/shared';
import { ExternalLink, Users } from 'lucide-react';

const PROVIDER_COLOR: Record<string, string> = {
  uber: '#111111',
  ola: '#5C8A2E',
  rapido: '#E8A400',
  indrive: '#8DB600',
};

/**
 * Estimated fares in other apps vs. sharing on CabSathi.
 * These come from fare cards, not live prices — say so clearly.
 */
export function FareCompare({
  km,
  minutes,
  from,
  to,
}: {
  km: number;
  minutes: number;
  from?: LatLng & { name?: string };
  to?: LatLng & { name?: string };
}) {
  const fares = compareFares(km, minutes, from, to);
  const cheapest = fares[0];

  return (
    <section className="card stack" aria-labelledby="fare-compare-title">
      <h3 id="fare-compare-title" className="label" style={{ fontSize: 16 }}>
        Compare fares for this trip
      </h3>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 12,
          background: 'var(--green-light)',
          color: 'var(--green-dark)',
        }}
      >
        <Users size={20} />
        <div style={{ flex: 1 }}>
          <b>Share on CabSathi</b>
          <div style={{ fontSize: 12 }}>when 2 people share most of the trip</div>
        </div>
        <b style={{ fontSize: 18, whiteSpace: 'nowrap' }}>
          ~₹{sharedEach(cheapest.min)}–{sharedEach(cheapest.max)} each
        </b>
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
        {fares.map((f) => (
          <li
            key={f.vehicle}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 2px', borderBottom: '1px solid var(--border)' }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: PROVIDER_COLOR[f.provider],
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontSize: 12,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {f.providerName.slice(0, 2)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{f.vehicle}</div>
              {f.note && (
                <div className="faint" style={{ fontSize: 12 }}>
                  {f.note}
                </div>
              )}
            </div>
            <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
              ₹{f.min}–{f.max}
            </span>
            {f.bookUrl && (
              <a
                href={f.bookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${f.providerName} with this trip`}
                style={{ color: 'var(--primary)', display: 'inline-flex' }}
              >
                <ExternalLink size={16} />
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className="faint" style={{ fontSize: 12, lineHeight: 1.4 }}>
        Estimates from typical fare rates, not live prices. Surge, tolls and airport charges are not included. Check the
        app for the exact fare.
      </p>
    </section>
  );
}
