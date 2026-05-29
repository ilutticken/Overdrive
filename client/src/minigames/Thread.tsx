import React, { useEffect, useRef, useState } from 'react';
import type { ThreadSetup, MinigameCompleteCallback } from './types';
import { useMinigameTimer } from './useMinigameTimer';
import ModifierBadge from '../components/ModifierBadge';

interface Props {
  setup: ThreadSetup;
  onComplete: MinigameCompleteCallback;
}

export default function Thread({ setup, onComplete }: Props) {
  const { timeLeft, report } = useMinigameTimer(setup.duration);
  const [gateIndex, setGateIndex] = useState(0);
  const gateRef  = useRef(0);
  const scoreRef = useRef(0);

  // Advance gates on a schedule independent of player taps
  useEffect(() => {
    const interval = Math.floor(setup.duration / setup.gates.length);
    const id = window.setInterval(() => {
      const next = gateRef.current + 1;
      gateRef.current = next;
      setGateIndex(next);
    }, interval);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      const s = scoreRef.current;
      const n = setup.gates.length;
      const deg = s >= n ? 'critical_success' : s >= n - 1 ? 'success' : s >= n - 2 ? 'mixed_success' : 'failure';
      report(deg, onComplete);
    }
  }, [timeLeft]);

  const tap = (side: 'L' | 'R') => {
    const idx = gateRef.current;
    if (idx >= setup.gates.length) return;
    if (side !== setup.gates[idx].side) scoreRef.current++;
    const next = idx + 1;
    gateRef.current = next;
    setGateIndex(next);
    if (next >= setup.gates.length) {
      const s = scoreRef.current;
      const n = setup.gates.length;
      const deg = s >= n ? 'critical_success' : s >= n - 1 ? 'success' : s >= n - 2 ? 'mixed_success' : 'failure';
      report(deg, onComplete);
    }
  };

  const current = gateIndex < setup.gates.length ? setup.gates[gateIndex] : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 select-none">
      <h2 className="text-4xl font-black text-orange-500 mb-2 animate-pulse">THREAD</h2>
      <div className="text-xl font-bold text-white mb-1">TIME: {(timeLeft / 1000).toFixed(1)}s</div>
      <div className="text-sm text-orange-400 mb-4 font-mono">GATES: {Math.min(gateIndex, setup.gates.length)}/{setup.gates.length}</div>
      {setup.modifier && <ModifierBadge modifier={setup.modifier} difficultyTier={setup.difficultyTier} />}
      <div className="flex w-full max-w-xs h-56 gap-3 px-4">
        {(['L', 'R'] as const).map(side => {
          const blocked = !!current && current.side === side;
          return (
            <div
              key={side}
              onPointerDown={() => tap(side)}
              className={`flex-1 rounded-2xl flex items-center justify-center text-4xl font-black cursor-pointer active:opacity-60 transition-all duration-100
                ${blocked
                  ? 'bg-red-950 border-4 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                  : 'bg-slate-800 border-4 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]'}`}
            >
              {blocked ? '✕' : side === 'L' ? '◀' : '▶'}
            </div>
          );
        })}
      </div>
      <p className="mt-8 text-slate-400 text-lg text-center">TAP THE OPEN SIDE!</p>
    </div>
  );
}
