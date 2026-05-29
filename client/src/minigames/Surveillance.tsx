import React, { useEffect, useRef, useState } from 'react';
import type { SurveillanceSetup, MinigameCompleteCallback } from './types';
import { useMinigameTimer } from './useMinigameTimer';
import ModifierBadge from '../components/ModifierBadge';

interface Props {
  setup: SurveillanceSetup;
  onComplete: MinigameCompleteCallback;
}

export default function Surveillance({ setup, onComplete }: Props) {
  const { timeLeft, report } = useMinigameTimer(setup.duration);
  const [sweep, setSweep] = useState(0);
  const sweepRef = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now() / 1000;
      const pos = 50 + Math.sin(t * 1.2) * 45;
      sweepRef.current = pos;
      setSweep(pos);
    }, 50);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) report('failure', onComplete);
  }, [timeLeft]);

  const handleTap = () => {
    const { center, width } = setup.blindSpot;
    const diff = Math.abs(sweepRef.current - center);
    const half = width / 2;
    const deg =
      diff <= half * 0.25 ? 'critical_success' :
      diff <= half * 0.55 ? 'success' :
      diff <= half        ? 'mixed_success' :
      'failure';
    report(deg, onComplete);
  };

  const { center, width } = setup.blindSpot;
  const inSpot = Math.abs(sweep - center) <= width / 2;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-slate-950 cursor-pointer select-none"
      onPointerDown={handleTap}
    >
      <h2 className="text-4xl font-black text-teal-500 mb-2 animate-pulse">GHOST</h2>
      <div className="text-xl font-bold text-white mb-6">TIME: {(timeLeft / 1000).toFixed(1)}s</div>
      {setup.modifier && <ModifierBadge modifier={setup.modifier} difficultyTier={setup.difficultyTier} />}
      <div className="relative w-full max-w-sm h-20 bg-slate-900 border-4 border-teal-900 rounded-full overflow-hidden shadow-[0_0_20px_rgba(20,184,166,0.3)] mb-2">
        <div
          className="absolute top-0 bottom-0 bg-teal-500/20 border-x-2 border-teal-400/50"
          style={{ left: `${center - width / 2}%`, width: `${width}%` }}
        />
        <div
          className={`absolute top-2 bottom-2 w-6 rounded-full transition-all duration-75 ${inSpot ? 'bg-red-400 shadow-[0_0_15px_rgba(248,113,113,0.9)]' : 'bg-slate-400'}`}
          style={{ left: `calc(${sweep}% - 12px)` }}
        />
      </div>
      <div className="text-xs text-teal-600 tracking-widest mb-8">BLIND SPOT MARKED</div>
      <p className="text-slate-400 text-lg text-center">TAP WHEN THE GUARD ENTERS THE BLIND SPOT!</p>
    </div>
  );
}
