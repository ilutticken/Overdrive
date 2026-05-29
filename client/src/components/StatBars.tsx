// HealthBar: parallelogram slabs (slanted rectangles)
export function HealthBar({ health, maxHealth }: { health: number; maxHealth: number }) {
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: maxHealth }).map((_, i) => (
        <div
          key={i}
          style={{ transform: 'skewX(-14deg)', width: 18, height: 12, flexShrink: 0 }}
          className={i < health
            ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]'
            : 'bg-slate-700'}
        />
      ))}
    </div>
  );
}

// StressBar: alternating up/down triangles
export function StressBar({ stress, maxStress }: { stress: number; maxStress: number }) {
  return (
    <div className="flex items-center" style={{ gap: 2 }}>
      {Array.from({ length: maxStress }).map((_, i) => {
        const isUp = i % 2 === 0;
        const filled = i < stress;
        return (
          <div
            key={i}
            style={{
              width: 13,
              height: 15,
              flexShrink: 0,
              clipPath: isUp
                ? 'polygon(50% 0%, 100% 100%, 0% 100%)'
                : 'polygon(0% 0%, 100% 0%, 50% 100%)',
            }}
            className={filled
              ? 'bg-yellow-400 shadow-[0_0_4px_rgba(250,204,21,0.6)]'
              : 'bg-slate-700'}
          />
        );
      })}
    </div>
  );
}
