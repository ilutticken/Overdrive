export type DegreeOfSuccess =
  | 'critical_success'
  | 'success'
  | 'mixed_success'
  | 'failure'
  | 'critical_failure';

export type MinigameCompleteCallback = (degree: DegreeOfSuccess) => void;

export interface DifficultyModifier {
  type: 'time' | 'consequence' | 'target';
  label: string;
  description: string;
  durationMultiplier?: number;
  failurePenalty?: number;
}

// ─── Base ────────────────────────────────────────────────────────────────────

interface BaseSetup {
  duration: number;
  modifier: DifficultyModifier | null;
  difficultyTier: string;
}

// ─── Per-game setups ─────────────────────────────────────────────────────────
// Every named field here is a potential perk hook.
// Currently populated from stats in computeSetup.ts.
// When perks replace stats, only that file changes.

export interface OverloadSetup extends BaseSetup {
  targetTaps: number;         // taps required for success band
}

export interface DeflectSetup extends BaseSetup {
  criticalWindow: [number, number];  // [min%, max%] scale for critical hit
  successWindow:  [number, number];
  mixedWindow:    [number, number];
}

export interface BluffSetup extends BaseSetup {
  targetCenter:   number;  // 0–100
  successWindow:  number;  // width in % units
  criticalWindow: number;
}

export interface SlashSetup extends BaseSetup {
  targetAngle: number;  // degrees 0–359
  tolerances: {
    critical: number;  // max angle diff for critical
    success:  number;
    mixed:    number;
  };
}

export interface ThreadSetup extends BaseSetup {
  gates: Array<{ side: 'L' | 'R' }>;  // blocked side per gate
}

export interface LockSetup extends BaseSetup {
  hitRadius: number;  // % of container counted as "on target"
}

export interface ChainSetup extends BaseSetup {
  sequence: Array<'L' | 'R'>;
}

export interface ScanSetup extends BaseSetup {
  codes:        string[];
  target:       string;
  baseInterval: number;  // ms between code changes
  minInterval:  number;  // floor after acceleration
}

export interface JamSetup extends BaseSetup {
  hitZoneWidth: number;  // % of bar width counted as "locked"
}

export interface SurveillanceSetup extends BaseSetup {
  blindSpot: { center: number; width: number };  // % positions
}

// ─── Discriminated union ─────────────────────────────────────────────────────

export type MinigameSetup =
  | ({ type: 'overload'     } & OverloadSetup)
  | ({ type: 'deflect'      } & DeflectSetup)
  | ({ type: 'bluff'        } & BluffSetup)
  | ({ type: 'slash'        } & SlashSetup)
  | ({ type: 'thread'       } & ThreadSetup)
  | ({ type: 'lock'         } & LockSetup)
  | ({ type: 'chain'        } & ChainSetup)
  | ({ type: 'scan'         } & ScanSetup)
  | ({ type: 'jam'          } & JamSetup)
  | ({ type: 'surveillance' } & SurveillanceSetup);

export type MinigameType = MinigameSetup['type'];
