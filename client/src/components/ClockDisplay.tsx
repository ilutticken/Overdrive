import React from 'react';

export interface Clock {
  id:       number;
  name:     string;
  type:     'threat' | 'project' | 'scene';
  segments: number;
  filled:   number;
  visible:  boolean;
}

// ─── SVG clock face ───────────────────────────────────────────────────────────

const TYPE_COLOR: Record<Clock['type'], string> = {
  threat:  '#ef4444',  // red
  project: '#22d3ee',  // cyan
  scene:   '#fbbf24',  // amber
};

interface FaceProps {
  clock: Clock;
  size?: number;
}

export function ClockFace({ clock, size = 80 }: FaceProps) {
  const { segments, filled, type } = clock;
  const color   = TYPE_COLOR[type];
  const r       = 40;
  const cx = 50, cy = 50;
  const GAP_DEG = 4; // gap between segments in degrees

  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      {Array.from({ length: segments }).map((_, i) => {
        const segDeg  = 360 / segments;
        const startDeg = -90 + segDeg * i + GAP_DEG / 2;
        const endDeg   = startDeg + segDeg - GAP_DEG;

        const toRad = (d: number) => d * Math.PI / 180;
        const x1 = cx + r * Math.cos(toRad(startDeg));
        const y1 = cy + r * Math.sin(toRad(startDeg));
        const x2 = cx + r * Math.cos(toRad(endDeg));
        const y2 = cy + r * Math.sin(toRad(endDeg));
        const large = segDeg - GAP_DEG > 180 ? 1 : 0;
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
        const isFilled = i < filled;
        return (
          <path
            key={i}
            d={d}
            fill={isFilled ? color : '#1e293b'}
            stroke="#0f172a"
            strokeWidth="2"
            style={isFilled ? { filter: `drop-shadow(0 0 4px ${color}88)` } : undefined}
          />
        );
      })}
      {/* Completion flash ring */}
      {filled >= segments && (
        <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke={color} strokeWidth="2" opacity="0.6" />
      )}
    </svg>
  );
}

// ─── Compact card used on the host screen ─────────────────────────────────────

export function ClockCard({ clock }: { clock: Clock }) {
  const isComplete = clock.filled >= clock.segments;
  const typeLabel  = clock.type.toUpperCase();
  const color      = TYPE_COLOR[clock.type];

  return (
    <div className={`flex flex-col items-center gap-1 p-2 rounded-xl border bg-slate-950/80 backdrop-blur-sm ${isComplete ? 'border-white/40 animate-pulse' : 'border-white/10'}`}>
      <ClockFace clock={clock} size={56} />
      <div className="text-[10px] font-black uppercase tracking-widest text-center leading-tight" style={{ color }}>
        {clock.name}
      </div>
      <div className="text-[9px] uppercase tracking-widest" style={{ color: `${color}99` }}>
        {typeLabel} {clock.filled}/{clock.segments}
      </div>
    </div>
  );
}

// ─── GM control row ───────────────────────────────────────────────────────────

interface GMCardProps {
  clock:     Clock;
  onAdvance: (id: number) => void;
  onReduce:  (id: number) => void;
  onRemove:  (id: number) => void;
  onToggle:  (id: number) => void;
}

export function ClockGMCard({ clock, onAdvance, onReduce, onRemove, onToggle }: GMCardProps) {
  const isComplete = clock.filled >= clock.segments;
  const color      = TYPE_COLOR[clock.type];

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border bg-slate-900 ${isComplete ? 'border-white/30' : 'border-slate-700'}`}>
      <ClockFace clock={clock} size={56} />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white truncate">{clock.name}</div>
        <div className="text-xs uppercase tracking-widest mt-0.5" style={{ color }}>
          {clock.type} · {clock.filled}/{clock.segments}
          {isComplete && <span className="ml-2 text-white font-black">COMPLETE</span>}
        </div>
      </div>
      <div className="flex gap-1">
        <button onClick={() => onReduce(clock.id)}  className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold">−</button>
        <button onClick={() => onAdvance(clock.id)} className="w-7 h-7 rounded text-white text-sm font-bold" style={{ backgroundColor: color }}>+</button>
        <button onClick={() => onToggle(clock.id)}  className={`w-7 h-7 rounded text-xs font-bold ${clock.visible ? 'bg-cyan-700 text-white' : 'bg-slate-700 text-slate-400'}`} title="Toggle visibility on main screen">👁</button>
        <button onClick={() => onRemove(clock.id)}  className="w-7 h-7 rounded bg-red-950 hover:bg-red-900 text-red-400 text-xs font-bold">×</button>
      </div>
    </div>
  );
}
