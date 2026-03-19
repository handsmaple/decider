import Anthropic from '@anthropic-ai/sdk';
import type { Persona } from '../personas/index.js';
import { selectPanel } from './select.js';
import { buildPersonaPrompt } from './prompt.js';

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
  panelSize: number;
  responses: PersonaResponse[];
  /** Wall-clock time for all parallel calls, in milliseconds */
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
  const { panelSize = 5, maxTokensPerPersona = 512 } = options;

  const panel = selectPanel(question, panelSize);
  const start = Date.now();

  // Fan out — all persona calls run in parallel
  const responses = await Promise.all(
    panel.map((persona) => callPersona(persona, question, maxTokensPerPersona)),
  );

  return {
    question,
    panelSize,
    responses,
    durationMs: Date.now() - start,
  };
}

// ── Internal ───────────────────────────────────────────────────────

async function callPersona(
  persona: Persona,
  question: string,
  maxTokens: number,
): Promise<PersonaResponse> {
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: maxTokens,
    system: buildPersonaPrompt(persona),
    messages: [{ role: 'user', content: question }],
  });

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
