import { fileURLToPath } from 'node:url';
import { PERSONAS } from './personas.js';
import { DIMENSION_LABELS } from './types.js';

/**
 * Print distribution stats for all dimensions.
 * Run with: npx tsx src/personas/distribution.ts
 */
function countDistribution() {
  // Scalar dimensions — one value per persona
  const scalarDims = ['age', 'geography', 'worldview', 'job', 'education'] as const;
  type ScalarDim = (typeof scalarDims)[number];

  const counts = {} as Record<ScalarDim, Record<string, number>>;
  const interestCounts: Record<string, number> = {};

  for (const p of PERSONAS) {
    const d = p.dimensions;
    for (const dim of scalarDims) {
      counts[dim] ??= {};
      const val = d[dim] as string;
      counts[dim][val] = (counts[dim][val] ?? 0) + 1;
    }
    // Interests is multi-value (1–2 per persona) — counted separately
    for (const interest of d.interests) {
      interestCounts[interest] = (interestCounts[interest] ?? 0) + 1;
    }
  }

  console.log(`Total personas: ${PERSONAS.length}\n`);

  function printCounts(
    dim: keyof typeof DIMENSION_LABELS,
    valueCounts: Record<string, number>,
    total: number,
  ) {
    const labels = DIMENSION_LABELS[dim];
    console.log(`── ${dim.toUpperCase()} ──`);
    for (const [value, count] of Object.entries(valueCounts).sort((a, b) => b[1] - a[1])) {
      const label = labels[value as keyof typeof labels];
      const pct = ((count / total) * 100).toFixed(1);
      console.log(`  ${label.padEnd(28)} ${String(count).padStart(3)}  (${pct}%)`);
    }
    console.log();
  }

  for (const dim of scalarDims) {
    printCounts(dim, counts[dim], PERSONAS.length);
  }

  const interestTotal = Object.values(interestCounts).reduce((a, b) => a + b, 0);
  printCounts('interests', interestCounts, interestTotal);
}

// ESM main guard — only run when executed directly, not when imported
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  countDistribution();
}
