import { useState } from 'react';

export type Tier = 'free' | 'pro';

export interface TierLimits {
  panelSize: number;
  synthesis: boolean;
  reroll: boolean;
}

const TIER_CONFIG: Record<Tier, TierLimits> = {
  free: { panelSize: 3, synthesis: false, reroll: false },
  pro:  { panelSize: 5, synthesis: true,  reroll: true  },
};

function readSavedTier(): Tier {
  try {
    const saved = localStorage.getItem('decider_tier');
    return saved === 'pro' ? 'pro' : 'free';
  } catch {
    return 'free';
  }
}

export function useTier() {
  const [tier, setTierState] = useState<Tier>(readSavedTier);

  function setTier(t: Tier) {
    try { localStorage.setItem('decider_tier', t); } catch { /* ignore */ }
    setTierState(t);
  }

  // TODO: In production, derive tier from authenticated session / subscription
  // status rather than localStorage. The localStorage approach is for MVP only
  // and provides no real access control.
  return { tier, limits: TIER_CONFIG[tier], setTier };
}
