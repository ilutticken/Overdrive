import type {
  MinigameSetup, MinigameType, DifficultyModifier,
  DegreeOfSuccess, DoctorStep,
} from './types';

// Character shape — transitional. When the skill system replaces stats,
// this interface becomes { skills: Record<SkillName, number> } and only
// this file needs to change.
export interface CharacterStats {
  meat:  number;
  mind:  number;
  moxie: number;
}

// ─── Pip-level degree bounds ──────────────────────────────────────────────────
// Stub: returns full range until the skill system supplies real pip ratings.
// When skills land, pass the relevant pip count here and derive bounds from it.
function degreeBounds(pipRating: number): { degreeCeiling: DegreeOfSuccess; degreeFloor: DegreeOfSuccess } {
  return {
    degreeCeiling: pipRating === 0 ? 'success'   : 'critical_success',
    degreeFloor:   pipRating >= 3  ? 'failure'   : 'critical_failure',
  };
}

// Placeholder until the skill system is wired: all characters treated as 1 pip.
const DEFAULT_BOUNDS = degreeBounds(1);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statDuration(stat: number, high: number, mid: number, low: number): number {
  if (stat >= 4) return high;
  if (stat >= 2) return mid;
  return low;
}

function applyTimeMod(duration: number, modifier: DifficultyModifier | null): number {
  if (modifier?.type === 'time' && typeof modifier.durationMultiplier === 'number') {
    return Math.max(1000, Math.floor(duration * modifier.durationMultiplier));
  }
  return duration;
}

function randHex4(): string {
  return Math.random().toString(16).substr(2, 4).toUpperCase();
}

// ─── Doctor wound definitions ─────────────────────────────────────────────────

const WOUND_STEPS: Record<'laceration' | 'fracture' | 'trauma', DoctorStep[]> = {
  laceration: [
    { type: 'pressure',  label: 'PACK WOUND'  },
    { type: 'direction', label: 'DISINFECT',   direction: 'L' },
    { type: 'align',     label: 'BANDAGE'     },
  ],
  fracture: [
    { type: 'align',     label: 'ALIGN BONE'  },
    { type: 'pressure',  label: 'BRACE'       },
    { type: 'direction', label: 'SPLINT',      direction: 'U' },
  ],
  trauma: [
    { type: 'align',     label: 'ASSESS'      },
    { type: 'pressure',  label: 'STABILIZE'   },
    { type: 'direction', label: 'ADMINISTER',  direction: 'D' },
  ],
};

// ─── Main entry point ─────────────────────────────────────────────────────────

export function computeSetup(
  type: MinigameType,
  character: CharacterStats | null,
  modifier: DifficultyModifier | null,
  difficultyTier: string
): MinigameSetup {
  const c    = character ?? { meat: 1, mind: 1, moxie: 1 };
  const base = { modifier, difficultyTier, ...DEFAULT_BOUNDS };

  switch (type) {
    case 'overload': {
      const raw = statDuration(c.mind, 5500, 4000, 3000);
      return { type, ...base, duration: applyTimeMod(raw, modifier), targetTaps: 15 };
    }

    case 'deflect': {
      const raw = statDuration(c.meat, 5000, 3500, 2000);
      return {
        type, ...base,
        duration:       applyTimeMod(raw, modifier),
        criticalWindow: [37, 43],
        successWindow:  [34, 46],
        mixedWindow:    [30, 50],
      };
    }

    case 'bluff': {
      const modLabel = modifier?.label;
      const mul = modLabel === 'LOCKED ON' ? 0.55 : modLabel === 'STEADY HAND' ? 1.6 : 1;
      const successWindow  = Math.max(8,  Math.min(28, 15 * mul));
      const criticalWindow = Math.max(4,  Math.min(16,  7 * mul));
      const half = successWindow / 2;
      const targetCenter = Math.max(half, Math.min(100 - half, Math.random() * (100 - successWindow) + half));
      return { type, ...base, duration: applyTimeMod(3000, modifier), targetCenter, successWindow, criticalWindow };
    }

    case 'slash': {
      const raw = statDuration(c.meat, 5000, 4000, 3000);
      return {
        type, ...base,
        duration:    applyTimeMod(raw, modifier),
        targetAngle: Math.floor(Math.random() * 360),
        tolerances:  { critical: 12, success: 25, mixed: 40 },
      };
    }

    case 'thread': {
      const raw = statDuration(c.meat, 5000, 4500, 4000);
      const gates = Array.from({ length: 4 }, () => ({
        side: (Math.random() < 0.5 ? 'L' : 'R') as 'L' | 'R',
      }));
      return { type, ...base, duration: applyTimeMod(raw, modifier), gates };
    }

    case 'lock': {
      const raw = c.meat >= 4 ? 5000 : 4000;
      return { type, ...base, duration: applyTimeMod(raw, modifier), hitRadius: 12 };
    }

    case 'chain': {
      const raw = statDuration(c.meat, 6000, 5000, 4000);
      const sequence = Array.from({ length: 8 }, () =>
        (Math.random() < 0.5 ? 'L' : 'R')
      ) as Array<'L' | 'R'>;
      return { type, ...base, duration: applyTimeMod(raw, modifier), sequence };
    }

    case 'scan': {
      const raw = statDuration(c.mind, 6000, 5000, 4000);
      const target = randHex4();
      const codes: string[] = [target];
      while (codes.length < 8) {
        const c2 = randHex4();
        if (!codes.includes(c2)) codes.push(c2);
      }
      codes.sort(() => Math.random() - 0.5);
      return { type, ...base, duration: applyTimeMod(raw, modifier), codes, target, baseInterval: 900, minInterval: 280 };
    }

    case 'jam': {
      const raw = c.mind >= 4 ? 5000 : 4000;
      return { type, ...base, duration: applyTimeMod(raw, modifier), hitZoneWidth: 8 };
    }

    case 'surveillance': {
      const raw = statDuration(c.moxie, 5000, 4000, 3000);
      const center = 20 + Math.random() * 60;
      return { type, ...base, duration: applyTimeMod(raw, modifier), blindSpot: { center, width: 14 } };
    }

    case 'doctor': {
      // stepDuration will be driven by Doctor pip rating when skill system lands.
      const stepDuration = 3500;
      const woundTypes = ['laceration', 'fracture', 'trauma'] as const;
      const woundType  = woundTypes[Math.floor(Math.random() * woundTypes.length)];
      const steps      = WOUND_STEPS[woundType];
      return {
        type, ...base,
        duration: applyTimeMod(stepDuration * steps.length, modifier),
        woundType,
        steps,
        stepDuration,
      };
    }
  }
}
