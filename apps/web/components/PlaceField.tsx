'use client';

import type { Place, PlaceSuggestion } from '@cabsathi/shared';
import { LocateFixed, Map as MapIcon, MapPin, Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { currentPosition } from '@/lib/location';
import { MapPicker } from './MapPicker';

/**
 * Location input. Typing shows place suggestions from our API (Mappls). Before
 * typing, the menu offers "Use current location" and "Choose on map".
 */
export function PlaceField({
  value,
  onChange,
  placeholder,
  pinColor,
  trailing,
  label,
}: {
  value: Place | null;
  onChange: (p: Place | null) => void;
  placeholder: string;
  pinColor: string;
  trailing: 'clear' | 'search';
  label: string;
}) {
  const [text, setText] = useState(value?.name ?? '');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [searched, setSearched] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  // One Google "session" from typing to picking a place keeps search billing low.
  const session = useRef<string | null>(null);

  useEffect(() => setText(value?.name ?? ''), [value]);

  const query = text === value?.name ? '' : text.trim();

  useEffect(() => {
    if (!open || query.length < 2) {
      setResults([]);
      return;
    }
    session.current ??= crypto.randomUUID();
    const t = setTimeout(() => {
      api
        .places(query, session.current!)
        .then((r) => {
          setResults(r);
          setSearched(query);
        })
        .catch(() => {
          setResults([]);
          setSearched(query);
        });
    }, 250);
    return () => clearTimeout(t);
  }, [query, open]);

  const useMyLocation = async () => {
    setOpen(false);
    setError(null);
    setLocating(true);
    try {
      const at = await currentPosition();
      onChange(await api.reversePlace(at.lat, at.lng));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLocating(false);
    }
  };

  const closeMap = useCallback(() => setMapOpen(false), []);

  const pick = async (s: PlaceSuggestion) => {
    setOpen(false);
    setText(s.name);
    setError(null);
    try {
      const place =
        s.lat !== undefined && s.lng !== undefined
          ? { name: s.name, lat: s.lat, lng: s.lng }
          : await api.placeDetails(s.placeId!, session.current ?? undefined);
      onChange({ ...place, name: s.name });
    } catch {
      setError("Couldn't load that place. Try another one.");
      onChange(null);
    } finally {
      session.current = null;
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: open ? 25 : 1 }}>
      <div className="field">
        <MapPin size={20} color={pinColor} fill={pinColor} fillOpacity={0.2} />
        <input
          aria-label={label}
          value={text}
          placeholder={locating ? 'Finding your location…' : placeholder}
          autoComplete="off"
          onChange={(e) => {
            setText(e.target.value);
            if (value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {trailing === 'clear' && text ? (
          <button
            type="button"
            className="clear-btn"
            aria-label={`Clear ${label}`}
            onClick={() => {
              setText('');
              onChange(null);
            }}
          >
            <X size={12} strokeWidth={3} />
          </button>
        ) : (
          <Search size={18} color="var(--faint)" />
        )}
      </div>
      {error && <p className="error" style={{ marginTop: 4 }}>{error}</p>}
      {open && (
        <div className="dropdown" role="listbox" aria-label={`${label} options`}>
          {query.length < 2 && (
            <button type="button" role="option" aria-selected={false} className="action" onMouseDown={(e) => e.preventDefault()} onClick={useMyLocation}>
              <LocateFixed size={16} style={{ flexShrink: 0 }} />
              Use current location
            </button>
          )}
          {query.length >= 2 && results.length === 0 && searched === query && (
            <div role="status" style={{ padding: '10px 12px', fontSize: 14 }}>
              <span className="muted">No places found for “{searched}”. Try a nearby landmark, or choose on the map.</span>
            </div>
          )}
          {results.map((s) => (
            <button
              key={s.placeId ?? s.name}
              type="button"
              role="option"
              aria-selected={value?.name === s.name}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(s)}
            >
              <MapPin size={16} color="var(--muted)" style={{ flexShrink: 0 }} />
              <span>
                {s.name}
                {s.secondary && (
                  <span className="faint" style={{ display: 'block', fontSize: 12 }}>
                    {s.secondary}
                  </span>
                )}
              </span>
            </button>
          ))}
          <button
            type="button"
            role="option"
            aria-selected={false}
            className="action"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setOpen(false);
              setMapOpen(true);
            }}
          >
            <MapIcon size={16} style={{ flexShrink: 0 }} />
            Choose on map
          </button>
        </div>
      )}
      {mapOpen && (
        <MapPicker
          title={`Choose ${label} on map`}
          start={value}
          pinColor={pinColor.startsWith('var(') ? PIN_HEX[pinColor] ?? '#1D4ED8' : pinColor}
          onClose={closeMap}
          onPick={(p) => {
            setMapOpen(false);
            setError(null);
            onChange(p);
          }}
        />
      )}
    </div>
  );
}

/** The map pin is drawn as SVG, so it needs real colours rather than CSS variables. */
const PIN_HEX: Record<string, string> = { 'var(--red)': '#E5484D', 'var(--green)': '#1F9D6C' };
