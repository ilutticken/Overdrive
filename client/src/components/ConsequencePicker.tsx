import React, { useState } from 'react';
import type { DegreeOfSuccess } from '../minigames/types';

export type Position = 'controlled' | 'risky' | 'desperate';
export type Effect   = 'limited'    | 'standard' | 'great';

// ─── Consequence + Bonus option definitions ───────────────────────────────────

export interface ConsequenceOption {
  id:          string;
  label:       string;
  description: string;
  // Minimum position severity for this option to appear.
  // 'controlled' = always available; 'desperate' = only on desperate.
  minPosition: Position;
  mechanical:  boolean; // true = auto-applied by server on submission
}

export interface BonusOption {
  id:          string;
  label:       string;
  description: string;
}

const CONSEQUENCES: ConsequenceOption[] = [
  { id: 'stress_1',        label: 'Take 1 Stress',             description: 'Mark 1 stress on your track.',           minPosition: 'controlled', mechanical: false },
  { id: 'reduced_effect',  label: 'Reduced Effect',            description: 'Your Effect drops one step.',            minPosition: 'controlled', mechanical: false },
  { id: 'adversary_acts',  label: 'Adversary Acts',            description: 'A random adversary takes a free action.',minPosition: 'controlled', mechanical: false },
  { id: 'stress_2',        label: 'Take 2 Stress',             description: 'Mark 2 stress on your track.',           minPosition: 'risky',      mechanical: false },
  { id: 'clock_advance',   label: 'Advance Threat Clock',      description: 'A danger clock fills 1–2 segments.',     minPosition: 'risky',      mechanical: false },
  { id: 'lose_gear',       label: 'Lose Gear Access',          description: 'One piece of gear is unavailable this scene.', minPosition: 'risky', mechanical: false },
  { id: 'health_1',        label: 'Take 1 Health',             description: 'Mark 1 health damage.',                  minPosition: 'desperate',  mechanical: true  },
  { id: 'condition',       label: 'Gain a Condition',          description: 'The GM assigns a Condition.',            minPosition: 'desperate',  mechanical: false },
  { id: 'objective_lost',  label: 'Objective Lost',            description: 'This approach fails — cannot retry.',    minPosition: 'desperate',  mechanical: false },
];

const BONUSES: BonusOption[] = [
  { id: 'clear_stress',    label: 'Clear 1 Stress',           description: 'Remove 1 stress from your track.'  },
  { id: 'clock_fill',      label: 'Advance Project Clock',    description: 'A project clock fills 1 extra segment.' },
  { id: 'ally_advantage',  label: 'Grant Ally Advantage',     description: 'An ally gets +1 Advantage on their next mini-game.' },
  { id: 'effect_upgrade',  label: 'Upgrade Effect',           description: 'Your Effect rises one step.' },
  { id: 'clock_reduce',    label: 'Reduce Threat Clock',      description: 'A danger clock loses 1 segment.' },
];

const POSITION_ORDER: Record<Position, number> = { controlled: 0, risky: 1, desperate: 2 };

function optionsForPosition(position: Position): ConsequenceOption[] {
  const threshold = POSITION_ORDER[position];
  return CONSEQUENCES.filter(c => POSITION_ORDER[c.minPosition] <= threshold);
}

// ─── Choose-count by outcome ──────────────────────────────────────────────────

function chooseCount(degree: DegreeOfSuccess): { type: 'consequence' | 'bonus' | 'none'; count: number } {
  switch (degree) {
    case 'critical_success': return { type: 'bonus',       count: 1 };
    case 'success':          return { type: 'none',        count: 0 };
    case 'mixed_success':    return { type: 'consequence', count: 1 };
    case 'failure':          return { type: 'consequence', count: 2 };
    case 'critical_failure': return { type: 'consequence', count: 3 };
  }
}

// ─── Outcome display config ───────────────────────────────────────────────────

const OUTCOME_CONFIG: Record<DegreeOfSuccess, { label: string; color: string; glow: string }> = {
  critical_success: { label: 'CRITICAL SUCCESS', color: 'text-purple-400',  glow: 'shadow-[0_0_30px_rgba(192,132,252,0.6)]' },
  success:          { label: 'SUCCESS',          color: 'text-emerald-400', glow: 'shadow-[0_0_30px_rgba(52,211,153,0.6)]'  },
  mixed_success:    { label: 'MIXED SUCCESS',    color: 'text-amber-400',   glow: 'shadow-[0_0_30px_rgba(251,191,36,0.6)]'  },
  failure:          { label: 'FAILURE',          color: 'text-red-400',     glow: 'shadow-[0_0_30px_rgba(248,113,113,0.6)]' },
  critical_failure: { label: 'CRITICAL FAILURE', color: 'text-rose-500',    glow: 'shadow-[0_0_30px_rgba(244,63,94,0.6)]'   },
};

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  degree:   DegreeOfSuccess;
  position: Position;
  effect:   Effect;
  onSubmit: (choices: string[]) => void;
}

export default function ConsequencePicker({ degree, position, effect, onSubmit }: Props) {
  const { type, count } = chooseCount(degree);
  const [selected, setSelected] = useState<string[]>([]);
  const outcomeConf = OUTCOME_CONFIG[degree];

  const options   = type === 'consequence' ? optionsForPosition(position) : BONUSES;
  const canSubmit = type === 'none' || selected.length === count;

  const toggle = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= count) return [...prev.slice(1), id]; // replace oldest if full
      return [...prev, id];
    });
  };

  if (type === 'none') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 gap-8">
        <div className={`text-5xl font-black tracking-widest ${outcomeConf.color} drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]`}>
          {outcomeConf.label}
        </div>
        <p className="text-slate-400 text-lg text-center">Clean resolution. No consequences.</p>
        <button
          onClick={() => onSubmit([])}
          className="px-10 py-4 bg-slate-700 hover:bg-slate-600 text-white font-black rounded-xl text-xl transition-colors"
        >
          CONTINUE
        </button>
      </div>
    );
  }

  const verb        = type === 'bonus' ? 'Choose a bonus' : `Choose ${count} consequence${count > 1 ? 's' : ''}`;
  const submitLabel = type === 'bonus' ? 'CLAIM BONUS' : 'ACCEPT CONSEQUENCES';
  const accentColor = type === 'bonus' ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300' : 'border-red-500 bg-red-950/50 text-red-300';

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 p-6 overflow-y-auto">
      {/* Outcome header */}
      <div className={`text-4xl font-black tracking-widest text-center mb-1 ${outcomeConf.color}`}>
        {outcomeConf.label}
      </div>
      <div className="text-center text-slate-500 text-sm uppercase tracking-widest mb-6">
        {position.toUpperCase()} POSITION · {effect.toUpperCase()} EFFECT
      </div>

      {/* Instruction */}
      <div className={`rounded-xl border px-4 py-3 text-center font-bold mb-6 ${accentColor}`}>
        {verb}
        {count > 1 && (
          <span className="ml-2 text-sm opacity-75">({selected.length}/{count} selected)</span>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3 mb-8">
        {options.map(opt => {
          const isSelected = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? type === 'bonus'
                    ? 'border-emerald-400 bg-emerald-950/60 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                    : 'border-red-400 bg-red-950/60 shadow-[0_0_15px_rgba(248,113,113,0.3)]'
                  : 'border-slate-700 bg-slate-900 hover:border-slate-500'
              }`}
            >
              <div className={`font-black text-lg ${isSelected ? (type === 'bonus' ? 'text-emerald-300' : 'text-red-300') : 'text-white'}`}>
                {isSelected ? '✓ ' : ''}{opt.label}
              </div>
              <div className="text-slate-400 text-sm mt-1">{opt.description}</div>
            </button>
          );
        })}
      </div>

      {/* Submit */}
      <button
        onClick={() => canSubmit && onSubmit(selected)}
        disabled={!canSubmit}
        className={`w-full py-5 rounded-xl font-black text-xl transition-all ${
          canSubmit
            ? type === 'bonus'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-red-700 hover:bg-red-600 text-white'
            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
        }`}
      >
        {submitLabel}
      </button>
    </div>
  );
}
