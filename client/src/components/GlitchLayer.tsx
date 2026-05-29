import React, { useEffect, useRef, useState } from 'react';
import type { GlitchType } from '../minigames/types';

// ─── Effect overlays ─────────────────────────────────────────────────────────

function StaticBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-full bg-cyan-400/30"
          style={{
            height: `${2 + Math.random() * 6}px`,
            top: `${Math.random() * 100}%`,
            opacity: 0.4 + Math.random() * 0.5,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-cyan-400/10 mix-blend-screen" />
    </div>
  );
}

function ScreenTear({ position }: { position: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      <div
        className="absolute left-0 right-0 h-px bg-cyan-300"
        style={{ top: `${position}%`, boxShadow: '0 0 8px rgba(103,232,249,0.9)' }}
      />
      <div
        className="absolute left-0 right-0"
        style={{
          top: `${position}%`,
          height: '3px',
          background: 'repeating-linear-gradient(90deg, rgba(103,232,249,0.5) 0px, transparent 2px, transparent 6px)',
        }}
      />
    </div>
  );
}

function Noise() {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-40 opacity-[0.06]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px',
      }}
    />
  );
}

function SignalBleed({ offset }: { offset: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-40 mix-blend-screen opacity-20"
      style={{ transform: `translateX(${offset}px)`, filter: 'hue-rotate(120deg) saturate(3)' }}
    >
      {/* Rendered children handled by the parent clone — this just adds a shifted tint */}
      <div className="absolute inset-0 bg-fuchsia-500/30" />
    </div>
  );
}

function FrameDrop() {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 bg-slate-950/60" />
  );
}

// ─── Glitch definitions: timing + visual ─────────────────────────────────────

interface GlitchSpec {
  minDelay:    number;  // ms minimum before first trigger
  maxDelay:    number;  // ms maximum before first trigger
  duration:    number;  // ms how long each trigger lasts
  repeats:     number;  // how many times it fires per mini-game
  repeatGap:   number;  // ms between repeats
}

const GLITCH_SPEC: Record<GlitchType, GlitchSpec> = {
  static_burst: { minDelay: 400,  maxDelay: 3500, duration: 180,  repeats: 2, repeatGap: 800  },
  mirror:       { minDelay: 800,  maxDelay: 4000, duration: 320,  repeats: 1, repeatGap: 0    },
  screen_tear:  { minDelay: 600,  maxDelay: 3000, duration: 250,  repeats: 2, repeatGap: 1200 },
  noise:        { minDelay: 0,    maxDelay: 0,    duration: 99999, repeats: 1, repeatGap: 0   }, // always on
  clock_drift:  { minDelay: 1000, maxDelay: 4000, duration: 600,  repeats: 1, repeatGap: 0    },
  signal_bleed: { minDelay: 500,  maxDelay: 3500, duration: 400,  repeats: 2, repeatGap: 700  },
  frame_drop:   { minDelay: 700,  maxDelay: 4500, duration: 150,  repeats: 2, repeatGap: 1500 },
  zone_shift:   { minDelay: 800,  maxDelay: 3500, duration: 350,  repeats: 1, repeatGap: 0    },
  input_lag:    { minDelay: 600,  maxDelay: 4000, duration: 500,  repeats: 2, repeatGap: 1000 },
  blackout:     { minDelay: 1000, maxDelay: 4500, duration: 280,  repeats: 1, repeatGap: 0    },
};

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  glitches:  GlitchType[];
  children:  React.ReactNode;
  // clock_drift needs access to override the timer display — surface as optional callback
  onClockDrift?: (offsetMs: number) => void;
}

export default function GlitchLayer({ glitches, children, onClockDrift }: Props) {
  const [active, setActive] = useState<Set<GlitchType>>(new Set());
  const [tearPos, setTearPos]       = useState(50);
  const [bleedOffset, setBleedOffset] = useState(8);
  const [mirrored, setMirrored]     = useState(false);

  useEffect(() => {
    if (glitches.length === 0) return;
    const timers: number[] = [];

    glitches.forEach(glitch => {
      const spec = GLITCH_SPEC[glitch];

      const schedule = (repeatIndex: number) => {
        if (repeatIndex >= spec.repeats) return;
        const baseDelay = spec.minDelay + Math.random() * (spec.maxDelay - spec.minDelay);
        const delay = baseDelay + repeatIndex * (spec.duration + spec.repeatGap);

        const onId = window.setTimeout(() => {
          // Pre-compute any random params before activating
          if (glitch === 'screen_tear') setTearPos(20 + Math.random() * 60);
          if (glitch === 'signal_bleed') setBleedOffset(6 + Math.random() * 14);
          if (glitch === 'mirror') setMirrored(true);
          if (glitch === 'clock_drift' && onClockDrift) {
            onClockDrift((Math.random() < 0.5 ? -1 : 1) * (300 + Math.random() * 400));
          }

          setActive(prev => new Set([...prev, glitch]));

          const offId = window.setTimeout(() => {
            if (glitch === 'mirror') setMirrored(false);
            if (glitch === 'clock_drift' && onClockDrift) onClockDrift(0);
            setActive(prev => {
              const next = new Set(prev);
              next.delete(glitch);
              return next;
            });
          }, spec.duration);

          timers.push(offId);
        }, delay);

        timers.push(onId);
        // Schedule next repeat
        if (repeatIndex + 1 < spec.repeats) schedule(repeatIndex + 1);
      };

      schedule(0);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  const hasNoise    = glitches.includes('noise');
  const hasBurst    = active.has('static_burst');
  const hasTear     = active.has('screen_tear');
  const hasBleed    = active.has('signal_bleed');
  const hasDrop     = active.has('frame_drop');
  const hasBlackout = active.has('blackout');

  return (
    <div
      className="relative w-full min-h-screen"
      style={{ transform: mirrored ? 'scaleX(-1)' : undefined, transition: mirrored ? 'none' : undefined }}
    >
      {children}
      {hasNoise    && <Noise />}
      {hasBurst    && <StaticBurst />}
      {hasTear     && <ScreenTear position={tearPos} />}
      {hasBleed    && <SignalBleed offset={bleedOffset} />}
      {hasDrop     && <FrameDrop />}
      {hasBlackout && (
        <div
          className="absolute pointer-events-none z-50 bg-slate-950"
          style={{
            top:    `${20 + Math.random() * 40}%`,
            left:   0, right: 0,
            height: `${10 + Math.random() * 20}%`,
          }}
        />
      )}
    </div>
  );
}
