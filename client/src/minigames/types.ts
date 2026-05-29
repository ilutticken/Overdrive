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

// Ordered from worst to best — used for clamping.
export const DEGREE_ORDER: DegreeOfSuccess[] = [
  'critical_failure',
  'failure',
  'mixed_success',
  'success',
  'critical_success',
];

// Clamp a degree to the achievable range for this setup.
// At 0 pips the ceiling is 'success' (no critical success possible).
// At 3 pips the floor is 'failure' (no critical failure possible).
// This is called inside each mini-game component so the outcome is
// parameter-baked, not post-processed.
export function clampDegree(
  degree: DegreeOfSuccess,
  floor: DegreeOfSuccess,
  ceiling: DegreeOfSuccess
): DegreeOfSuccess {
  const idx     = DEGREE_ORDER.indexOf(degree);
  const floorIdx   = DEGREE_ORDER.indexOf(floor);
  const ceilingIdx = DEGREE_ORDER.indexOf(ceiling);
  return DEGREE_ORDER[Math.max(floorIdx, Math.min(ceilingIdx, idx))];
}

// ─── Glitch system ───────────────────────────────────────────────────────────
// Glitches are per-scene conditions that distort mini-game UI and inputs.
// Multiple Glitches stack — each fires independently at random moments,
// so three active Glitches create three distinct disruptions per mini-game.

export type GlitchType =
  | 'static_burst'   // brief scanline flash over UI
  | 'mirror'         // controls/display flip horizontal briefly
  | 'screen_tear'    // horizontal visual tear mid-display
  | 'noise'          // persistent low-level static overlay
  | 'clock_drift'    // timer display jumps ±value briefly
  | 'signal_bleed'   // ghost/shadow of target zone appears offset
  | 'frame_drop'     // UI freezes for ~150ms
  | 'zone_shift'     // target zone jumps position briefly
  | 'input_lag'      // pointer registration delayed ~200ms
  | 'blackout';      // partial UI blackout region

// ─── Base ────────────────────────────────────────────────────────────────────

export interface BaseSetup {
  duration: number;
  modifier: DifficultyModifier | null;
  difficultyTier: string;
  // Degree bounds — populated by computeSetup based on pip rating.
  // Defaults to the full range. Each mini-game component reads these
  // and removes the corresponding zones from its UI.
  degreeCeiling: DegreeOfSuccess;
  degreeFloor:   DegreeOfSuccess;
}

// ─── Per-game setups ─────────────────────────────────────────────────────────

export interface OverloadSetup extends BaseSetup {
  targetTaps: number;
}

export interface DeflectSetup extends BaseSetup {
  criticalWindow: [number, number];
  successWindow:  [number, number];
  mixedWindow:    [number, number];
}

export interface BluffSetup extends BaseSetup {
  targetCenter:   number;
  successWindow:  number;
  criticalWindow: number;
}

export interface SlashSetup extends BaseSetup {
  targetAngle: number;
  tolerances: { critical: number; success: number; mixed: number };
}

export interface ThreadSetup extends BaseSetup {
  gates: Array<{ side: 'L' | 'R' }>;
}

export interface LockSetup extends BaseSetup {
  hitRadius: number;
}

export interface ChainSetup extends BaseSetup {
  sequence: Array<'L' | 'R'>;
}

export interface ScanSetup extends BaseSetup {
  codes:        string[];
  target:       string;
  baseInterval: number;
  minInterval:  number;
}

export interface JamSetup extends BaseSetup {
  hitZoneWidth: number;
}

export interface SurveillanceSetup extends BaseSetup {
  blindSpot: { center: number; width: number };
}

// Step types for the Doctor mini-game.
// 'pressure' = sustained hold; 'align' = timing tap; 'direction' = swipe.
export type DoctorStepType = 'pressure' | 'align' | 'direction';

export interface DoctorStep {
  type:      DoctorStepType;
  label:     string;     // e.g. "PACK WOUND", "ALIGN BONE", "BANDAGE"
  direction?: 'U' | 'D' | 'L' | 'R'; // only for 'direction' steps
}

export interface DoctorSetup extends BaseSetup {
  woundType:    'laceration' | 'fracture' | 'trauma';
  steps:        DoctorStep[];
  stepDuration: number; // ms per step
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
  | ({ type: 'surveillance' } & SurveillanceSetup)
  | ({ type: 'doctor'       } & DoctorSetup);

export type MinigameType = MinigameSetup['type'];
