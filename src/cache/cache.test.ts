/**
 * Unit tests for DeliberationCache.
 * No external dependencies — pure in-memory behaviour plus file I/O tested
 * with a temp path under /tmp.
 *
 * Run with: npm test
 */

import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import { DeliberationCache } from './cache.js';
import type { DeliberationResult } from '../deliberation/index.js';

// ── Fixtures ────────────────────────────────────────────────────────────

function makeResult(question: string, synthesis = 'Some synthesis.'): DeliberationResult {
  return {
    question,
    responses: [
      {
        persona: { id: 'p01', label: 'Test Persona', dimensions: { worldview: 'centrist' } } as any,
        response: 'A response.',
        inputTokens: 10,
        outputTokens: 5,
      },
    ],
    failed: [],
    synthesis,
    durationMs: 123,
  };
}

const TMP_CACHE = '/tmp/decider-cache-test.json';

after(async () => {
  await rm(TMP_CACHE, { force: true });
});

// ── get / set ────────────────────────────────────────────────────────────

describe('DeliberationCache — get / set', () => {
  it('returns undefined for an unknown key', () => {
    const cache = new DeliberationCache();
    assert.equal(cache.get({ question: 'unknown?' }), undefined);
  });

  it('returns a stored result', () => {
    const cache = new DeliberationCache();
    const result = makeResult('Is AI safe?');
    cache.set({ question: 'Is AI safe?' }, result);
    assert.deepEqual(cache.get({ question: 'Is AI safe?' }), result);
  });

  it('normalises question — trims and lowercases for key comparison', () => {
    const cache = new DeliberationCache();
    const result = makeResult('is ai safe?');
    cache.set({ question: 'is ai safe?' }, result);

    assert.deepEqual(cache.get({ question: '  IS AI SAFE?  ' }), result);
  });

  it('treats different panelSizes as different cache entries', () => {
    const cache = new DeliberationCache();
    const r5 = makeResult('Q', 'synthesis-5');
    const r3 = makeResult('Q', 'synthesis-3');
    cache.set({ question: 'Q', panelSize: 5 }, r5);
    cache.set({ question: 'Q', panelSize: 3 }, r3);

    assert.equal(cache.get({ question: 'Q', panelSize: 5 })!.synthesis, 'synthesis-5');
    assert.equal(cache.get({ question: 'Q', panelSize: 3 })!.synthesis, 'synthesis-3');
  });

  it('treats different seeds as different cache entries', () => {
    const cache = new DeliberationCache();
    const r0 = makeResult('Q', 'seed-0');
    const r1 = makeResult('Q', 'seed-1');
    cache.set({ question: 'Q', seed: 0 }, r0);
    cache.set({ question: 'Q', seed: 1 }, r1);

    assert.equal(cache.get({ question: 'Q', seed: 0 })!.synthesis, 'seed-0');
    assert.equal(cache.get({ question: 'Q', seed: 1 })!.synthesis, 'seed-1');
  });

  it('undefined seed and no seed field are the same key', () => {
    const cache = new DeliberationCache();
    const result = makeResult('Q');
    cache.set({ question: 'Q', seed: undefined }, result);

    assert.deepEqual(cache.get({ question: 'Q' }), result);
  });

  it('overwriting the same key updates the value', () => {
    const cache = new DeliberationCache();
    cache.set({ question: 'Q' }, makeResult('Q', 'first'));
    cache.set({ question: 'Q' }, makeResult('Q', 'second'));

    assert.equal(cache.get({ question: 'Q' })!.synthesis, 'second');
  });
});

// ── size / clear ─────────────────────────────────────────────────────────

describe('DeliberationCache — size / clear', () => {
  it('size reflects number of stored entries', () => {
    const cache = new DeliberationCache();
    assert.equal(cache.size, 0);
    cache.set({ question: 'A' }, makeResult('A'));
    assert.equal(cache.size, 1);
    cache.set({ question: 'B' }, makeResult('B'));
    assert.equal(cache.size, 2);
  });

  it('overwriting a key does not increase size', () => {
    const cache = new DeliberationCache();
    cache.set({ question: 'A' }, makeResult('A', 'v1'));
    cache.set({ question: 'A' }, makeResult('A', 'v2'));
    assert.equal(cache.size, 1);
  });

  it('clear() removes all entries', () => {
    const cache = new DeliberationCache();
    cache.set({ question: 'A' }, makeResult('A'));
    cache.set({ question: 'B' }, makeResult('B'));
    cache.clear();
    assert.equal(cache.size, 0);
    assert.equal(cache.get({ question: 'A' }), undefined);
  });
});

// ── eviction ─────────────────────────────────────────────────────────────

describe('DeliberationCache — LRU eviction', () => {
  it('evicts the oldest entry when maxEntries is reached', () => {
    const cache = new DeliberationCache({ maxEntries: 3 });
    cache.set({ question: 'A' }, makeResult('A'));
    cache.set({ question: 'B' }, makeResult('B'));
    cache.set({ question: 'C' }, makeResult('C'));
    // Adding a 4th entry should evict 'A' (oldest)
    cache.set({ question: 'D' }, makeResult('D'));

    assert.equal(cache.size, 3);
    assert.equal(cache.get({ question: 'A' }), undefined, 'oldest entry evicted');
    assert.ok(cache.get({ question: 'B' }), 'B still present');
    assert.ok(cache.get({ question: 'D' }), 'D present');
  });

  it('updating an existing key does not trigger eviction', () => {
    const cache = new DeliberationCache({ maxEntries: 2 });
    cache.set({ question: 'A' }, makeResult('A', 'v1'));
    cache.set({ question: 'B' }, makeResult('B'));
    // Overwrite A — should not evict B
    cache.set({ question: 'A' }, makeResult('A', 'v2'));

    assert.equal(cache.size, 2);
    assert.ok(cache.get({ question: 'B' }), 'B still present');
    assert.equal(cache.get({ question: 'A' })!.synthesis, 'v2');
  });

  it('cache stays within maxEntries after many inserts', () => {
    const max = 5;
    const cache = new DeliberationCache({ maxEntries: max });
    for (let i = 0; i < 20; i++) {
      cache.set({ question: `Q${i}` }, makeResult(`Q${i}`));
    }
    assert.equal(cache.size, max);
  });
});

// ── persistence ───────────────────────────────────────────────────────────

describe('DeliberationCache — file persistence', () => {
  it('load() silently succeeds when file does not exist', async () => {
    const cache = new DeliberationCache({ persistPath: '/tmp/nonexistent-cache-xyz.json' });
    await assert.doesNotReject(cache.load());
    assert.equal(cache.size, 0);
  });

  it('persist() and load() round-trip entries correctly', async () => {
    const cache1 = new DeliberationCache({ persistPath: TMP_CACHE });
    cache1.set({ question: 'Round trip?' }, makeResult('Round trip?', 'persisted synthesis'));
    await cache1.persist();

    const cache2 = new DeliberationCache({ persistPath: TMP_CACHE });
    await cache2.load();

    assert.equal(cache2.size, 1);
    assert.equal(
      cache2.get({ question: 'Round trip?' })!.synthesis,
      'persisted synthesis',
    );
  });

  it('load() respects maxEntries — trims excess entries from file', async () => {
    // Write 5 entries to disk
    const writer = new DeliberationCache({ persistPath: TMP_CACHE, maxEntries: 10 });
    for (let i = 0; i < 5; i++) writer.set({ question: `Q${i}` }, makeResult(`Q${i}`));
    await writer.persist();

    // Load with maxEntries: 3 — should only keep last 3
    const reader = new DeliberationCache({ persistPath: TMP_CACHE, maxEntries: 3 });
    await reader.load();

    assert.equal(reader.size, 3);
  });

  it('persist() creates parent directories if they do not exist', async () => {
    const deepPath = '/tmp/decider-test-deep/nested/cache.json';
    const cache = new DeliberationCache({ persistPath: deepPath });
    cache.set({ question: 'Deep?' }, makeResult('Deep?'));
    await assert.doesNotReject(cache.persist());

    // Verify we can load it back
    const reader = new DeliberationCache({ persistPath: deepPath });
    await reader.load();
    assert.equal(reader.size, 1);

    // Cleanup
    await rm('/tmp/decider-test-deep', { recursive: true, force: true });
  });

  it('persist() is a no-op when persistPath is not set', async () => {
    const cache = new DeliberationCache(); // no persistPath
    cache.set({ question: 'No file' }, makeResult('No file'));
    await assert.doesNotReject(cache.persist());
  });
});
