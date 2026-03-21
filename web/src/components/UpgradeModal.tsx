import type { Tier } from '../hooks/useTier.ts';

interface Props {
  onUpgrade: (tier: Tier) => void;
  onClose: () => void;
}

const ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '10px 0',
  borderBottom: '1px solid #1f2937',
  fontSize: '14px',
};

const CHECK: React.CSSProperties = { color: '#34d399', fontWeight: 700 };
const CROSS: React.CSSProperties = { color: '#4b5563' };

export function UpgradeModal({ onUpgrade, onClose }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: '12px',
          padding: '28px',
          maxWidth: '420px',
          width: '100%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Upgrade to Pro</h2>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>
          Unlock the full panel, synthesis, and re-roll.
        </p>

        {/* Feature comparison */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '32px', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Free</span>
            <span style={{ color: '#a78bfa' }}>Pro</span>
          </div>

          {[
            { label: 'Panel size',          free: '3 personas', pro: '5 personas' },
            { label: 'AI synthesis',        free: false,        pro: true },
            { label: 'Re-roll panel',       free: false,        pro: true },
          ].map(({ label, free, pro }) => (
            <div key={label} style={ROW_STYLE}>
              <span style={{ color: '#d1d5db' }}>{label}</span>
              <div style={{ display: 'flex', gap: '32px', minWidth: '120px', justifyContent: 'flex-end' }}>
                <span style={typeof free === 'string' ? { color: '#9ca3af', fontSize: '13px' } : free ? CHECK : CROSS}>
                  {typeof free === 'string' ? free : free ? '✓' : '✗'}
                </span>
                <span style={typeof pro === 'string' ? { color: '#a78bfa', fontSize: '13px', fontWeight: 600 } : pro ? CHECK : CROSS}>
                  {typeof pro === 'string' ? pro : pro ? '✓' : '✗'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        {/* TODO: replace onClick with payment provider redirect (e.g. Stripe Checkout) */}
        <button
          onClick={() => { onUpgrade('pro'); onClose(); }}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: '#4F46E5',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '10px',
          }}
        >
          Upgrade to Pro
        </button>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #374151',
            background: 'transparent',
            color: '#6b7280',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
