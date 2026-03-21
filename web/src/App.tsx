import { useState, type FormEvent } from 'react';
import { useDeliberate } from './hooks/useDeliberate.ts';
import { useTier } from './hooks/useTier.ts';
import { ParliamentBar } from './components/ParliamentBar.tsx';
import { TierBadge } from './components/TierBadge.tsx';
import { UpgradeModal } from './components/UpgradeModal.tsx';

const EXAMPLE_QUESTIONS = [
  'Should cities ban cars from downtown?',
  'Is remote work better for society long-term?',
  'Should voting be mandatory?',
  'Does social media do more harm than good?',
];

export default function App() {
  const [question, setQuestion] = useState('');
  const [activeQuestion, setActiveQuestion] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { state, deliberate, reset } = useDeliberate();
  const { tier, limits, setTier } = useTier();

  const isIdle = state.status === 'idle';
  const isLoading = state.status === 'loading';

  function runQuestion(q: string, overrideSeed?: number) {
    setActiveQuestion(q);
    deliberate(q, {
      panelSize: limits.panelSize,
      includeSynthesis: limits.synthesis,
      seed: overrideSeed,
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    runQuestion(q);
  }

  function handleExample(q: string) {
    setQuestion(q);
    runQuestion(q);
  }

  function handleReroll() {
    if (!limits.reroll) {
      setShowUpgrade(true);
      return;
    }
    runQuestion(activeQuestion, Math.floor(Math.random() * 2 ** 32));
  }

  function handleReset() {
    setActiveQuestion('');
    reset();
  }

  const questionForm = (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a contested question…"
        disabled={isLoading}
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: '6px',
          border: '1px solid #333',
          background: '#1a1a1a',
          color: '#e5e5e5',
          fontSize: '14px',
          outline: 'none',
        }}
      />
      <button
        type="submit"
        disabled={isLoading || !question.trim()}
        style={{
          padding: '10px 20px',
          borderRadius: '6px',
          border: 'none',
          background: isLoading ? '#333' : '#4F46E5',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 600,
          cursor: isLoading ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? 'Asking…' : 'Ask'}
      </button>
      {!isIdle && (
        <button
          type="button"
          onClick={handleReset}
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid #333',
            background: 'transparent',
            color: '#888',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      )}
    </form>
  );

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isIdle ? '56px' : '24px' }}>
        <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>Decider</span>
        <TierBadge tier={tier} onUpgradeClick={() => setShowUpgrade(true)} />
      </div>

      {/* ── Landing hero (idle only) ────────────────────────────────── */}
      {isIdle && (
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '16px' }}>
            Every question deserves<br />more than one voice.
          </h1>
          <p style={{ fontSize: '15px', color: '#888', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto 40px' }}>
            Decider runs your question through a panel of 50&nbsp;distinct personas
            and synthesizes where they agree, where they split, and what's actually at stake.
          </p>

          {/* Example questions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '40px' }}>
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleExample(q)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: '1px solid #2d2d2d',
                  background: '#1a1a1a',
                  color: '#ccc',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {questionForm}

          {/* Tier context under form */}
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#555' }}>
            {tier === 'free'
              ? `Free plan · ${limits.panelSize} personas · no synthesis · `
              : `Pro plan · ${limits.panelSize} personas · synthesis included · `}
            {tier === 'free' && (
              <button
                onClick={() => setShowUpgrade(true)}
                style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '12px', cursor: 'pointer', padding: 0 }}
              >
                Upgrade for more →
              </button>
            )}
          </p>
        </div>
      )}

      {/* ── Active question form (results view) ───────────────────── */}
      {!isIdle && (
        <>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>
            {activeQuestion}
          </div>
          {questionForm}
        </>
      )}

      {/* ── Bias warning ────────────────────────────────────────────── */}
      {state.biasWarning && (
        <div style={{ marginTop: '16px', padding: '12px 14px', background: '#1c1a0e', border: '1px solid #854d0e', borderRadius: '6px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '15px', lineHeight: 1 }}>⚠</span>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fbbf24' }}>Biased question detected</span>
            <span style={{ fontSize: '13px', color: '#a16207' }}> · {state.biasWarning.reason}. Results may lean one way.</span>
          </div>
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────────────── */}
      {state.error && (
        <div style={{ marginTop: '16px', padding: '12px', background: '#2a1010', borderRadius: '6px', color: '#f87171', fontSize: '14px' }}>
          {state.error}
        </div>
      )}

      {/* ── Results ────────────────────────────────────────────────── */}
      {!isIdle && (
        <>
          <ParliamentBar personas={state.personas} />

          {state.personas.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              {state.personas.map((p) => (
                <div
                  key={p.persona}
                  style={{
                    padding: '14px 16px',
                    marginBottom: '10px',
                    background: '#1a1a1a',
                    borderRadius: '8px',
                    borderLeft: '3px solid #4F46E5',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#818CF8', marginBottom: '6px' }}>
                    {p.persona}
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#d4d4d4' }}>{p.response}</div>
                </div>
              ))}
            </div>
          )}

          {/* Synthesis (Pro) or upsell (Free) */}
          {state.synthesis ? (
            <div style={{ marginTop: '24px', padding: '16px', background: '#0f172a', borderRadius: '8px', borderLeft: '3px solid #38BDF8' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#38BDF8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Synthesis
              </div>
              <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>{state.synthesis}</div>
            </div>
          ) : state.status === 'done' && tier === 'free' ? (
            <div style={{ marginTop: '24px', padding: '16px', background: '#111827', borderRadius: '8px', border: '1px dashed #374151', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '10px' }}>
                Upgrade to Pro to unlock the AI synthesis and a 5-persona panel.
              </p>
              <button
                onClick={() => setShowUpgrade(true)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#4F46E5',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Upgrade to Pro
              </button>
            </div>
          ) : null}

          {/* Stats + Re-roll */}
          {state.status === 'done' && state.durationMs !== null && (
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#555' }}>
              <span>
                {state.personas.length} responses · {state.failed.length} failed · {(state.durationMs / 1000).toFixed(1)}s
                {state.fromCache && <span style={{ marginLeft: '6px', color: '#4b5563' }}>· cached</span>}
              </span>
              <button
                onClick={handleReroll}
                style={{
                  background: 'none',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  color: limits.reroll ? '#888' : '#4b5563',
                  fontSize: '12px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title={limits.reroll ? 'Pick a different panel for the same question' : 'Re-roll is a Pro feature'}
              >
                {limits.reroll ? '⟳ Re-roll panel' : '🔒 Re-roll'}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Upgrade modal ──────────────────────────────────────────── */}
      {showUpgrade && (
        <UpgradeModal
          onUpgrade={(t) => setTier(t)}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}
