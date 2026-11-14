'use client';

/** 1-3 seat slider like the mockup. Click a number (or use arrow keys) to choose. */
export function SeatSlider({ value, onChange, max = 3 }: { value: number; onChange: (n: number) => void; max?: number }) {
  const pct = max === 1 ? 100 : ((value - 1) / (max - 1)) * 100;
  return (
    <div
      className="slider"
      role="slider"
      tabIndex={0}
      aria-label="Seats"
      aria-valuemin={1}
      aria-valuemax={max}
      aria-valuenow={value}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(max, value + 1));
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(1, value - 1));
      }}
    >
      <div className="track">
        <div className="fill" style={{ width: `${Math.max(pct, 8)}%` }} />
        <div className="thumb" style={{ left: `${pct}%` }} />
      </div>
      <div className="stops">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" tabIndex={-1} className={n === value ? 'on' : ''} onClick={() => onChange(n)}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
