import React, { useEffect } from 'react';
import type { BluffSetup, MinigameCompleteCallback } from './types';
import { useMinigameTimer } from './useMinigameTimer';
import ModifierBadge from '../components/ModifierBadge';

interface Props {
  setup: BluffSetup;
  onComplete: MinigameCompleteCallback;
}

export default function Bluff({ setup, onComplete }: Props) {
  const { timeLeft, report } = useMinigameTimer(setup.duration);

  useEffect(() => {
    if (timeLeft === 0) report('failure', onComplete);
  }, [timeLeft]);

  // Sweeps back and forth 3 times over the duration
  const sweep = Math.abs(Math.sin((timeLeft / setup.duration) * Math.PI * 3)) * 100;
  const { targetCenter: tc, successWindow: sw, criticalWindow: cw } = setup;

  const handleTap = () => {
    if (timeLeft <= 0) return;
    const err = Math.abs(sweep - tc);
    const deg =
      err <= cw / 2 ? 'critical_success' :
      err <= sw / 2 ? 'success' :
      err <= sw / 2 + 8 ? 'mixed_success' :
      'failure';
    report(deg, onComplete);
  };

  const successLeft  = Math.max(0, tc - sw / 2);
  const criticalLeft = Math.max(0, tc - cw / 2);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 cursor-pointer"
      onPointerDown={handleTap}
    >
      <h2 className="text-4xl font-black text-amber-500 mb-2 animate-pulse">RESOLVE</h2>
      <div className="text-xl font-bold text-white mb-2">TIME: {(timeLeft / 1000).toFixed(1)}s</div>
      {setup.modifier && <ModifierBadge modifier={setup.modifier} difficultyTier={setup.difficultyTier} />}
      <div className="relative w-full max-w-sm h-16 bg-amber-950 rounded-full border-4 border-amber-900 overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.5)]">
        <div className="absolute top-0 bottom-0 bg-green-500/20 border-x-2 border-green-500/50" style={{ left: `${successLeft}%`, width: `${Math.min(sw, 100 - successLeft)}%` }} />
        <div className="absolute top-0 bottom-0 bg-green-400/60 border-x-4 border-green-400" style={{ left: `${criticalLeft}%`, width: `${Math.min(cw, 100 - criticalLeft)}%` }} />
        <div
          className="absolute top-0 bottom-0 w-4 bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,1)] transition-all duration-75"
          style={{ left: `calc(${Math.min(95, Math.max(0, sweep))}% - 8px)` }}
        />
      </div>
      <p className="mt-12 text-slate-400 text-lg text-center">TAP IN THE GREEN ZONE<br />TO MAINTAIN RESOLVE!</p>
    </div>
  );
}
