'use client';

import { decodePolyline, type LatLng } from '@cabsathi/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GOOGLE_MAP_ID, GOOGLE_MAPS_BROWSER_KEY } from '@/lib/site';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any;
    __cabsathiMapsReady?: () => void;
  }
}

let loader: Promise<void> | null = null;

/** Loads the Google Maps JavaScript API once. */
function loadGoogleMaps(key: string): Promise<void> {
  if (window.google?.maps?.importLibrary) return Promise.resolve();
  loader ??= new Promise<void>((resolve, reject) => {
    window.__cabsathiMapsReady = () => resolve();
    const s = document.createElement('script');
    const params = new URLSearchParams({
      key,
      v: 'weekly',
      loading: 'async',
      region: 'IN',
      language: 'en',
      callback: '__cabsathiMapsReady',
    });
    s.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    s.async = true;
    s.onerror = () => {
      loader = null;
      reject(new Error('Google Maps failed to load'));
    };
    document.head.append(s);
  });
  return loader;
}

export interface MapPoint extends LatLng {
  kind: 'pickup' | 'drop' | 'other';
  label?: string;
}

const PIN_COLOR = { pickup: '#E5484D', drop: '#1F9D6C', other: '#1D4ED8' };

/**
 * Route map: Google Maps when a browser key is configured, otherwise a simple
 * drawn preview of the route so the screen still makes sense locally.
 * Pass a memoised `points` array so the map isn't rebuilt on every render.
 */
export function RouteMap({
  points,
  polyline,
  height = 180,
}: {
  points: MapPoint[];
  polyline?: string | null;
  height?: number;
}) {
  const path = useMemo(
    () => (polyline ? decodePolyline(polyline) : points.filter((p) => p.kind !== 'other')),
    [polyline, points],
  );
  const [failed, setFailed] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);

  if (!GOOGLE_MAPS_BROWSER_KEY || failed) {
    return <DrawnRoute points={points} path={path} height={height} note={!GOOGLE_MAPS_BROWSER_KEY} />;
  }
  return <GoogleRoute points={points} path={path} height={height} onFail={onFail} />;
}

function GoogleRoute({
  points,
  path,
  height,
  onFail,
}: {
  points: MapPoint[];
  path: LatLng[];
  height: number;
  onFail: () => void;
}) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const drawn: any[] = [];
    (async () => {
      try {
        await loadGoogleMaps(GOOGLE_MAPS_BROWSER_KEY);
        const { Map, Polyline } = await window.google.maps.importLibrary('maps');
        const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary('marker');
        const { LatLngBounds } = await window.google.maps.importLibrary('core');
        if (cancelled || !el.current) return;
        const map = new Map(el.current, {
          mapId: GOOGLE_MAP_ID,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'cooperative',
        });
        const bounds = new LatLngBounds();
        if (path.length > 1) {
          drawn.push(new Polyline({ map, path, strokeColor: '#1D4ED8', strokeWeight: 5, strokeOpacity: 0.85 }));
          path.forEach((p) => bounds.extend(p));
        }
        for (const p of points) {
          const pin = new PinElement({ background: PIN_COLOR[p.kind], borderColor: '#fff', glyphColor: '#fff' });
          drawn.push(new AdvancedMarkerElement({ map, position: p, title: p.label, content: pin.element }));
          bounds.extend(p);
        }
        map.fitBounds(bounds, 40);
      } catch {
        if (!cancelled) onFail();
      }
    })();
    return () => {
      cancelled = true;
      drawn.forEach((d) => (d.map = null));
    };
  }, [points, path, onFail]);

  return <div ref={el} style={{ height, borderRadius: 14, overflow: 'hidden', background: '#e8eef8' }} />;
}

/** Fallback: draws the route as a line between the pins, scaled to fit. */
function DrawnRoute({
  points,
  path,
  height,
  note,
}: {
  points: MapPoint[];
  path: LatLng[];
  height: number;
  note: boolean;
}) {
  const W = 400;
  const H = 200;
  const all = [...path, ...points];
  if (all.length === 0) return null;
  const lats = all.map((p) => p.lat);
  const lngs = all.map((p) => p.lng);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const pad = 28;
  const scale = Math.min((W - 2 * pad) / (maxLng - minLng || 0.01), (H - 2 * pad) / (maxLat - minLat || 0.01));
  const xy = (p: LatLng) => [
    W / 2 + (p.lng - (minLng + maxLng) / 2) * scale,
    H / 2 - (p.lat - (minLat + maxLat) / 2) * scale,
  ];
  const d = path.map((p, i) => `${i ? 'L' : 'M'}${xy(p).map((n) => n.toFixed(1)).join(' ')}`).join(' ');

  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height, display: 'block', borderRadius: 14, background: '#e8eef8' }}
        role="img"
        aria-label="Route preview"
      >
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="#d6e0f0" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />
        {path.length > 1 && (
          <path d={d} fill="none" stroke="#1D4ED8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={path.length === 2 ? '8 7' : undefined} />
        )}
        {points.map((p, i) => {
          const [x, y] = xy(p);
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <circle r="9" fill={PIN_COLOR[p.kind]} stroke="#fff" strokeWidth="3" />
            </g>
          );
        })}
      </svg>
      {note && (
        <figcaption className="faint" style={{ fontSize: 11, marginTop: 4 }}>
          {path.length === 2 ? 'Straight-line preview' : 'Route preview'} · add a Google Maps key for the full map
        </figcaption>
      )}
    </figure>
  );
}
