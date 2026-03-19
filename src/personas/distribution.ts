import { PERSONAS } from './personas.js';

/**
 * Print distribution stats for all dimensions.
 * Run with: npx tsx src/personas/distribution.ts
 */
function countDistribution() {
  const counts: Record<string, Record<string, number>> = {
    age: {},
    geography: {},
    worldview: {},
    interests: {},
    job: {},
    education: {},
  };

  for (const p of PERSONAS) {
    const d = p.dimensions;
    counts.age[d.age] = (counts.age[d.age] ?? 0) + 1;
    counts.geography[d.geography] = (counts.geography[d.geography] ?? 0) + 1;
    counts.worldview[d.worldview] = (counts.worldview[d.worldview] ?? 0) + 1;
    for (const interest of d.interests) {
      counts.interests[interest] = (counts.interests[interest] ?? 0) + 1;
    }
    counts.job[d.job] = (counts.job[d.job] ?? 0) + 1;
    counts.education[d.education] = (counts.education[d.education] ?? 0) + 1;
  }

  console.log(`Total personas: ${PERSONAS.length}\n`);

  for (const [dimension, values] of Object.entries(counts)) {
    console.log(`── ${dimension.toUpperCase()} ──`);
    const total = dimension === 'interests'
      ? Object.values(values).reduce((a, b) => a + b, 0)
      : PERSONAS.length;
    for (const [value, count] of Object.entries(values).sort((a, b) => b[1] - a[1])) {
      const pct = ((count / total) * 100).toFixed(1);
      console.log(`  ${value.padEnd(24)} ${String(count).padStart(3)}  (${pct}%)`);
    }
    console.log();
  }
}

countDistribution();
