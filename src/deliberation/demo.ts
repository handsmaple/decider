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

  const result = await deliberate(question);

  for (const r of result.responses) {
    const d = r.persona.dimensions;
    // Worldview leads — it is the most predictive signal for a given response
    const tags = [
      DIMENSION_LABELS.worldview[d.worldview],
      DIMENSION_LABELS.job[d.job],
      DIMENSION_LABELS.geography[d.geography],
      DIMENSION_LABELS.age[d.age],
    ].join(' · ');

    console.log(`▶ ${r.persona.label}`);
    console.log(`  ${tags}`);
    console.log(`  ${r.response}\n`);
  }

  if (result.failed.length > 0) {
    console.log(`⚠ ${result.failed.length} persona(s) failed:`);
    for (const f of result.failed) {
      console.log(`  ${f.persona.label}: ${f.error}`);
    }
    console.log();
  }

  if (result.synthesis) {
    console.log('── Synthesis ' + '─'.repeat(48));
    console.log(result.synthesis);
    console.log();
  }

  const totalTokens = result.responses.reduce(
    (sum, r) => sum + r.inputTokens + r.outputTokens,
    0,
  );

  console.log('─'.repeat(60));
  console.log(
    `${result.responses.length} personas · ${result.durationMs}ms wall-clock · ${totalTokens} tokens`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
