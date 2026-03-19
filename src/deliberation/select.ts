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
 * Walk a shuffled pool and select `panelSize` personas with a diversity
 * guarantee: the first `min(panelSize, 5)` slots each come from a distinct
 * worldview before any worldview is repeated.
 *
 * This ensures a panel of 5 always spans all 5 worldviews, and a panel of 3
 * always spans 3 distinct worldviews — preventing the shuffle from accidentally
 * over-representing a single perspective.
 *
 * Remaining slots (after diversity is satisfied) are filled in shuffle order.
 */
function selectWithDiversity(shuffled: readonly Persona[], panelSize: number): Persona[] {
  const targetWorldviews = Math.min(panelSize, 5); // one per worldview before repeating
  const seenWorldviews = new Set<string>();
  const priority: Persona[] = [];  // diverse first-picks
  const overflow: Persona[] = [];  // fills remaining slots

  for (const persona of shuffled) {
    const wv = persona.dimensions.worldview;
    if (seenWorldviews.size < targetWorldviews && !seenWorldviews.has(wv)) {
      seenWorldviews.add(wv);
      priority.push(persona);
    } else {
      overflow.push(persona);
    }
    if (priority.length + overflow.length >= shuffled.length) break;
  }

  return [...priority, ...overflow].slice(0, panelSize);
}

/**
 * Select a panel of personas for a question.
 *
 * The selection is deterministic: the same question always produces the same
 * panel, so deliberations are reproducible and shareable.
 *
 * Pass a custom `seed` to re-roll the panel for the same question (e.g., to
 * explore different perspectives or for A/B testing).
 *
 * @param question - The question being deliberated
 * @param panelSize - Number of personas to select (default 5)
 * @param seed - Optional seed override; defaults to FNV-1a hash of the question
 */
export function selectPanel(question: string, panelSize = 5, seed?: number): Persona[] {
  if (panelSize < 1 || panelSize > PERSONAS.length) {
    throw new RangeError(
      `panelSize must be between 1 and ${PERSONAS.length}, got ${panelSize}`,
    );
  }
  const effectiveSeed = seed ?? hashQuestion(question.trim().toLowerCase());
  const rand = mulberry32(effectiveSeed);
  const shuffled = seededShuffle(PERSONAS, rand);
  return selectWithDiversity(shuffled, panelSize);
}
