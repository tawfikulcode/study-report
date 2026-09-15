const DOTS = [
  [8, 18, 1.6, 11],
  [14, 62, 1.2, 17],
  [22, 34, 2, 9],
  [28, 78, 1.4, 14],
  [36, 12, 1.1, 21],
  [41, 48, 1.8, 8],
  [47, 86, 1.3, 16],
  [53, 22, 1.5, 12],
  [58, 57, 1.2, 19],
  [64, 9, 1.7, 7],
  [69, 71, 1.4, 13],
  [74, 39, 1.1, 22],
  [81, 16, 1.9, 10],
  [86, 64, 1.3, 15],
  [91, 44, 1.5, 18],
  [12, 88, 1.2, 20],
  [33, 54, 1.6, 6],
  [77, 82, 1.4, 14],
  [18, 8, 1.1, 23],
  [95, 28, 1.7, 11],
] as const;

export function ParticleField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="8" y1="18" x2="22" y2="34" className="particle-line" />
        <line x1="22" y1="34" x2="41" y2="48" className="particle-line" />
        <line x1="41" y1="48" x2="58" y2="57" className="particle-line" />
        <line x1="53" y1="22" x2="64" y2="9" className="particle-line" />
        <line x1="69" y1="71" x2="86" y2="64" className="particle-line" />
        <line x1="74" y1="39" x2="91" y2="44" className="particle-line" />
        <line x1="14" y1="62" x2="33" y2="54" className="particle-line" />
        <line x1="77" y1="82" x2="86" y2="64" className="particle-line" />
      </svg>
      {DOTS.map(([x, y, size, duration], i) => (
        <span
          key={i}
          className="particle-dot"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: `${size * 3}px`,
            height: `${size * 3}px`,
            animationDuration: `${duration}s`,
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}
