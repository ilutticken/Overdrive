import React, { useEffect, useRef, useState } from 'react';
import type { LockSetup, MinigameCompleteCallback } from './types';
import { useMinigameTimer } from './useMinigameTimer';
import ModifierBadge from '../components/ModifierBadge';

interface Props {
  setup: LockSetup;
  onComplete: MinigameCompleteCallback;
}

export default function Lock({ setup, onComplete }: Props) {
  const { timeLeft, report } = useMinigameTimer(setup.duration);
  const [dotPos, setDotPos] = useState({ x: 50, y: 50 });
  const pointerRef    = useRef<{ x: number; y: number } | null>(null);
  const onTargetRef   = useRef(0);
  const totalRef      = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now() / 1000;
      const x = 50 + Math.sin(t * 0.9) * 32;
      const y = 50 + Math.sin(t * 1.7) * 28;
      setDotPos({ x, y });
      totalRef.current++;
      if (pointerRef.current) {
        const dx = pointerRef.current.x - x;
        const dy = pointerRef.current.y - y;
        if (Math.sqrt(dx * dx + dy * dy) < setup.hitRadius) onTargetRef.current++;
      }
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

  const trackPointer = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointerRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    };
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-slate-950 select-none touch-none"
      onPointerMove={trackPointer}
      onPointerDown={trackPointer}
      onPointerUp={() => { pointerRef.current = null; }}
      onPointerLeave={() => { pointerRef.current = null; }}
    >
      <h2 className="text-4xl font-black text-violet-500 mb-2 animate-pulse">LOCK ON</h2>
      <div className="text-xl font-bold text-white mb-1">TIME: {(timeLeft / 1000).toFixed(1)}s</div>
      <div className="text-lg font-mono text-violet-300 mb-4">UPTIME: {pct}%</div>
      {setup.modifier && <ModifierBadge modifier={setup.modifier} difficultyTier={setup.difficultyTier} />}
      <div className="relative w-72 h-72 bg-slate-900 border-4 border-violet-900 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(139,92,246,0.3)]">
        <div
          className="absolute w-16 h-16 rounded-full bg-violet-500 border-4 border-violet-300 shadow-[0_0_30px_rgba(139,92,246,0.9)]"
          style={{ left: `calc(${dotPos.x}% - 32px)`, top: `calc(${dotPos.y}% - 32px)`, transition: 'none' }}
        />
      </div>
      <p className="mt-8 text-slate-400 text-lg text-center">KEEP YOUR FINGER ON THE TARGET!</p>
    </div>
  );
}
