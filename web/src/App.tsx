import { useState, type FormEvent } from 'react';
import { useDeliberate } from './hooks/useDeliberate.ts';
import { ParliamentBar } from './components/ParliamentBar.tsx';

export default function App() {
  const [question, setQuestion] = useState('');
  const { state, deliberate, reset } = useDeliberate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    deliberate(q);
  }

  const isLoading = state.status === 'loading';

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Decider</h1>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '32px' }}>
        Ask a question. A diverse panel of AI personas deliberates.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Should cities ban cars from downtown?"
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
        {state.status !== 'idle' && (
          <button
            type="button"
            onClick={reset}
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

      {state.error && (
        <div style={{ marginTop: '16px', padding: '12px', background: '#2a1010', borderRadius: '6px', color: '#f87171', fontSize: '14px' }}>
          {state.error}
        </div>
      )}

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

      {state.synthesis && (
        <div style={{ marginTop: '24px', padding: '16px', background: '#0f172a', borderRadius: '8px', borderLeft: '3px solid #38BDF8' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#38BDF8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Synthesis
          </div>
          <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>{state.synthesis}</div>
        </div>
      )}

      {state.status === 'done' && state.durationMs !== null && (
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#555', textAlign: 'right' }}>
          {state.personas.length} responses · {state.failed.length} failed · {(state.durationMs / 1000).toFixed(1)}s
        </div>
      )}
    </div>
  );
}
