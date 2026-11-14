'use client';

import type { LatLng, Place } from '@cabsathi/shared';
import { ArrowLeft, LocateFixed, MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { currentPosition, NCR_CENTRE } from '@/lib/location';
import { MAPPLS_MAP_KEY } from '@/lib/site';
import { loadMappls } from './RouteMap';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Full-screen "choose on map": the pin stays in the middle and the person
 * moves the map under it. The address under the pin updates when the map stops.
 */
export function MapPicker({
  title,
  start,
  pinColor,
  onPick,
  onClose,
}: {
  title: string;
  start: LatLng | null;
  pinColor: string;
  onPick: (p: Place) => void;
  onClose: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [looking, setLooking] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let asked = 0;
    const inner = document.createElement('div');
    inner.id = `picker-${Math.random().toString(36).slice(2, 10)}`;
    inner.style.cssText = 'width:100%;height:100%';
    box.current?.append(inner);

    const lookUp = (at: LatLng) => {
      const n = ++asked;
      setLooking(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        api
          .reversePlace(at.lat, at.lng)
          .then((p) => !cancelled && n === asked && setPlace(p))
          .catch(() => !cancelled && n === asked && setPlace({ name: 'Pinned location', ...at }))
          .finally(() => !cancelled && n === asked && setLooking(false));
      }, 350);
    };

    (async () => {
      if (!MAPPLS_MAP_KEY) {
        setMapError('The map is not set up yet. Add a Mappls map key to use this.');
        return;
      }
      try {
        await loadMappls(MAPPLS_MAP_KEY);
        if (cancelled) return;
        const centre = start ?? NCR_CENTRE;
        const map = new window.mappls.Map(inner.id, {
          center: centre,
          zoom: start ? 16 : 11,
          zoomControl: true,
          location: false,
        });
        mapRef.current = map;
        map.addListener('load', () => lookUp(centre));
        map.addListener('moveend', () => {
          const c = map.getCenter();
          lookUp({ lat: c.lat, lng: c.lng });
        });
        map.addListener('movestart', () => setLooking(true));
      } catch {
        if (!cancelled) setMapError('The map could not load. Check your connection and try again.');
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      try {
        mapRef.current?.remove?.();
      } catch {
        /* already gone */
      }
      mapRef.current = null;
      inner.remove();
    };
  }, [start]);

  // Close with the Escape key.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const goToMe = async () => {
    setLocError(null);
    try {
      const me = await currentPosition();
      mapRef.current?.flyTo?.({ center: [me.lng, me.lat], zoom: 16, duration: 600 });
    } catch (e) {
      setLocError((e as Error).message);
    }
  };

  // Rendered on <body> so cards with their own stacking layer can't cover it.
  return createPortal(
    <div className="map-picker" role="dialog" aria-modal="true" aria-label={title}>
      <div className="map-picker-top">
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <b style={{ fontSize: 17 }}>{title}</b>
      </div>

      <div className="map-picker-map">
        <div ref={box} style={{ position: 'absolute', inset: 0, background: '#e8eef8' }} />
        {!mapError && (
          <>
            {/* The tip of the pin marks the chosen point (the map's centre). */}
            <div className="map-picker-pin" aria-hidden="true">
              <MapPin size={44} color="#fff" fill={pinColor} strokeWidth={1.5} />
            </div>
            <button type="button" className="map-picker-locate" onClick={goToMe} aria-label="Go to my location">
              <LocateFixed size={22} color="var(--primary)" />
            </button>
          </>
        )}
        {mapError && <p className="empty" style={{ position: 'absolute', inset: 0, justifyContent: 'center' }}>{mapError}</p>}
      </div>

      <div className="map-picker-sheet">
        <span className="faint" style={{ fontSize: 12 }}>
          Move the map to put the pin on the spot
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
          <MapPin size={20} color={pinColor} fill={pinColor} fillOpacity={0.2} style={{ flexShrink: 0 }} />
          <b style={{ fontSize: 16 }}>{looking || !place ? 'Finding address…' : place.name}</b>
        </div>
        {locError && <p className="error">{locError}</p>}
        <button
          type="button"
          className="btn-green"
          disabled={looking || !place || !!mapError}
          onClick={() => place && onPick(place)}
        >
          Confirm location
        </button>
      </div>
    </div>,
    document.body,
  );
}
