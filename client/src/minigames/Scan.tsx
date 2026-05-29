import React, { useEffect, useRef, useState } from 'react';
import type { ScanSetup, MinigameCompleteCallback } from './types';
import { useMinigameTimer } from './useMinigameTimer';
import ModifierBadge from '../components/ModifierBadge';

interface Props {
  setup: ScanSetup;
  onComplete: MinigameCompleteCallback;
}

export default function Scan({ setup, onComplete }: Props) {
  const { timeLeft, report } = useMinigameTimer(setup.duration);
  const [currentIndex, setCurrentIndex] = useState(0);
  const indexRef = useRef(0);

  // Accelerating cycle through codes
  useEffect(() => {
    let speed = setup.baseInterval;
    let tid: number;
    const tick = () => {
      const next = (indexRef.current + 1) % setup.codes.length;
      indexRef.current = next;
      setCurrentIndex(next);
      speed = Math.max(setup.minInterval, speed - 60);
      tid = window.setTimeout(tick, speed);
    };
    tid = window.setTimeout(tick, speed);
    return () => clearTimeout(tid);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) report('failure', onComplete);
  }, [timeLeft]);

  const handleTap = () => {
    const current = setup.codes[indexRef.current];
    const deg = current === setup.target ? 'success' : 'critical_failure';
    report(deg, onComplete);
  };

  const curr = setup.codes[currentIndex] || '????';
  const prev = setup.codes[(currentIndex - 1 + setup.codes.length) % setup.codes.length] || '????';
  const next = setup.codes[(currentIndex + 1) % setup.codes.length] || '????';

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-slate-950 cursor-pointer select-none"
      onPointerDown={handleTap}
    >
      <h2 className="text-4xl font-black text-green-500 mb-2 animate-pulse">SIGNAL SCAN</h2>
      <div className="text-xl font-bold text-white mb-4">TIME: {(timeLeft / 1000).toFixed(1)}s</div>
      {setup.modifier && <ModifierBadge modifier={setup.modifier} difficultyTier={setup.difficultyTier} />}
      <div className="mb-8 px-8 py-3 bg-slate-900 border border-green-900 rounded-xl text-center">
        <div className="text-xs text-green-600 uppercase tracking-widest mb-1">ISOLATE TARGET</div>
        <div className="text-3xl font-mono font-black text-green-400 tracking-widest">{setup.target}</div>
      </div>
      <div className="text-center text-xl font-mono text-slate-700 mb-1 opacity-50">{prev}</div>
      <div className={`text-center text-5xl font-mono font-black py-4 px-8 rounded-xl border-2 transition-all ${curr === setup.target ? 'text-green-300 border-green-500 bg-green-950/60 shadow-[0_0_30px_rgba(74,222,128,0.5)]' : 'text-slate-300 border-slate-700 bg-slate-900/50'}`}>
        {curr}
      </div>
      <div className="text-center text-xl font-mono text-slate-700 mt-1 opacity-50">{next}</div>
      <p className="mt-10 text-slate-400 text-lg text-center">TAP WHEN TARGET APPEARS!</p>
    </div>
  );
}
