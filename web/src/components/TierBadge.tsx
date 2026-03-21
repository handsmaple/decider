import type { Tier } from '../hooks/useTier.ts';

interface Props {
  tier: Tier;
  onUpgradeClick: () => void;
}

export function TierBadge({ tier, onUpgradeClick }: Props) {
  if (tier === 'pro') {
    return (
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#a78bfa',
          background: '#1e1730',
          border: '1px solid #4c1d95',
          borderRadius: '4px',
          padding: '2px 7px',
        }}
      >
        Pro
      </span>
    );
  }

  return (
    <button
      onClick={onUpgradeClick}
      style={{
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: '#9ca3af',
        background: 'transparent',
        border: '1px solid #374151',
        borderRadius: '4px',
        padding: '2px 7px',
        cursor: 'pointer',
      }}
    >
      Free · Upgrade
    </button>
  );
}
