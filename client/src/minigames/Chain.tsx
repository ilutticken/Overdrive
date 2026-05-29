import React, { useEffect, useRef, useState } from 'react';
import type { ChainSetup, MinigameCompleteCallback } from './types';
import { useMinigameTimer } from './useMinigameTimer';
import ModifierBadge from '../components/ModifierBadge';

interface Props {
  setup: ChainSetup;
  onComplete: MinigameCompleteCallback;
}

export default function Chain({ setup, onComplete }: Props) {
  const { timeLeft, report } = useMinigameTimer(setup.duration);
  const [index, setIndex] = useState(0);
  const indexRef  = useRef(0);
  const brokenRef = useRef(false);

  useEffect(() => {
    if (timeLeft === 0 && !brokenRef.current) {
      const pct = indexRef.current / setup.sequence.length;
      const deg = pct >= 1 ? 'critical_success' : pct >= 0.75 ? 'success' : pct >= 0.5 ? 'mixed_success' : 'failure';
      report(deg, onComplete);
    }
  }, [timeLeft]);

  const tap = (side: 'L' | 'R') => {
    if (brokenRef.current) return;
    const idx = indexRef.current;
    if (idx >= setup.sequence.length) return;
    if (side === setup.sequence[idx]) {
      const next = idx + 1;
      indexRef.current = next;
      setIndex(next);
      if (next >= setup.sequence.length) report('critical_success', onComplete);
    } else {
      brokenRef.current = true;
      const pct = idx / setup.sequence.length;
      const deg = pct >= 0.75 ? 'success' : pct >= 0.5 ? 'mixed_success' : 'failure';
      report(deg, onComplete);
    }
  };

  const current = index < setup.sequence.length ? setup.sequence[index] : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 select-none">
      <h2 className="text-4xl font-black text-cyan-500 mb-2 animate-pulse">CHAIN</h2>
      <div className="text-xl font-bold text-white mb-4">TIME: {(timeLeft / 1000).toFixed(1)}s</div>
      <div className="flex gap-2 mb-8">
        {setup.sequence.map((_, i) => (
          <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i < index ? 'bg-cyan-400' : i === index ? 'bg-white animate-pulse' : 'bg-slate-700'}`} />
        ))}
      </div>
      {setup.modifier && <ModifierBadge modifier={setup.modifier} difficultyTier={setup.difficultyTier} />}
      {current && (
        <div className={`text-9xl font-black mb-10 ${current === 'L' ? 'text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.8)]' : 'text-fuchsia-400 drop-shadow-[0_0_30px_rgba(232,121,249,0.8)]'}`}>
          {current === 'L' ? '◀' : '▶'}
        </div>
      )}
      <div className="flex w-full max-w-xs gap-4 px-4">
        <div onPointerDown={() => tap('L')} className="flex-1 h-28 bg-cyan-900/40 border-4 border-cyan-600 rounded-2xl flex items-center justify-center text-4xl text-cyan-400 cursor-pointer active:bg-cyan-900 transition-colors">◀</div>
        <div onPointerDown={() => tap('R')} className="flex-1 h-28 bg-fuchsia-900/40 border-4 border-fuchsia-600 rounded-2xl flex items-center justify-center text-4xl text-fuchsia-400 cursor-pointer active:bg-fuchsia-900 transition-colors">▶</div>
      </div>
    </div>
  );
}
