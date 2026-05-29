import type {
  MinigameSetup, MinigameType, DifficultyModifier,
  DegreeOfSuccess, DoctorStep,
} from './types';

// ─── Pip-based timer and degree bounds ───────────────────────────────────────

function pipDuration(base: number, pips: number): number {
  if (pips <= 0) return Math.floor(base * 0.75);   // complication: −25%
  if (pips === 1) return base;                       // baseline
  if (pips === 2) return Math.floor(base * 1.25);   // advantage: +25%
  return Math.floor(base * 1.5);                    // 2 advantages: +50%
}

function degreeBounds(pips: number): { degreeCeiling: DegreeOfSuccess; degreeFloor: DegreeOfSuccess } {
  return {
    degreeCeiling: pips === 0 ? 'success'  : 'critical_success'  as DegreeOfSuccess,
    degreeFloor:   pips >= 3  ? 'failure'  : 'critical_failure'  as DegreeOfSuccess,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  pipRating: number,
  modifier: DifficultyModifier | null,
  difficultyTier: string
): MinigameSetup {
  const pips = Math.max(0, Math.min(3, pipRating ?? 1));
  const base  = { modifier, difficultyTier, ...degreeBounds(pips) };

  switch (type) {
    case 'overload': {
      const raw = pipDuration(4000, pips);
      return { type, ...base, duration: applyTimeMod(raw, modifier), targetTaps: 15 };
    }

    case 'deflect': {
      const raw = pipDuration(3500, pips);
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
      return { type, ...base, duration: applyTimeMod(pipDuration(3000, pips), modifier), targetCenter, successWindow, criticalWindow };
    }

    case 'slash': {
      const raw = pipDuration(4000, pips);
      return {
        type, ...base,
        duration:    applyTimeMod(raw, modifier),
        targetAngle: Math.floor(Math.random() * 360),
        tolerances:  { critical: 12, success: 25, mixed: 40 },
      };
    }

    case 'thread': {
      const raw = pipDuration(4500, pips);
      const gates = Array.from({ length: 4 }, () => ({
        side: (Math.random() < 0.5 ? 'L' : 'R') as 'L' | 'R',
      }));
      return { type, ...base, duration: applyTimeMod(raw, modifier), gates };
    }

    case 'lock': {
      return { type, ...base, duration: applyTimeMod(pipDuration(4000, pips), modifier), hitRadius: 12 };
    }

    case 'chain': {
      const raw = pipDuration(5000, pips);
      const sequence = Array.from({ length: 8 }, () =>
        (Math.random() < 0.5 ? 'L' : 'R')
      ) as Array<'L' | 'R'>;
      return { type, ...base, duration: applyTimeMod(raw, modifier), sequence };
    }

    case 'scan': {
      const raw = pipDuration(5000, pips);
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
      return { type, ...base, duration: applyTimeMod(pipDuration(4000, pips), modifier), hitZoneWidth: 8 };
    }

    case 'surveillance': {
      const raw = pipDuration(4000, pips);
      const center = 20 + Math.random() * 60;
      return { type, ...base, duration: applyTimeMod(raw, modifier), blindSpot: { center, width: 14 } };
    }

    case 'doctor': {
      const stepDuration = pipDuration(3500, pips);
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
