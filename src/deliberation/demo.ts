import { fileURLToPath } from 'node:url';
import { deliberate } from './deliberate.js';
import { DIMENSION_LABELS } from '../personas/index.js';

/**
 * Demo: run a deliberation and print results.
 * Usage: npx tsx src/deliberation/demo.ts "Your question here"
 */
async function main() {
  const question = process.argv[2] ?? 'Should cities ban cars from downtown?';

  console.log(`\nQuestion: "${question}"\n${'─'.repeat(60)}\n`);

  const result = await deliberate(question, { panelSize: 5 });

  for (const r of result.responses) {
    const d = r.persona.dimensions;
    const tags = [
      DIMENSION_LABELS.age[d.age],
      DIMENSION_LABELS.geography[d.geography],
      DIMENSION_LABELS.worldview[d.worldview],
      DIMENSION_LABELS.job[d.job],
    ].join(' · ');

    console.log(`▶ ${r.persona.label}`);
    console.log(`  ${tags}`);
    console.log(`  ${r.response}\n`);
  }

  const totalTokens = result.responses.reduce(
    (sum, r) => sum + r.inputTokens + r.outputTokens,
    0,
  );

  console.log('─'.repeat(60));
  console.log(
    `${result.panelSize} personas · ${result.durationMs}ms wall-clock · ${totalTokens} total tokens`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
