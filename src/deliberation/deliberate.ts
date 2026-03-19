import Anthropic from '@anthropic-ai/sdk';
import type { Persona } from '../personas/index.js';
import { selectPanel } from './select.js';
import { buildPersonaPrompt } from './prompt.js';

// ── Constants ──────────────────────────────────────────────────────

const DEFAULT_MODEL = 'claude-opus-4-6';

// ── Types ──────────────────────────────────────────────────────────

export interface PersonaResponse {
  persona: Persona;
  response: string;
  /** Input tokens used for this persona's call */
  inputTokens: number;
  /** Output tokens used for this persona's call */
  outputTokens: number;
}

export interface DeliberationResult {
  question: string;
  responses: PersonaResponse[];
  /** Wall-clock duration covering panel selection + all parallel API calls, in milliseconds */
  durationMs: number;
}

export interface DeliberationOptions {
  /** Number of personas to include in the panel (default: 5) */
  panelSize?: number;
  /**
   * Max tokens per persona response.
   * Keep this low — each persona should be concise (default: 512).
   */
  maxTokensPerPersona?: number;
  /** Model to use for all persona calls (default: claude-opus-4-6) */
  model?: string;
  /** Per-request timeout in milliseconds (default: SDK default of 10 min) */
  timeoutMs?: number;
}

// ── Core ───────────────────────────────────────────────────────────

const client = new Anthropic();

/**
 * Ask a panel of AI personas a question in parallel.
 *
 * Each persona is an independent Claude call with a distinct system prompt
 * derived from its dimension profile. All calls run concurrently via
 * Promise.all — total latency equals the slowest single persona, not the sum.
 *
 * The panel selection is deterministic: the same question always produces
 * the same panel (seeded by question hash).
 *
 * @example
 * ```ts
 * const result = await deliberate('Should cities ban cars from downtown?');
 * for (const r of result.responses) {
 *   console.log(`[${r.persona.label}]: ${r.response}`);
 * }
 * ```
 */
export async function deliberate(
  question: string,
  options: DeliberationOptions = {},
): Promise<DeliberationResult> {
  const {
    panelSize = 5,
    maxTokensPerPersona = 512,
    model = DEFAULT_MODEL,
    timeoutMs,
  } = options;

  const start = performance.now();
  const panel = selectPanel(question, panelSize);

  // Fan out — all persona calls run in parallel
  const responses = await Promise.all(
    panel.map((persona) =>
      callPersona(persona, question, maxTokensPerPersona, model, timeoutMs),
    ),
  );

  return {
    question,
    responses,
    durationMs: Math.round(performance.now() - start),
  };
}

// ── Internal ───────────────────────────────────────────────────────

async function callPersona(
  persona: Persona,
  question: string,
  maxTokens: number,
  model: string,
  timeoutMs: number | undefined,
): Promise<PersonaResponse> {
  const message = await client.messages.create(
    {
      model,
      max_tokens: maxTokens,
      system: buildPersonaPrompt(persona),
      messages: [{ role: 'user', content: question }],
    },
    timeoutMs !== undefined ? { timeout: timeoutMs } : undefined,
  );

  const response = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  return {
    persona,
    response,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}
