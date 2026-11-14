'use client';

import type { Place } from '@cabsathi/shared';
import { MapPin, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

/** Location input with suggestions (local NCR list for now, Google Places later). */
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
  const [results, setResults] = useState<Place[]>([]);

  useEffect(() => setText(value?.name ?? ''), [value]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      api
        .places(text === value?.name ? '' : text)
        .then(setResults)
        .catch(() => setResults([]));
    }, 150);
    return () => clearTimeout(t);
  }, [text, open, value?.name]);

  return (
    <div style={{ position: 'relative', zIndex: open ? 25 : 1 }}>
      <div className="field">
        <MapPin size={20} color={pinColor} fill={pinColor} fillOpacity={0.2} />
        <input
          aria-label={label}
          value={text}
          placeholder={placeholder}
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
      {open && results.length > 0 && (
        <div className="dropdown" role="listbox">
          {results.map((p) => (
            <button
              key={p.name}
              type="button"
              role="option"
              aria-selected={value?.name === p.name}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(p);
                setText(p.name);
                setOpen(false);
              }}
            >
              <MapPin size={16} color="var(--muted)" />
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
