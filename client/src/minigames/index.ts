import type { ComponentType } from 'react';
import type { MinigameSetup, MinigameCompleteCallback } from './types';

import Overload     from './Overload';
import Deflect      from './Deflect';
import Bluff        from './Bluff';
import Slash        from './Slash';
import Thread       from './Thread';
import Lock         from './Lock';
import Chain        from './Chain';
import Scan         from './Scan';
import Jam          from './Jam';
import Surveillance from './Surveillance';
import Doctor       from './Doctor';

// Loose props type used for the registry lookup.
export type MinigameComponentProps = {
  setup: MinigameSetup;
  onComplete: MinigameCompleteCallback;
  roomCode?: string;
  deviceToken?: string;
};

export const MINIGAME_REGISTRY: Record<string, ComponentType<any>> = {
  overload:     Overload,
  deflect:      Deflect,
  bluff:        Bluff,
  slash:        Slash,
  thread:       Thread,
  lock:         Lock,
  chain:        Chain,
  scan:         Scan,
  jam:          Jam,
  surveillance: Surveillance,
  doctor:       Doctor,
};

export { computeSetup } from './computeSetup';
export type { MinigameSetup, MinigameType, DegreeOfSuccess, MinigameCompleteCallback, DifficultyModifier, GlitchType } from './types';
export { clampDegree, DEGREE_ORDER } from './types';

// ─── Skill system ─────────────────────────────────────────────────────────────

export const SKILL_NAMES = [
  'doctor','hack','rig','study',
  'fight','hustle','pilot','skulk',
  'attune','command','deceive','sway',
] as const;

export type SkillName = typeof SKILL_NAMES[number];

export const ATTRIBUTE_GROUPS: Array<{ label: string; color: string; skills: SkillName[] }> = [
  { label: 'INSIGHT',   color: 'text-cyan-400',    skills: ['doctor','hack','rig','study'] },
  { label: 'TOUGHNESS', color: 'text-red-400',      skills: ['fight','hustle','pilot','skulk'] },
  { label: 'RESOLVE',   color: 'text-emerald-400',  skills: ['attune','command','deceive','sway'] },
];

// ─── Display metadata ─────────────────────────────────────────────────────────

export const MINIGAME_META: Record<string, { label: string; skill: SkillName; color: string; hostColor: string }> = {
  overload:     { label: 'OVERLOAD',     skill: 'rig',         color: 'bg-red-600 hover:bg-red-500',           hostColor: 'text-red-500'    },
  deflect:      { label: 'DEFLECT',      skill: 'fight',       color: 'bg-blue-600 hover:bg-blue-500',         hostColor: 'text-blue-500'   },
  bluff:        { label: 'BLUFF',        skill: 'deceive',     color: 'bg-amber-600 hover:bg-amber-500',       hostColor: 'text-amber-500'  },
  slash:        { label: 'SLASH',        skill: 'fight',       color: 'bg-rose-700 hover:bg-rose-600',         hostColor: 'text-rose-500'   },
  thread:       { label: 'THREAD',       skill: 'pilot',       color: 'bg-orange-700 hover:bg-orange-600',     hostColor: 'text-orange-500' },
  lock:         { label: 'LOCK ON',      skill: 'skulk',       color: 'bg-violet-700 hover:bg-violet-600',     hostColor: 'text-violet-500' },
  chain:        { label: 'CHAIN',        skill: 'fight',       color: 'bg-cyan-700 hover:bg-cyan-600',         hostColor: 'text-cyan-500'   },
  scan:         { label: 'SIGNAL SCAN',  skill: 'study',       color: 'bg-green-700 hover:bg-green-600',       hostColor: 'text-green-500'  },
  jam:          { label: 'SIGNAL JAM',   skill: 'hack',        color: 'bg-lime-700 hover:bg-lime-600',         hostColor: 'text-lime-500'   },
  surveillance: { label: 'GHOST',        skill: 'skulk',       color: 'bg-teal-700 hover:bg-teal-600',         hostColor: 'text-teal-500'   },
  doctor:       { label: 'FIELD MED',    skill: 'doctor',      color: 'bg-emerald-700 hover:bg-emerald-600',   hostColor: 'text-emerald-400' },
};
