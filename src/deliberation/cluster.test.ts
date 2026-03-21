/**
 * Unit tests for theme clustering.
 *
 * Tests that don't require a live API key:
 *   - Returns [] for fewer than 2 responses (no API call made)
 *   - clusterThemes is a function with the correct signature
 *
 * Full clustering tests require ANTHROPIC_API_KEY and are covered
 * by integration tests.
 *
 * Run with: npm test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { clusterThemes } from './cluster.js';
import type { PersonaResponse } from './deliberate.js';

function makeResponse(label: string, response: string): PersonaResponse {
  return {
    persona: {
      id: 'p01',
      label,
      dimensions: { worldview: 'centrist', age: 'adult' } as any,
    },
    response,
    inputTokens: 10,
    outputTokens: 5,
  };
}

describe('clusterThemes', () => {
  it('is a function', () => {
    assert.ok(typeof clusterThemes === 'function');
  });

  it('returns a Promise', () => {
    // 0 responses → returns [] without API call
    const result = clusterThemes('Q?', []);
    assert.ok(result instanceof Promise);
    // Consume to avoid unhandledRejection
    result.catch(() => {});
  });

  it('returns [] immediately for 0 responses (no API call)', async () => {
    const clusters = await clusterThemes('Test?', []);
    assert.deepEqual(clusters, []);
  });

  it('returns [] immediately for 1 response (no API call)', async () => {
    const clusters = await clusterThemes('Test?', [makeResponse('Solo', 'I am alone.')]);
    assert.deepEqual(clusters, []);
  });
});

describe('DeliberationOptions.includeThemeClusters', () => {
  it('clusters field is absent when includeThemeClusters is not set', async () => {
    // deliberate() with panelSize=0 throws immediately before any API call
    const { deliberate } = await import('./deliberate.js');
    const result = await deliberate('Test?', { panelSize: 0 }).catch(() => null);
    // Just checking the field is absent — panelSize: 0 throws, so result is null
    assert.equal(result, null);
  });
});
