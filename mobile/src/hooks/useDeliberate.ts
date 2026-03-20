import { useState, useCallback, useRef } from 'react';
import { API_URL } from '../constants';

// ── SSE event shapes (mirror src/server/routes.ts) ──────────────────

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

// ── State ────────────────────────────────────────────────────────────

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

// ── Hook ─────────────────────────────────────────────────────────────

export function useDeliberate() {
  const [state, setState] = useState<DeliberationState>(INITIAL);
  // XMLHttpRequest gives reliable incremental responseText on both iOS and
  // Android (Hermes fetch streaming is inconsistent across RN versions).
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const deliberate = useCallback((question: string) => {
    xhrRef.current?.abort();
    setState({ ...INITIAL, status: 'loading' });

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    let cursor = 0;

    function processChunk(text: string) {
      const lines = text.split('\n');
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

    xhr.onreadystatechange = () => {
      // Guard: bail if this XHR has been superseded by a new request or reset
      if (xhrRef.current !== xhr) return;
      // LOADING (3) fires on each chunk; DONE (4) fires at end
      if (xhr.readyState === 3 || xhr.readyState === 4) {
        const chunk = xhr.responseText.slice(cursor);
        cursor = xhr.responseText.length;
        if (chunk) processChunk(chunk);
      }
    };

    xhr.onerror = () => {
      if (xhrRef.current !== xhr) return;
      setState((s) => ({ ...s, status: 'error', error: 'Network error — is the Decider server running?' }));
    };

    xhr.open('POST', `${API_URL}/deliberate`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ question }));
  }, []);

  const reset = useCallback(() => {
    xhrRef.current?.abort();
    xhrRef.current = null; // ensures stale onreadystatechange guards bail out
    setState(INITIAL);
  }, []);

  return { state, deliberate, reset };
}

// ── Reducer ───────────────────────────────────────────────────────────

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
