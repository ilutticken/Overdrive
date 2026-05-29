import React from 'react';
import type { DifficultyModifier } from '../minigames/types';

interface Props {
  modifier: DifficultyModifier;
  difficultyTier: string;
}

export default function ModifierBadge({ modifier, difficultyTier }: Props) {
  const colors =
    modifier.type === 'time'       ? 'border-red-500/30 bg-black/40 text-white' :
    modifier.type === 'consequence'? 'border-orange-500/30 bg-black/40 text-white' :
                                     'border-cyan-500/30 bg-black/40 text-white';
  return (
    <div className={`mb-6 rounded border px-4 py-2 text-center backdrop-blur ${colors}`}>
      <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
        {difficultyTier.toUpperCase()} MODIFIER
      </div>
      <div className="mt-1 text-sm font-bold">
        {modifier.label} — {modifier.description}
      </div>
    </div>
  );
}
