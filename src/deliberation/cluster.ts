import Anthropic from '@anthropic-ai/sdk';
import type { PersonaResponse } from './deliberate.js';

// ── Types ──────────────────────────────────────────────────────────────

export interface ThemeCluster {
  /** Short name for the theme, e.g. "Economic concerns" */
  theme: string;
  /** One sentence describing what this theme represents */
  summary: string;
  /** Labels of the personas whose primary view aligns with this theme */
  personas: string[];
}

// ── Implementation ─────────────────────────────────────────────────────

const client = new Anthropic();

/**
 * Group persona responses into 2–5 named theme clusters using a single
 * Claude call. Every persona is assigned to exactly one cluster.
 *
 * Returns an empty array when there are fewer than 2 responses or if the
 * model's output cannot be parsed — callers should treat [] as "no clusters".
 */
export async function clusterThemes(
  question: string,
  responses: PersonaResponse[],
  options: { model?: string; timeoutMs?: number } = {},
): Promise<ThemeCluster[]> {
  if (responses.length < 2) return [];

  const { model = 'claude-opus-4-6', timeoutMs } = options;

  const panel = responses
    .map((r) => `[${r.persona.label}]: ${r.response}`)
    .join('\n\n');

  const message = await client.messages.create(
    {
      model,
      max_tokens: 500,
      system:
        'You are an analyst identifying distinct themes across a panel of perspectives. ' +
        'Return only valid JSON — no markdown fences, no explanation.',
      messages: [
        {
          role: 'user',
          content:
            `Question: "${question}"\n\n` +
            `Responses:\n${panel}\n\n` +
            `Identify 2–5 distinct themes or positions expressed above.\n` +
            `Return JSON in exactly this shape:\n` +
            `{"clusters":[{"theme":"Short name (3–6 words)","summary":"One sentence.","personas":["Label A","Label B"]}]}\n\n` +
            `Rules:\n` +
            `- Every persona label must appear in exactly one cluster.\n` +
            `- Use the exact persona label strings from the input.\n` +
            `- 2 clusters minimum, 5 maximum.`,
        },
      ],
    },
    timeoutMs !== undefined ? { timeout: timeoutMs } : undefined,
  );

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  try {
    const parsed = JSON.parse(text) as { clusters?: ThemeCluster[] };
    return Array.isArray(parsed.clusters) ? parsed.clusters : [];
  } catch {
    // Model returned non-JSON — degrade gracefully
    return [];
  }
}
