import { useState, useCallback, useRef } from 'react';

// ── SSE event shapes (mirror src/server/routes.ts) ─────────────────

export interface PersonaDimensions {
  age: string;
  geography: string;
  worldview: string;
  interests: string[];
  job: string;
  education: string;
}

export interface PersonaEvent {
  type: 'persona';
  persona: string;
  dimensions: PersonaDimensions;
  response: string;
  inputTokens: number;
  outputTokens: number;
}

export interface FailedEvent {
  type: 'failed';
  persona: string;
  error: string;
}

export interface SynthesisEvent {
  type: 'synthesis';
  text: string;
}

export interface DoneEvent {
  type: 'done';
  durationMs: number;
  totalResponses: number;
  totalFailed: number;
}

export interface ErrorEvent {
  type: 'error';
  message: string;
}

type SseEvent = PersonaEvent | FailedEvent | SynthesisEvent | DoneEvent | ErrorEvent;

// ── State ───────────────────────────────────────────────────────────

export type DeliberationStatus = 'idle' | 'loading' | 'done' | 'error';

export interface DeliberationState {
  status: DeliberationStatus;
  personas: PersonaEvent[];
  failed: FailedEvent[];
  synthesis: string | null;
  durationMs: number | null;
  error: string | null;
}

const INITIAL: DeliberationState = {
  status: 'idle',
  personas: [],
  failed: [],
  synthesis: null,
  durationMs: null,
  error: null,
};

// ── Call options (subset of server-side DeliberationOptions) ────────

export interface DeliberateCallOptions {
  panelSize?: number;
  seed?: number;
  includeSynthesis?: boolean;
}

// ── Hook ────────────────────────────────────────────────────────────

export function useDeliberate() {
  const [state, setState] = useState<DeliberationState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  const deliberate = useCallback((question: string, options?: DeliberateCallOptions) => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ ...INITIAL, status: 'loading' });

    (async () => {
      try {
        const res = await fetch('/deliberate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, options }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const text = await res.text();
          setState((s) => ({ ...s, status: 'error', error: text || `HTTP ${res.status}` }));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            let event: SseEvent;
            try {
              event = JSON.parse(raw) as SseEvent;
            } catch {
              continue;
            }

            setState((s) => applyEvent(s, event));
          }
        }
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return;
        setState((s) => ({
          ...s,
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
        }));
      }
    })();
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL);
  }, []);

  return { state, deliberate, reset };
}

// ── Reducer ─────────────────────────────────────────────────────────

function applyEvent(s: DeliberationState, event: SseEvent): DeliberationState {
  switch (event.type) {
    case 'persona':
      return { ...s, personas: [...s.personas, event] };
    case 'failed':
      return { ...s, failed: [...s.failed, event] };
    case 'synthesis':
      return { ...s, synthesis: event.text };
    case 'done':
      return { ...s, status: 'done', durationMs: event.durationMs };
    case 'error':
      return { ...s, status: 'error', error: event.message };
    default:
      return s;
  }
}
