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

// Loose props type used for the registry lookup.
// Each component's own Props interface is the authoritative contract.
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
};

export { computeSetup } from './computeSetup';
export type { MinigameSetup, MinigameType, DegreeOfSuccess, MinigameCompleteCallback, DifficultyModifier } from './types';

// Display metadata used by HostView and GMView
export const MINIGAME_META: Record<string, { label: string; stat: 'MEAT' | 'MIND' | 'MOXIE'; color: string; hostColor: string }> = {
  overload:     { label: 'OVERLOAD',     stat: 'MIND',  color: 'bg-red-600 hover:bg-red-500',     hostColor: 'text-red-500'    },
  deflect:      { label: 'DEFLECT',      stat: 'MEAT',  color: 'bg-blue-600 hover:bg-blue-500',   hostColor: 'text-blue-500'   },
  bluff:        { label: 'BLUFF',        stat: 'MOXIE', color: 'bg-amber-600 hover:bg-amber-500', hostColor: 'text-amber-500'  },
  slash:        { label: 'SLASH',        stat: 'MEAT',  color: 'bg-rose-700 hover:bg-rose-600',   hostColor: 'text-rose-500'   },
  thread:       { label: 'THREAD',       stat: 'MEAT',  color: 'bg-orange-700 hover:bg-orange-600', hostColor: 'text-orange-500' },
  lock:         { label: 'LOCK ON',      stat: 'MEAT',  color: 'bg-violet-700 hover:bg-violet-600', hostColor: 'text-violet-500' },
  chain:        { label: 'CHAIN',        stat: 'MEAT',  color: 'bg-cyan-700 hover:bg-cyan-600',   hostColor: 'text-cyan-500'   },
  scan:         { label: 'SIGNAL SCAN',  stat: 'MIND',  color: 'bg-green-700 hover:bg-green-600', hostColor: 'text-green-500'  },
  jam:          { label: 'SIGNAL JAM',   stat: 'MIND',  color: 'bg-lime-700 hover:bg-lime-600',   hostColor: 'text-lime-500'   },
  surveillance: { label: 'GHOST',        stat: 'MOXIE', color: 'bg-teal-700 hover:bg-teal-600',   hostColor: 'text-teal-500'   },
};
