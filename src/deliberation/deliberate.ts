import Anthropic from '@anthropic-ai/sdk';
import type { Persona } from '../personas/index.js';
import { selectPanel } from './select.js';
import { buildPersonaPrompt } from './prompt.js';
import { clusterThemes } from './cluster.js';
export type { ThemeCluster } from './cluster.js';

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

export interface FailedPersona {
  persona: Persona;
  error: string;
}

export interface DeliberationResult {
  question: string;
  /** Successfully completed persona responses */
  responses: PersonaResponse[];
  /** Persona calls that failed (transient errors, rate limits, etc.) */
  failed: FailedPersona[];
  /**
   * AI-generated synthesis of the panel's responses.
   * Null if fewer than 2 personas succeeded (not enough to synthesize).
   * Null if includeSynthesis is false.
   */
  synthesis: string | null;
  /**
   * Theme clusters grouping personas by their primary position.
   * Undefined unless includeThemeClusters is true.
   */
  clusters?: import('./cluster.js').ThemeCluster[];
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
  /**
   * Max tokens for the synthesis response (default: 300).
   * Increase if the 3-bullet synthesis is getting cut off; decrease to save cost.
   */
  maxTokensSynthesis?: number;
  /**
   * Whether to group persona responses into named theme clusters (default: false).
   * Adds one extra API call after synthesis. Result is available in `clusters`.
   */
  includeThemeClusters?: boolean;
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
    maxTokensSynthesis = 300,
    model = DEFAULT_MODEL,
    timeoutMs,
    seed,
    includeSynthesis = true,
    includeThemeClusters = false,
  } = options;

  const start = performance.now();
  const panel = selectPanel(question, panelSize, seed);
  const cfg: ApiCallConfig = { model, timeoutMs };

  // Fan out — all persona calls run in parallel; partial failures are tolerated
  const settled = await Promise.allSettled(
    panel.map((persona) => callPersona(persona, question, maxTokensPerPersona, cfg)),
  );

  const responses: PersonaResponse[] = [];
  const failed: FailedPersona[] = [];

  for (const [i, result] of settled.entries()) {
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
      ? await synthesize(question, responses, maxTokensSynthesis, cfg)
      : null;

  const clusters = includeThemeClusters && responses.length >= 2
    ? await clusterThemes(question, responses, { model, timeoutMs }).catch(() => [])
    : undefined;

  return {
    question,
    responses,
    failed,
    synthesis,
    clusters,
    durationMs: Math.round(performance.now() - start),
  };
}

// ── Streaming variant ──────────────────────────────────────────────

export interface StreamCallbacks {
  onPersona?: (result: PersonaResponse) => void;
  onFailed?: (result: FailedPersona) => void;
}

/**
 * Like `deliberate()`, but calls `callbacks.onPersona` / `callbacks.onFailed`
 * as each persona settles rather than waiting for all to finish first.
 * Returns the same `DeliberationResult` shape when everything is done.
 */
export async function deliberateStream(
  question: string,
  callbacks: StreamCallbacks,
  options: DeliberationOptions = {},
): Promise<DeliberationResult> {
  const {
    panelSize = 5,
    maxTokensPerPersona = 256,
    maxTokensSynthesis = 300,
    model = DEFAULT_MODEL,
    timeoutMs,
    seed,
    includeSynthesis = true,
    includeThemeClusters = false,
  } = options;

  const start = performance.now();
  const panel = selectPanel(question, panelSize, seed);
  const cfg: ApiCallConfig = { model, timeoutMs };

  // Attach callbacks to each promise so results stream out as they settle
  const promises = panel.map((persona) =>
    callPersona(persona, question, maxTokensPerPersona, cfg)
      .then((result) => {
        callbacks.onPersona?.(result);
        return result;
      })
      .catch((err: unknown) => {
        const failed: FailedPersona = {
          persona,
          error: err instanceof Error ? err.message : String(err),
        };
        callbacks.onFailed?.(failed);
        throw err;
      }),
  );

  const settled = await Promise.allSettled(promises);

  const responses: PersonaResponse[] = [];
  const failed: FailedPersona[] = [];

  // Callbacks already fired per-persona above; here we just collect for the return value
  for (const [i, result] of settled.entries()) {
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
      ? await synthesize(question, responses, maxTokensSynthesis, cfg)
      : null;

  const clusters = includeThemeClusters && responses.length >= 2
    ? await clusterThemes(question, responses, { model, timeoutMs }).catch(() => [])
    : undefined;

  return {
    question,
    responses,
    failed,
    synthesis,
    clusters,
    durationMs: Math.round(performance.now() - start),
  };
}

// ── Internal ───────────────────────────────────────────────────────

interface ApiCallConfig {
  model: string;
  timeoutMs: number | undefined;
}

function requestOptions(timeoutMs: number | undefined): { timeout: number } | undefined {
  return timeoutMs !== undefined ? { timeout: timeoutMs } : undefined;
}

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

async function callPersona(
  persona: Persona,
  question: string,
  maxTokens: number,
  { model, timeoutMs }: ApiCallConfig,
): Promise<PersonaResponse> {
  const message = await client.messages.create(
    {
      model,
      max_tokens: maxTokens,
      system: buildPersonaPrompt(persona),
      messages: [{ role: 'user', content: question }],
    },
    requestOptions(timeoutMs),
  );

  return {
    persona,
    response: extractText(message.content),
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}

async function synthesize(
  question: string,
  responses: PersonaResponse[],
  maxTokens: number,
  { model, timeoutMs }: ApiCallConfig,
): Promise<string | null> {
  const panel = responses
    .map((r) => `[${r.persona.label}]:\n${r.response}`)
    .join('\n\n');

  const message = await client.messages.create(
    {
      model,
      max_tokens: maxTokens,
      system:
        'You are a neutral analyst synthesizing a diverse panel of perspectives. Be specific, direct, and reference the actual views expressed. No hedging.',
      messages: [
        {
          role: 'user',
          content: `The question was: "${question}"

Here are ${responses.length} perspectives from different people:

${panel}

In exactly 3 bullet points, synthesize this panel's response:
• Where they agree (or what assumptions they share)
• Where they genuinely split, and the core reason why
• The sharpest tension or trade-off the asker should sit with`,
        },
      ],
    },
    requestOptions(timeoutMs),
  );

  return extractText(message.content) || null;
}
