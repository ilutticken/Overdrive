import React, { useEffect } from 'react';
import type { DeflectSetup, MinigameCompleteCallback } from './types';
import { useMinigameTimer } from './useMinigameTimer';
import ModifierBadge from '../components/ModifierBadge';

interface Props {
  setup: DeflectSetup;
  onComplete: MinigameCompleteCallback;
}

export default function Deflect({ setup, onComplete }: Props) {
  const { timeLeft, report } = useMinigameTimer(setup.duration);

  useEffect(() => {
    if (timeLeft === 0) report('failure', onComplete);
  }, [timeLeft]);

  const scale = (timeLeft / setup.duration) * 100;

  const handleTap = () => {
    if (timeLeft <= 0) return;
    const [critMin, critMax] = setup.criticalWindow;
    const [sucMin, sucMax]   = setup.successWindow;
    const [mixMin, mixMax]   = setup.mixedWindow;
    const deg =
      scale >= critMin && scale <= critMax ? 'critical_success' :
      scale >= sucMin  && scale <= sucMax  ? 'success' :
      scale >= mixMin  && scale <= mixMax  ? 'mixed_success' :
      scale < 20 || scale > 60            ? 'critical_failure' :
      'failure';
    report(deg, onComplete);
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 cursor-pointer"
      onPointerDown={handleTap}
    >
      <h2 className="text-4xl font-black text-blue-500 mb-2 animate-pulse">DEFLECT</h2>
      <div className="text-xl font-bold text-white mb-2">TIME: {(timeLeft / 1000).toFixed(1)}s</div>
      {setup.modifier && <ModifierBadge modifier={setup.modifier} difficultyTier={setup.difficultyTier} />}
      <div className="relative w-80 h-80 flex items-center justify-center">
        <div className="absolute rounded-full border-green-500/20 pointer-events-none" style={{ width: '50%', height: '50%', borderWidth: '32px' }} />
        <div className="absolute rounded-full border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.8)] pointer-events-none" style={{ width: '43%', height: '43%', borderWidth: '9px' }} />
        <div
          className="absolute rounded-full border-[12px] border-blue-400 shadow-[0_0_30px_rgba(96,165,250,0.8)] pointer-events-none transition-all duration-100 ease-linear"
          style={{ width: `${Math.max(0, scale)}%`, height: `${Math.max(0, scale)}%` }}
        />
        <div className="w-4 h-4 bg-white rounded-full pointer-events-none" />
      </div>
      <p className="mt-12 text-slate-400 text-lg">TAP WHEN RINGS ALIGN!</p>
    </div>
  );
}
