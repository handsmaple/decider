/**
 * Unit tests for the panel selection internals and public API.
 *
 * Run with: npm test
 * Uses Node's built-in test runner (node:test) — no extra dependencies.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { PERSONAS, WORLDVIEWS } from '../personas/index.js';
import { hashQuestion, mulberry32, seededShuffle, selectPanel } from './select.js';

// ── hashQuestion (FNV-1a 32-bit) ───────────────────────────────────

describe('hashQuestion', () => {
  it('empty string returns the FNV-1a offset basis', () => {
    // FNV-1a 32-bit offset basis = 2166136261
    assert.equal(hashQuestion(''), 2166136261);
  });

  it('is deterministic — same input always returns same value', () => {
    const q = 'Should cities ban cars from downtown?';
    assert.equal(hashQuestion(q), hashQuestion(q));
  });

  it('different inputs produce different hashes', () => {
    assert.notEqual(hashQuestion('yes'), hashQuestion('no'));
    assert.notEqual(hashQuestion('a'), hashQuestion('b'));
  });

  it('returns an unsigned 32-bit integer (0 ≤ result < 2^32)', () => {
    const samples = ['', 'a', 'hello world', 'Should AI be regulated?'];
    for (const s of samples) {
      const h = hashQuestion(s);
      assert.ok(Number.isInteger(h), `expected integer for "${s}"`);
      assert.ok(h >= 0, `expected non-negative for "${s}"`);
      assert.ok(h < 2 ** 32, `expected < 2^32 for "${s}"`);
    }
  });

  it('known value: "a"', () => {
    // FNV-1a("a"): hash = (2166136261 ^ 97) * 16777619, then >>> 0
    const expected = ((2166136261 ^ 97) * 16777619) >>> 0;
    assert.equal(hashQuestion('a'), expected);
  });
});

// ── mulberry32 ─────────────────────────────────────────────────────

describe('mulberry32', () => {
  it('produces values in [0, 1)', () => {
    const rand = mulberry32(42);
    for (let i = 0; i < 50; i++) {
      const v = rand();
      assert.ok(v >= 0 && v < 1, `value ${v} out of range on step ${i}`);
    }
  });

  it('same seed always yields the same sequence', () => {
    const seqA = Array.from({ length: 20 }, mulberry32(12345));
    const seqB = Array.from({ length: 20 }, mulberry32(12345));
    assert.deepEqual(seqA, seqB);
  });

  it('different seeds produce different first values', () => {
    assert.notEqual(mulberry32(1)(), mulberry32(2)());
  });

  it('produces distinct consecutive values (not stuck)', () => {
    const rand = mulberry32(999);
    const values = new Set(Array.from({ length: 10 }, () => rand()));
    // 10 draws should yield more than 1 distinct value
    assert.ok(values.size > 1);
  });
});

// ── seededShuffle ──────────────────────────────────────────────────

describe('seededShuffle', () => {
  const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it('returns an array of the same length', () => {
    const result = seededShuffle(original, mulberry32(1));
    assert.equal(result.length, original.length);
  });

  it('contains the same elements as the input', () => {
    const result = seededShuffle(original, mulberry32(1));
    assert.deepEqual([...result].sort((a, b) => a - b), [...original].sort((a, b) => a - b));
  });

  it('does not mutate the source array', () => {
    const src = [1, 2, 3, 4, 5];
    const copy = [...src];
    seededShuffle(src, mulberry32(7));
    assert.deepEqual(src, copy);
  });

  it('same seed produces the same permutation', () => {
    const a = seededShuffle(original, mulberry32(42));
    const b = seededShuffle(original, mulberry32(42));
    assert.deepEqual(a, b);
  });

  it('different seeds typically produce different permutations', () => {
    const a = seededShuffle(original, mulberry32(1));
    const b = seededShuffle(original, mulberry32(2));
    // Not guaranteed to differ but overwhelmingly likely for 10-element arrays
    assert.notDeepEqual(a, b);
  });

  it('handles single-element arrays', () => {
    const result = seededShuffle([42], mulberry32(1));
    assert.deepEqual(result, [42]);
  });

  it('handles empty arrays', () => {
    const result = seededShuffle([], mulberry32(1));
    assert.deepEqual(result, []);
  });
});

// ── selectPanel ────────────────────────────────────────────────────

describe('selectPanel', () => {
  const question = 'Should cities ban cars from downtown?';

  it('returns the requested number of personas', () => {
    for (const size of [1, 3, 5, 10]) {
      const panel = selectPanel(question, size);
      assert.equal(panel.length, size, `expected ${size} personas`);
    }
  });

  it('is deterministic — same question always returns the same panel', () => {
    const a = selectPanel(question);
    const b = selectPanel(question);
    assert.deepEqual(
      a.map((p) => p.id),
      b.map((p) => p.id),
    );
  });

  it('different questions produce different panels', () => {
    const a = selectPanel('Should AI be regulated?');
    const b = selectPanel('Is remote work better than office work?');
    assert.notDeepEqual(
      a.map((p) => p.id),
      b.map((p) => p.id),
    );
  });

  it('custom seed overrides the question-derived seed', () => {
    const defaultPanel = selectPanel(question);
    const rerolled = selectPanel(question, 5, 99999);
    assert.notDeepEqual(
      defaultPanel.map((p) => p.id),
      rerolled.map((p) => p.id),
    );
  });

  it('same custom seed gives the same result regardless of question', () => {
    const a = selectPanel('Question A', 5, 42);
    const b = selectPanel('Question B', 5, 42);
    assert.deepEqual(
      a.map((p) => p.id),
      b.map((p) => p.id),
    );
  });

  it('diversity guarantee: panel of 5 spans all 5 worldviews', () => {
    const panel = selectPanel(question, 5);
    const worldviews = new Set(panel.map((p) => p.dimensions.worldview));
    assert.equal(worldviews.size, WORLDVIEWS.length);
  });

  it('diversity guarantee: panel of 3 spans 3 distinct worldviews', () => {
    const panel = selectPanel(question, 3);
    const worldviews = new Set(panel.map((p) => p.dimensions.worldview));
    assert.equal(worldviews.size, 3);
  });

  it('diversity guarantee: panel of 1 has exactly 1 worldview', () => {
    const panel = selectPanel(question, 1);
    assert.equal(panel.length, 1);
  });

  it('trims and lowercases question before hashing (whitespace/case insensitive)', () => {
    const trimmed = selectPanel('should cities ban cars?');
    const padded = selectPanel('  should cities ban cars?  ');
    assert.deepEqual(
      trimmed.map((p) => p.id),
      padded.map((p) => p.id),
    );
  });

  it('all returned personas exist in the PERSONAS pool', () => {
    const panel = selectPanel(question, 5);
    const ids = new Set(PERSONAS.map((p) => p.id));
    for (const persona of panel) {
      assert.ok(ids.has(persona.id), `unknown persona id: ${persona.id}`);
    }
  });

  it('returned panel has no duplicate personas', () => {
    const panel = selectPanel(question, 10);
    const ids = panel.map((p) => p.id);
    assert.equal(ids.length, new Set(ids).size);
  });

  it('throws RangeError for panelSize < 1', () => {
    assert.throws(() => selectPanel(question, 0), RangeError);
    assert.throws(() => selectPanel(question, -1), RangeError);
  });

  it('throws RangeError for panelSize > total personas', () => {
    assert.throws(() => selectPanel(question, PERSONAS.length + 1), RangeError);
  });

  it('accepts panelSize === total personas (edge case)', () => {
    const panel = selectPanel(question, PERSONAS.length);
    assert.equal(panel.length, PERSONAS.length);
  });
});
