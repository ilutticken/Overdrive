import React, { useEffect, useRef } from 'react';
import type { SlashSetup, MinigameCompleteCallback } from './types';
import { useMinigameTimer } from './useMinigameTimer';
import ModifierBadge from '../components/ModifierBadge';

interface Props {
  setup: SlashSetup;
  onComplete: MinigameCompleteCallback;
}

export default function Slash({ setup, onComplete }: Props) {
  const { timeLeft, report } = useMinigameTimer(setup.duration);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (timeLeft === 0) report('failure', onComplete);
  }, [timeLeft]);

  const handleDown = (e: React.PointerEvent) => {
    startRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleUp = (e: React.PointerEvent) => {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) < 30) return;
    const swipe = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
    let diff = Math.abs(swipe - setup.targetAngle);
    if (diff > 180) diff = 360 - diff;
    const { critical, success, mixed } = setup.tolerances;
    const deg =
      diff <= critical ? 'critical_success' :
      diff <= success  ? 'success' :
      diff <= mixed    ? 'mixed_success' :
      'failure';
    report(deg, onComplete);
  };

  const rad = setup.targetAngle * Math.PI / 180;
  const r = 38;
  const [cx, cy] = [50, 50];
  const x1 = cx - Math.cos(rad) * r, y1 = cy - Math.sin(rad) * r;
  const x2 = cx + Math.cos(rad) * r, y2 = cy + Math.sin(rad) * r;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-slate-950 select-none touch-none"
      onPointerDown={handleDown}
      onPointerUp={handleUp}
    >
      <h2 className="text-4xl font-black text-rose-500 mb-2 animate-pulse">SLASH</h2>
      <div className="text-xl font-bold text-white mb-6">TIME: {(timeLeft / 1000).toFixed(1)}s</div>
      {setup.modifier && <ModifierBadge modifier={setup.modifier} difficultyTier={setup.difficultyTier} />}
      <svg viewBox="0 0 100 100" className="w-72 h-72">
        <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(244,63,94,0.15)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(244,63,94,0.08)" strokeWidth="0.3" />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px #f43f5e)' }} />
        <circle cx={x1} cy={y1} r="2" fill="#f43f5e" opacity="0.6" />
        <circle cx={x2} cy={y2} r="2" fill="#f43f5e" opacity="0.6" />
        <circle cx="50" cy="50" r="1.5" fill="white" opacity="0.4" />
      </svg>
      <p className="mt-6 text-slate-400 text-lg text-center">SWIPE ALONG THE BLADE!</p>
    </div>
  );
}
