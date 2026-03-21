import Anthropic from '@anthropic-ai/sdk';
import { DEFAULT_MODEL } from './deliberate.js';

// ── Types ──────────────────────────────────────────────────────────

export type SanitizeResult =
  | { biased: false }
  | { biased: true; reason: string; score: number };

// ── Heuristic ──────────────────────────────────────────────────────

/**
 * Strong leading-question patterns — any single match is enough to flag
 * the question as biased without invoking Claude.
 */
const LEADING_PATTERNS: RegExp[] = [
  // Rhetorical affirmations at the start
  /^(isn'?t it obvious|don'?t you think|wouldn'?t you agree|surely |obviously |clearly,? |of course,? )/i,
  // Embedded-agreement phrases mid-sentence
  /\b(isn'?t it obvious that|don'?t you agree that|wouldn'?t you say that)\b/i,
  // Assumed-consensus openers
  /^everyone knows\b/i,
  /^it'?s obvious that\b/i,
  // Presuppositional "why is X so bad" construction
  /why (is|are) .{0,60} so (bad|terrible|awful|horrible|corrupt|broken|wrong|evil|stupid|dumb)\b/i,
  // Tribal targeting
  /why do (people|liberals|conservatives|politicians|the left|the right) always\b/i,
];

/**
 * Loaded / charged vocabulary. Each pattern covers a semantic cluster.
 * One hit → borderline; two or more hits → biased.
 */
const LOADED_CLUSTERS: RegExp[] = [
  /\b(terrible|disgusting|outrageous|horrifying|appalling|abhorrent)\b/i,
  /\b(evil|corrupt|fascist|marxist|communist|racist|sexist|toxic|bigot)\b/i,
  /\b(destroy|ruin|catastrophic|devastating|disastrous|obliterate)\b/i,
  /\b(idiotic|moronic|insane|absurd|ridiculous|ludicrous|delusional)\b/i,
  /\b(greatest ever|worst ever|best ever|most (amazing|terrible) (thing|person|idea))\b/i,
];

export type HeuristicVerdict = 'pass' | 'borderline' | 'biased';

export interface HeuristicResult {
  verdict: HeuristicVerdict;
  /** Human-readable explanation, present when verdict is 'biased'. */
  reason?: string;
}

/**
 * Fast, synchronous bias check — no API call.
 *
 * Returns:
 *   'pass'       — no indicators found; safe to proceed
 *   'borderline' — one loaded-language cluster hit; worth a second look
 *   'biased'     — strong leading pattern or multiple loaded clusters found
 */
export function runHeuristic(question: string): HeuristicResult {
  // Strong leading patterns take priority
  for (const pattern of LEADING_PATTERNS) {
    if (pattern.test(question)) {
      return { verdict: 'biased', reason: 'Leading question pattern detected' };
    }
  }

  // Count how many loaded-word clusters are present
  const hitCount = LOADED_CLUSTERS.filter((p) => p.test(question)).length;

  if (hitCount >= 2) {
    return { verdict: 'biased', reason: 'Multiple loaded or charged terms detected' };
  }
  if (hitCount === 1) {
    return { verdict: 'borderline' };
  }

  return { verdict: 'pass' };
}

// ── Claude fallback ────────────────────────────────────────────────

const SANITIZE_SYSTEM =
  'You are a question neutrality evaluator. Your only job is to rate whether a question is leading or biased.';

function buildSanitizePrompt(question: string): string {
  return (
    `Rate the neutrality of this question on a scale of 0–10, where 0 = perfectly neutral ` +
    `and 10 = maximally leading or biased. Consider: loaded language, presuppositions, ` +
    `false dichotomies, and rhetorical framing.\n\n` +
    `Respond with ONLY valid JSON, no other text:\n` +
    `{"score": <number 0-10>, "reason": "<one concise sentence>"}\n\n` +
    `Question: "${question}"`
  );
}

/**
 * Evaluate whether a question is leading or biased.
 *
 * Strategy:
 *   1. Fast heuristic (sync, no API call) — catches obvious cases.
 *   2. If borderline, a lightweight Claude call scores neutrality (0–10).
 *      Score ≥ 6 is treated as biased.
 *
 * On Claude call failure, the function fails open — the question is not blocked.
 * This matches the library's tolerance for partial failures elsewhere.
 */
export async function sanitizeQuestion(question: string): Promise<SanitizeResult> {
  const { verdict, reason } = runHeuristic(question);

  if (verdict === 'pass') return { biased: false };

  if (verdict === 'biased') {
    return { biased: true, reason: reason!, score: 0.9 };
  }

  // Borderline — call Claude for a definitive score
  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 64,
      system: SANITIZE_SYSTEM,
      messages: [{ role: 'user', content: buildSanitizePrompt(question) }],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const parsed = JSON.parse(text) as { score: number; reason: string };
    const score = Number(parsed.score);

    if (score >= 6) {
      return { biased: true, reason: String(parsed.reason), score: score / 10 };
    }
    return { biased: false };
  } catch {
    // Fail open — don't block the question if the Claude call errors
    return { biased: false };
  }
}
