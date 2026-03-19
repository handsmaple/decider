import Anthropic from '@anthropic-ai/sdk';
import type { Persona } from '../personas/index.js';
import { selectPanel } from './select.js';
import { buildPersonaPrompt } from './prompt.js';

// ── Constants ──────────────────────────────────────────────────────

export const DEFAULT_MODEL = 'claude-opus-4-6';

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
  /** Successfully completed persona responses */
  responses: PersonaResponse[];
  /** Persona calls that failed (transient errors, rate limits, etc.) */
  failed: Array<{ persona: Persona; error: string }>;
  /**
   * AI-generated synthesis of the panel's responses.
   * Null if fewer than 2 personas succeeded (not enough to synthesize).
   * Null if includeSynthesis is false.
   */
  synthesis: string | null;
  /** Wall-clock duration covering panel selection + all parallel API calls + synthesis, in milliseconds */
  durationMs: number;
}

export interface DeliberationOptions {
  /** Number of personas to include in the panel (default: 5) */
  panelSize?: number;
  /**
   * Max tokens per persona response.
   * Keep low — personas should be concise (default: 256).
   */
  maxTokensPerPersona?: number;
  /** Model to use for persona and synthesis calls (default: claude-opus-4-6) */
  model?: string;
  /** Per-request timeout in milliseconds (default: SDK default of 10 min) */
  timeoutMs?: number;
  /**
   * Override the question-derived seed for panel selection.
   * Pass a different number to re-roll the panel while keeping the same question.
   */
  seed?: number;
  /**
   * Whether to generate a synthesis after all personas respond (default: true).
   * Set to false to skip the extra API call and return raw responses only.
   */
  includeSynthesis?: boolean;
}

// ── Core ───────────────────────────────────────────────────────────

const client = new Anthropic();

/**
 * Ask a panel of AI personas a question in parallel.
 *
 * Each persona is an independent Claude call with a distinct system prompt
 * derived from its dimension profile. All calls run concurrently — total
 * latency equals the slowest single persona, not the sum.
 *
 * Panel selection is deterministic: the same question always produces the
 * same panel. Pass `options.seed` to re-roll the panel.
 *
 * Partial failures are tolerated: if one persona call fails, the others
 * still complete and are returned in `responses`. Failed calls appear in
 * `failed` with their error message.
 *
 * @example
 * ```ts
 * const result = await deliberate('Should cities ban cars from downtown?');
 * console.log(result.synthesis);
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
    maxTokensPerPersona = 256,
    model = DEFAULT_MODEL,
    timeoutMs,
    seed,
    includeSynthesis = true,
  } = options;

  const start = performance.now();
  const panel = selectPanel(question, panelSize, seed);

  // Fan out — all persona calls run in parallel; partial failures are tolerated
  const settled = await Promise.allSettled(
    panel.map((persona) =>
      callPersona(persona, question, maxTokensPerPersona, model, timeoutMs),
    ),
  );

  const responses: PersonaResponse[] = [];
  const failed: Array<{ persona: Persona; error: string }> = [];

  for (let i = 0; i < settled.length; i++) {
    const result = settled[i]!;
    if (result.status === 'fulfilled') {
      responses.push(result.value);
    } else {
      failed.push({
        persona: panel[i]!,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  }

  const synthesis =
    includeSynthesis && responses.length >= 2
      ? await synthesize(question, responses, model, timeoutMs)
      : null;

  return {
    question,
    responses,
    failed,
    synthesis,
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

async function synthesize(
  question: string,
  responses: PersonaResponse[],
  model: string,
  timeoutMs: number | undefined,
): Promise<string | null> {
  const panel = responses
    .map((r) => `[${r.persona.label}]:\n${r.response}`)
    .join('\n\n');

  const message = await client.messages.create(
    {
      model,
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `The question was: "${question}"

Here are ${responses.length} perspectives from different people:

${panel}

In exactly 3 bullet points, synthesize this panel's response:
• Where they agree (or what assumptions they share)
• Where they genuinely split, and the core reason why
• The sharpest tension or trade-off the asker should sit with

Be specific and direct. Reference their actual views. No hedging.`,
        },
      ],
    },
    timeoutMs !== undefined ? { timeout: timeoutMs } : undefined,
  );

  return (
    message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('') || null
  );
}
