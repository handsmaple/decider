import { PERSONAS, type Persona } from '../personas/index.js';

/**
 * Deterministic pseudo-random number generator (mulberry32).
 * Same seed always produces the same sequence.
 */
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * FNV-1a 32-bit hash of a string.
 * Used to derive a stable seed from the question text.
 */
function hashQuestion(question: string): number {
  let hash = 2166136261;
  for (let i = 0; i < question.length; i++) {
    hash ^= question.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Fisher-Yates shuffle using a seeded PRNG.
 * Returns a new array — does not mutate the input.
 */
function seededShuffle<T>(arr: readonly T[], rand: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/**
 * Select a panel of personas for a question.
 *
 * The selection is deterministic: the same question always produces the same
 * panel, so users can share links that reproduce identical deliberations.
 *
 * @param question - The question being deliberated
 * @param panelSize - Number of personas to select (default 5)
 */
export function selectPanel(question: string, panelSize = 5): Persona[] {
  if (panelSize < 1 || panelSize > PERSONAS.length) {
    throw new RangeError(
      `panelSize must be between 1 and ${PERSONAS.length}, got ${panelSize}`,
    );
  }
  const seed = hashQuestion(question.trim().toLowerCase());
  const rand = mulberry32(seed);
  return seededShuffle(PERSONAS, rand).slice(0, panelSize);
}
