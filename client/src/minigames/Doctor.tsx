import React, { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from '../socket';
import type { DoctorSetup, DoctorStepType, MinigameCompleteCallback } from './types';
import { clampDegree } from './types';
import { useMinigameTimer } from './useMinigameTimer';
import ModifierBadge from '../components/ModifierBadge';

interface Props {
  setup:       DoctorSetup;
  onComplete:  MinigameCompleteCallback;
  roomCode?:   string;
  deviceToken?: string;
}

// ─── Step sub-UIs ────────────────────────────────────────────────────────────

function PressureStep({ duration, onResult }: { duration: number; onResult: (success: boolean) => void }) {
  const [held, setHeld] = useState(false);
  const [fill, setFill] = useState(0);
  const fillRef     = useRef(0);
  const heldRef     = useRef(false);
  const reportedRef = useRef(false);
  const HOLD_TARGET = 0.65; // fraction of stepDuration to hold for success

  useEffect(() => {
    const id = window.setInterval(() => {
      if (heldRef.current) {
        fillRef.current = Math.min(1, fillRef.current + 100 / duration);
        setFill(fillRef.current);
        if (fillRef.current >= HOLD_TARGET && !reportedRef.current) {
          reportedRef.current = true;
          onResult(true);
        }
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  // Auto-fail on step timeout
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!reportedRef.current) { reportedRef.current = true; onResult(false); }
    }, duration);
    return () => clearTimeout(id);
  }, []);

  const pct = Math.round(fill * 100);
  return (
    <div
      className="flex flex-col items-center gap-6 select-none touch-none w-full"
      onPointerDown={() => { heldRef.current = true; setHeld(true); }}
      onPointerUp={() => { heldRef.current = false; setHeld(false); }}
      onPointerLeave={() => { heldRef.current = false; setHeld(false); }}
    >
      <div
        className={`relative w-48 h-48 rounded-full border-8 flex items-center justify-center transition-all ${held ? 'border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.8)]' : 'border-slate-600 shadow-none'}`}
        style={{
          background: `conic-gradient(${held ? '#34d399' : '#475569'} ${pct * 3.6}deg, #1e293b ${pct * 3.6}deg)`
        }}
      >
        <div className="w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center">
          <span className="text-3xl font-black text-white">{pct}%</span>
        </div>
      </div>
      <p className="text-slate-400 text-lg text-center">HOLD DOWN TO APPLY PRESSURE</p>
    </div>
  );
}

function AlignStep({ duration, onResult }: { duration: number; onResult: (success: boolean) => void }) {
  const [tick, setTick] = useState(0);
  const tickRef     = useRef(0);
  const reportedRef = useRef(false);
  const TOTAL_TICKS = duration / 100;

  useEffect(() => {
    const id = window.setInterval(() => {
      tickRef.current++;
      setTick(tickRef.current);
    }, 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!reportedRef.current) { reportedRef.current = true; onResult(false); }
    }, duration);
    return () => clearTimeout(id);
  }, []);

  const sweep = Math.abs(Math.sin((tick / TOTAL_TICKS) * Math.PI * 2.5)) * 100;
  const TARGET = 55, SUCCESS_W = 18, CRIT_W = 8;

  const handleTap = () => {
    if (reportedRef.current) return;
    const err = Math.abs(sweep - TARGET);
    reportedRef.current = true;
    onResult(err <= SUCCESS_W / 2);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full cursor-pointer" onPointerDown={handleTap}>
      <div className="relative w-full max-w-sm h-14 bg-slate-900 rounded-full border-4 border-emerald-900 overflow-hidden shadow-[0_0_20px_rgba(52,211,153,0.3)]">
        <div className="absolute top-0 bottom-0 bg-green-500/20 border-x-2 border-green-500/50"
          style={{ left: `${TARGET - SUCCESS_W / 2}%`, width: `${SUCCESS_W}%` }} />
        <div className="absolute top-0 bottom-0 bg-green-400/60 border-x-4 border-green-400"
          style={{ left: `${TARGET - CRIT_W / 2}%`, width: `${CRIT_W}%` }} />
        <div className="absolute top-0 bottom-0 w-4 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)] transition-all duration-75"
          style={{ left: `calc(${Math.min(96, Math.max(0, sweep))}% - 8px)` }} />
      </div>
      <p className="text-slate-400 text-lg text-center">TAP IN THE GREEN ZONE</p>
    </div>
  );
}

function DirectionStep({
  direction = 'U',
  duration,
  onResult,
}: {
  direction?: 'U' | 'D' | 'L' | 'R';
  duration: number;
  onResult: (success: boolean) => void;
}) {
  const startRef    = useRef<{ x: number; y: number } | null>(null);
  const reportedRef = useRef(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!reportedRef.current) { reportedRef.current = true; onResult(false); }
    }, duration);
    return () => clearTimeout(id);
  }, []);

  const ARROW: Record<string, string> = { U: '↑', D: '↓', L: '←', R: '→' };
  const LABEL: Record<string, string> = { U: 'SWIPE UP', D: 'SWIPE DOWN', L: 'SWIPE LEFT', R: 'SWIPE RIGHT' };

  const handleDown = (e: React.PointerEvent) => { startRef.current = { x: e.clientX, y: e.clientY }; };
  const handleUp   = (e: React.PointerEvent) => {
    if (!startRef.current || reportedRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) < 30) return;
    const horiz = Math.abs(dx) > Math.abs(dy);
    const detected = horiz ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U');
    reportedRef.current = true;
    onResult(detected === direction);
  };

  return (
    <div
      className="flex flex-col items-center gap-6 w-full select-none touch-none cursor-pointer"
      onPointerDown={handleDown}
      onPointerUp={handleUp}
    >
      <div className="text-9xl font-black text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.8)] animate-pulse">
        {ARROW[direction]}
      </div>
      <p className="text-slate-400 text-lg text-center">{LABEL[direction]}</p>
    </div>
  );
}

// ─── Main Doctor component ────────────────────────────────────────────────────

export default function Doctor({ setup, onComplete, roomCode, deviceToken }: Props) {
  const { timeLeft, report } = useMinigameTimer(setup.duration);

  const [stepIndex, setStepIndex]     = useState(0);
  const [successes, setSuccesses]     = useState(0);
  const [stepKey, setStepKey]         = useState(0); // forces step sub-component remount
  const successesRef = useRef(0);
  const completedRef = useRef(false);

  // Safety net: if overall timer runs out before all steps finish
  useEffect(() => {
    if (timeLeft === 0) finish();
  }, [timeLeft]);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    const s = successesRef.current;
    const n = setup.steps.length;
    const raw =
      s >= n     ? 'critical_success' :
      s >= n - 1 ? 'success'          :
      s >= 1     ? 'mixed_success'    :
      s === 0    ? 'failure'          : 'critical_failure';
    report(clampDegree(raw, setup.degreeFloor, setup.degreeCeiling), onComplete);
  }, [setup, onComplete, report]);

  const handleStepResult = useCallback((success: boolean) => {
    if (completedRef.current) return;
    if (success) {
      successesRef.current++;
      setSuccesses(s => s + 1);
    }
    const nextIndex = stepIndex + 1;
    // Encode step progress as stepIndex*10 + successes for host display
    if (roomCode && deviceToken) {
      socket.emit('player:minigame_progress', {
        roomCode, deviceToken,
        progress: nextIndex * 10 + successesRef.current,
      });
    }
    if (nextIndex >= setup.steps.length) {
      finish();
    } else {
      setStepIndex(nextIndex);
      setStepKey(k => k + 1);
    }
  }, [stepIndex, setup.steps.length, finish, roomCode, deviceToken]);

  const currentStep = setup.steps[stepIndex];
  const done        = stepIndex >= setup.steps.length;

  const WOUND_COLOR: Record<string, string> = {
    laceration: 'text-red-400',
    fracture:   'text-orange-400',
    trauma:     'text-yellow-400',
  };
  const WOUND_LABEL: Record<string, string> = {
    laceration: 'LACERATION',
    fracture:   'FRACTURE',
    trauma:     'TRAUMA',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 select-none">
      <h2 className={`text-3xl font-black mb-1 animate-pulse ${WOUND_COLOR[setup.woundType]}`}>
        FIELD MEDICINE
      </h2>
      <div className={`text-sm font-bold uppercase tracking-widest mb-2 ${WOUND_COLOR[setup.woundType]}`}>
        {WOUND_LABEL[setup.woundType]}
      </div>
      <div className="text-xl font-bold text-white mb-4">TIME: {(timeLeft / 1000).toFixed(1)}s</div>

      {setup.modifier && <ModifierBadge modifier={setup.modifier} difficultyTier={setup.difficultyTier} />}

      {/* Step progress indicator */}
      <div className="flex gap-3 mb-8 items-center">
        {setup.steps.map((step, i) => (
          <React.Fragment key={i}>
            <div className={`flex flex-col items-center gap-1`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all
                ${i < stepIndex  ? 'bg-emerald-500 text-white' :
                  i === stepIndex ? 'bg-white text-slate-900 animate-pulse scale-110' :
                                    'bg-slate-700 text-slate-500'}`}>
                {i < stepIndex ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-bold
                ${i === stepIndex ? 'text-white' : 'text-slate-500'}`}>
                {step.label}
              </span>
            </div>
            {i < setup.steps.length - 1 && (
              <div className={`w-8 h-0.5 mb-4 transition-colors ${i < stepIndex ? 'bg-emerald-500' : 'bg-slate-700'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Active step UI */}
      {!done && currentStep && (
        <div className="w-full max-w-xs flex flex-col items-center gap-4">
          <div className="text-lg font-black text-emerald-400 tracking-widest mb-2">
            {currentStep.label}
          </div>
          {currentStep.type === 'pressure' && (
            <PressureStep key={stepKey} duration={setup.stepDuration} onResult={handleStepResult} />
          )}
          {currentStep.type === 'align' && (
            <AlignStep key={stepKey} duration={setup.stepDuration} onResult={handleStepResult} />
          )}
          {currentStep.type === 'direction' && (
            <DirectionStep
              key={stepKey}
              duration={setup.stepDuration}
              direction={currentStep.direction}
              onResult={handleStepResult}
            />
          )}
        </div>
      )}
    </div>
  );
}
