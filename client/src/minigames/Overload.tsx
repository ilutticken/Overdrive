import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../socket';
import type { OverloadSetup, MinigameCompleteCallback } from './types';
import { useMinigameTimer } from './useMinigameTimer';
import ModifierBadge from '../components/ModifierBadge';

interface Props {
  setup: OverloadSetup;
  onComplete: MinigameCompleteCallback;
  roomCode: string;
  deviceToken: string;
}

export default function Overload({ setup, onComplete, roomCode, deviceToken }: Props) {
  const { timeLeft, report } = useMinigameTimer(setup.duration);
  const [tapCount, setTapCount] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const tapRef = useRef(0);

  useEffect(() => {
    if (timeLeft === 0) {
      const t = tapRef.current;
      const deg =
        t < setup.targetTaps - 1 ? 'critical_failure' :
        t <= setup.targetTaps + 1 ? 'failure' :
        t <= setup.targetTaps + 4 ? 'mixed_success' :
        t <= setup.targetTaps + 7 ? 'success' :
        'critical_success';
      report(deg, onComplete);
    }
  }, [timeLeft]);

  const handleTap = () => {
    if (timeLeft <= 0) return;
    const n = tapRef.current + 1;
    tapRef.current = n;
    setTapCount(n);

    const scale = setup.difficultyTier === 'hard' ? 18 : setup.difficultyTier === 'easy' ? 8 : 12;
    const turbulence = setup.difficultyTier === 'hard' ? 12 : setup.difficultyTier === 'easy' ? 4 : 8;
    const angle = (n * 73) % 360;
    const rad = angle * (Math.PI / 180);
    setOffset({
      x: Math.cos(rad) * scale + Math.sin(n * 1.9) * turbulence,
      y: Math.sin(rad) * scale + Math.cos(n * 2.3) * turbulence,
    });

    socket.emit('player:minigame_progress', { roomCode, deviceToken, progress: n });
  };

  const color = tapCount < 8 ? '#ef4444' : tapCount < 16 ? '#fb7185' : tapCount < 24 ? '#f59e0b' : '#22c55e';
  const glow  = tapCount < 8 ? 'rgba(248,113,113,0.9)' : tapCount < 16 ? 'rgba(244,114,182,0.95)' : tapCount < 24 ? 'rgba(251,191,36,0.95)' : 'rgba(74,222,128,0.95)';
  const pulse = 1 + Math.min(0.25, tapCount * 0.012);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-red-950">
      <h2 className="text-4xl font-black text-red-500 mb-2 animate-pulse">OVERLOAD</h2>
      <div className="text-xl font-bold text-white mb-2">TIME: {(timeLeft / 1000).toFixed(1)}s</div>
      {setup.modifier && <ModifierBadge modifier={setup.modifier} difficultyTier={setup.difficultyTier} />}
      <div className="relative w-80 h-80 rounded-full border border-red-400/30 bg-red-950/60 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(127,29,29,0.55)]">
        <div className="absolute inset-3 rounded-full border border-red-500/20" />
        <button
          onPointerDown={handleTap}
          className="absolute w-40 h-40 rounded-full flex items-center justify-center select-none transition-all duration-75 ease-out"
          style={{
            transform: `translate(${offset.x}px,${offset.y}px) scale(${pulse})`,
            backgroundColor: color,
            border: `8px solid ${color}99`,
            boxShadow: `0 0 ${24 + tapCount * 1.5}px ${glow}, inset 0 0 16px rgba(255,255,255,0.25)`,
          }}
        >
          <span className="text-5xl font-black text-white">{tapCount}</span>
        </button>
      </div>
      <p className="mt-12 text-slate-300 text-lg text-center">MASH THE MOVING CORE!</p>
    </div>
  );
}
