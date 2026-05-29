import React, { useEffect, useRef, useState } from 'react';
import type { JamSetup, MinigameCompleteCallback } from './types';
import { useMinigameTimer } from './useMinigameTimer';
import ModifierBadge from '../components/ModifierBadge';

interface Props {
  setup: JamSetup;
  onComplete: MinigameCompleteCallback;
}

export default function Jam({ setup, onComplete }: Props) {
  const { timeLeft, report } = useMinigameTimer(setup.duration);
  const [targetX, setTargetX] = useState(50);
  const [locked, setLocked]   = useState(false);
  const pointerXRef   = useRef<number | null>(null);
  const onTargetRef   = useRef(0);
  const totalRef      = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now() / 1000;
      const x = Math.max(8, Math.min(92, 50 + Math.sin(t * 0.7) * 35 + Math.sin(t * 1.3) * 10));
      setTargetX(x);
      totalRef.current++;
      const isLocked = pointerXRef.current !== null && Math.abs(pointerXRef.current - x) < setup.hitZoneWidth;
      if (isLocked) onTargetRef.current++;
      setLocked(isLocked);
    }, 50);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      const pct = totalRef.current > 0 ? onTargetRef.current / totalRef.current : 0;
      const deg = pct >= 0.7 ? 'critical_success' : pct >= 0.5 ? 'success' : pct >= 0.3 ? 'mixed_success' : 'failure';
      report(deg, onComplete);
    }
  }, [timeLeft]);

  const pct = totalRef.current > 0 ? Math.round((onTargetRef.current / totalRef.current) * 100) : 0;

  const trackX = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointerXRef.current = ((e.clientX - rect.left) / rect.width) * 100;
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-slate-950 select-none touch-none"
      onPointerMove={trackX}
      onPointerDown={trackX}
      onPointerUp={() => { pointerXRef.current = null; setLocked(false); }}
      onPointerLeave={() => { pointerXRef.current = null; setLocked(false); }}
    >
      <h2 className="text-4xl font-black text-lime-500 mb-2 animate-pulse">SIGNAL JAM</h2>
      <div className="text-xl font-bold text-white mb-1">TIME: {(timeLeft / 1000).toFixed(1)}s</div>
      <div className={`text-lg font-mono mb-6 transition-colors ${locked ? 'text-lime-300' : 'text-slate-500'}`}>
        {locked ? `LOCKED ${pct}%` : `SEARCHING... ${pct}%`}
      </div>
      {setup.modifier && <ModifierBadge modifier={setup.modifier} difficultyTier={setup.difficultyTier} />}
      <div className="relative w-full max-w-sm h-24 bg-slate-900 border-4 border-lime-900 rounded-full overflow-hidden shadow-[0_0_20px_rgba(132,204,22,0.3)]">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(90deg,rgba(132,204,22,0.5) 0,transparent 1px,transparent 4px)', backgroundSize: '5px 100%' }} />
        <div
          className={`absolute top-0 bottom-0 w-16 border-x-4 transition-all duration-75 ${locked ? 'bg-lime-400/60 border-lime-300 shadow-[0_0_20px_rgba(163,230,53,0.8)]' : 'bg-lime-500/30 border-lime-500'}`}
          style={{ left: `calc(${targetX}% - 32px)` }}
        />
      </div>
      <p className="mt-8 text-slate-400 text-lg text-center">HOLD YOUR FINGER IN THE SIGNAL ZONE!</p>
    </div>
  );
}
