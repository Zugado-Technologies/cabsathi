'use client';

import type { Place, PlaceSuggestion } from '@cabsathi/shared';
import { MapPin, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

/**
 * Location input with suggestions. Uses Google Places through our API when a
 * key is configured, otherwise the built-in Delhi NCR list.
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
  const [error, setError] = useState<string | null>(null);
  // One Google "session" from typing to picking a place keeps search billing low.
  const session = useRef<string | null>(null);

  useEffect(() => setText(value?.name ?? ''), [value]);

  useEffect(() => {
    if (!open) return;
    session.current ??= crypto.randomUUID();
    const t = setTimeout(() => {
      api
        .places(text === value?.name ? '' : text, session.current!)
        .then(setResults)
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [text, open, value?.name]);

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
          placeholder={placeholder}
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
      {open && results.length > 0 && (
        <div className="dropdown" role="listbox">
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
        </div>
      )}
    </div>
  );
}
