/**
 * Unit tests for the deliberation engine.
 *
 * Tests that don't require a live API key:
 *   - DEFAULT_MODEL constant value
 *   - selectPanel error propagation through deliberate()
 *   - deliberateStream error propagation
 *   - Return shape validation (structure, not values)
 *
 * Full end-to-end tests (persona calls + synthesis) require ANTHROPIC_API_KEY
 * and are skipped here — covered by integration tests.
 *
 * Run with: npm test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { deliberate, deliberateStream, DEFAULT_MODEL } from './deliberate.js';

// ── DEFAULT_MODEL ──────────────────────────────────────────────────────

describe('DEFAULT_MODEL', () => {
  it('is claude-opus-4-6', () => {
    assert.equal(DEFAULT_MODEL, 'claude-opus-4-6');
  });

  it('is a non-empty string', () => {
    assert.ok(typeof DEFAULT_MODEL === 'string' && DEFAULT_MODEL.length > 0);
  });
});

// ── deliberate() — error propagation ──────────────────────────────────

describe('deliberate — panelSize validation', () => {
  it('throws RangeError for panelSize < 1', async () => {
    await assert.rejects(
      () => deliberate('Test?', { panelSize: 0 }),
      RangeError,
    );
  });

  it('throws RangeError for panelSize of 0', async () => {
    await assert.rejects(
      () => deliberate('Test?', { panelSize: 0 }),
      (err: unknown) => {
        assert.ok(err instanceof RangeError);
        return true;
      },
    );
  });

  it('throws RangeError for panelSize > 50 (total persona count)', async () => {
    await assert.rejects(
      () => deliberate('Test?', { panelSize: 51 }),
      RangeError,
    );
  });

  it('throws RangeError for negative panelSize', async () => {
    await assert.rejects(
      () => deliberate('Test?', { panelSize: -5 }),
      RangeError,
    );
  });
});

// ── deliberateStream() — error propagation ─────────────────────────────

describe('deliberateStream — panelSize validation', () => {
  it('throws RangeError for panelSize < 1', async () => {
    await assert.rejects(
      () => deliberateStream('Test?', {}, { panelSize: 0 }),
      RangeError,
    );
  });

  it('throws RangeError for panelSize > 50', async () => {
    await assert.rejects(
      () => deliberateStream('Test?', {}, { panelSize: 99 }),
      RangeError,
    );
  });
});

// ── Public API surface ─────────────────────────────────────────────────

describe('public API surface', () => {
  it('deliberate is a function', () => {
    assert.ok(typeof deliberate === 'function');
  });

  it('deliberateStream is a function', () => {
    assert.ok(typeof deliberateStream === 'function');
  });

  it('deliberate returns a Promise', () => {
    // panelSize 0 → immediate RangeError, but still a Promise
    const result = deliberate('Test?', { panelSize: 0 });
    assert.ok(result instanceof Promise);
    // Consume the rejection to avoid unhandledRejection noise
    result.catch(() => {});
  });

  it('deliberateStream returns a Promise', () => {
    const result = deliberateStream('Test?', {}, { panelSize: 0 });
    assert.ok(result instanceof Promise);
    result.catch(() => {});
  });
});
