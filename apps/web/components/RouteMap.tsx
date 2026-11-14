'use client';

import { decodePolyline, type LatLng } from '@cabsathi/shared';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { GOOGLE_MAP_ID, GOOGLE_MAPS_BROWSER_KEY, MAPPLS_MAP_KEY } from '@/lib/site';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any;
    mappls?: any;
    __cabsathiMapsReady?: () => void;
    __cabsathiMapplsReady?: () => void;
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

let mapplsLoader: Promise<void> | null = null;

/** Loads the Mappls (MapmyIndia) Web SDK once. */
export function loadMappls(key: string): Promise<void> {
  if (window.mappls?.Map) return Promise.resolve();
  mapplsLoader ??= new Promise<void>((resolve, reject) => {
    window.__cabsathiMapplsReady = () => resolve();
    const s = document.createElement('script');
    s.src = `https://sdk.mappls.com/map/sdk/web?v=3.0&layer=vector&access_token=${encodeURIComponent(key)}&callback=__cabsathiMapplsReady`;
    s.async = true;
    s.onerror = () => {
      mapplsLoader = null;
      reject(new Error('Mappls failed to load'));
    };
    document.head.append(s);
    setTimeout(() => reject(new Error('Mappls timed out')), 10_000);
  });
  return mapplsLoader;
}

export interface MapPoint extends LatLng {
  kind: 'pickup' | 'drop' | 'other';
  label?: string;
}

const PIN_COLOR = { pickup: '#E5484D', drop: '#1F9D6C', other: '#1D4ED8' };

/**
 * Route map: Mappls first, then Google Maps (whichever browser key is set), otherwise a simple
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
  const [mapplsFailed, setMapplsFailed] = useState(false);
  const [googleFailed, setGoogleFailed] = useState(false);
  const onMapplsFail = useCallback(() => setMapplsFailed(true), []);
  const onGoogleFail = useCallback(() => setGoogleFailed(true), []);

  if (MAPPLS_MAP_KEY && !mapplsFailed) {
    return <MapplsRoute points={points} path={path} height={height} onFail={onMapplsFail} />;
  }
  if (GOOGLE_MAPS_BROWSER_KEY && !googleFailed) {
    return <GoogleRoute points={points} path={path} height={height} onFail={onGoogleFail} />;
  }
  return <DrawnRoute points={points} path={path} height={height} note={!MAPPLS_MAP_KEY && !GOOGLE_MAPS_BROWSER_KEY} />;
}

function MapplsRoute({
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
  const box = useRef<HTMLDivElement>(null);
  const baseId = `mappls-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  useEffect(() => {
    let cancelled = false;
    let map: any = null;
    // Mappls can't reuse a container, so every mount gets a fresh inner box.
    const inner = document.createElement('div');
    inner.id = `${baseId}-${Math.random().toString(36).slice(2, 8)}`;
    inner.style.cssText = 'width:100%;height:100%';
    box.current?.append(inner);
    (async () => {
      try {
        await loadMappls(MAPPLS_MAP_KEY);
        if (cancelled) return;
        const all = [...path, ...points];
        const lats = all.map((p) => p.lat);
        const lngs = all.map((p) => p.lng);
        const centre = {
          lat: (Math.min(...lats) + Math.max(...lats)) / 2,
          lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
        };
        map = new window.mappls.Map(inner.id, { center: centre, zoom: 11, zoomControl: true, location: false });
        map.addListener('load', () => {
          if (cancelled) return;
          if (path.length > 1) {
            new window.mappls.Polyline({ map, path, strokeColor: '#1D4ED8', strokeWeight: 5, strokeOpacity: 0.85 });
          }
          for (const p of points) {
            new window.mappls.Marker({
              map,
              position: { lat: p.lat, lng: p.lng },
              title: p.label,
              offset: [0, 0],
              // Mappls centres a 34×48 box on the point, so the dot sits in the middle of that box.
              html: `<div style="width:34px;height:48px;display:flex;align-items:center;justify-content:center"><div style="width:16px;height:16px;box-sizing:border-box;border-radius:50%;background:${PIN_COLOR[p.kind]};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div></div>`,
            });
          }
          if (all.length > 1) {
            map.fitBounds(
              [
                [Math.min(...lngs), Math.min(...lats)],
                [Math.max(...lngs), Math.max(...lats)],
              ],
              { padding: 40, duration: 0 },
            );
          }
        });
      } catch (err) {
        console.warn('[map] Mappls failed, using fallback:', err);
        if (!cancelled) onFail();
      }
    })();
    return () => {
      cancelled = true;
      try {
        map?.remove?.();
      } catch {
        /* map already gone */
      }
      inner.remove();
    };
  }, [baseId, points, path, onFail]);

  return <div ref={box} style={{ height, borderRadius: 14, overflow: 'hidden', background: '#e8eef8' }} />;
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
          {path.length === 2 ? 'Straight-line preview' : 'Route preview'} · add a Mappls or Google Maps key for the full map
        </figcaption>
      )}
    </figure>
  );
}
