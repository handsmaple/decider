/**
 * Unit tests for the question sanitizer.
 *
 * These tests cover the synchronous heuristic layer only — no ANTHROPIC_API_KEY
 * required. The Claude fallback path (borderline questions) is not tested here;
 * it is covered by integration tests.
 *
 * Run with: npm test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runHeuristic, sanitizeQuestion } from './sanitize.js';

// ── runHeuristic ───────────────────────────────────────────────────────────

describe('runHeuristic', () => {
  // ── Neutral questions → pass ──────────────────────────────────────────

  it('returns pass for a plain policy question', () => {
    const { verdict } = runHeuristic('Should cities invest more in public transit?');
    assert.equal(verdict, 'pass');
  });

  it('returns pass for an open comparative question', () => {
    const { verdict } = runHeuristic('What are the trade-offs between nuclear and solar energy?');
    assert.equal(verdict, 'pass');
  });

  it('returns pass for a factual question', () => {
    const { verdict } = runHeuristic('How does ranked-choice voting work?');
    assert.equal(verdict, 'pass');
  });

  it('returns pass for a contested but neutrally framed question', () => {
    const { verdict } = runHeuristic('Should the minimum wage be raised to $20 an hour?');
    assert.equal(verdict, 'pass');
  });

  // ── Leading patterns → biased ─────────────────────────────────────────

  it('returns biased for "Isn\'t it obvious that" opener', () => {
    const { verdict } = runHeuristic("Isn't it obvious that electric cars are better?");
    assert.equal(verdict, 'biased');
  });

  it('returns biased for case-insensitive "ISN\'T IT OBVIOUS"', () => {
    const { verdict } = runHeuristic("ISN'T IT OBVIOUS THAT taxes should be lower?");
    assert.equal(verdict, 'biased');
  });

  it('returns biased for "Don\'t you think" opener', () => {
    const { verdict } = runHeuristic("Don't you think the government is too big?");
    assert.equal(verdict, 'biased');
  });

  it('returns biased for "Wouldn\'t you agree" opener', () => {
    const { verdict } = runHeuristic("Wouldn't you agree that crime is out of control?");
    assert.equal(verdict, 'biased');
  });

  it('returns biased for "Surely" opener', () => {
    const { verdict } = runHeuristic('Surely free speech should have no limits?');
    assert.equal(verdict, 'biased');
  });

  it('returns biased for "Obviously" opener', () => {
    const { verdict } = runHeuristic('Obviously the current system is broken — how do we fix it?');
    assert.equal(verdict, 'biased');
  });

  it('returns biased for "Everyone knows" opener', () => {
    const { verdict } = runHeuristic('Everyone knows immigration is out of control, so what should we do?');
    assert.equal(verdict, 'biased');
  });

  it('returns biased for presuppositional "why is X so bad" form', () => {
    const { verdict } = runHeuristic('Why is social media so terrible for mental health?');
    assert.equal(verdict, 'biased');
  });

  it('returns biased for presuppositional "why are X so corrupt" form', () => {
    const { verdict } = runHeuristic('Why are politicians so corrupt?');
    assert.equal(verdict, 'biased');
  });

  it('returns biased for "why do conservatives always" form', () => {
    const { verdict } = runHeuristic('Why do conservatives always block progress?');
    assert.equal(verdict, 'biased');
  });

  it('returns biased for "why do liberals always" form', () => {
    const { verdict } = runHeuristic('Why do liberals always want more government?');
    assert.equal(verdict, 'biased');
  });

  it('returns biased for "don\'t you agree that" mid-sentence', () => {
    const { verdict } = runHeuristic("Given the evidence, don't you agree that vaccines are safe?");
    assert.equal(verdict, 'biased');
  });

  // ── Loaded language → borderline / biased ────────────────────────────

  it('returns borderline for one loaded cluster hit', () => {
    const { verdict } = runHeuristic('Is the current healthcare system truly terrible?');
    assert.equal(verdict, 'borderline');
  });

  it('returns borderline for one loaded cluster from a different category', () => {
    const { verdict } = runHeuristic('Can capitalism destroy communities?');
    assert.equal(verdict, 'borderline');
  });

  it('returns biased for two loaded cluster hits', () => {
    // 'disgusting' (cluster 0) + 'destroy' (cluster 2)
    const { verdict } = runHeuristic('Is it disgusting that corporations can destroy the environment?');
    assert.equal(verdict, 'biased');
  });

  it('returns biased for two loaded cluster hits from distinct groups', () => {
    // 'corrupt' (cluster 1) + 'idiotic' (cluster 3)
    const { verdict } = runHeuristic('Why do corrupt politicians make such idiotic decisions?');
    assert.equal(verdict, 'biased');
  });

  it('provides a reason when verdict is biased via leading pattern', () => {
    const { verdict, reason } = runHeuristic("Isn't it obvious that this policy will fail?");
    assert.equal(verdict, 'biased');
    assert.ok(typeof reason === 'string' && reason.length > 0);
  });

  it('provides a reason when verdict is biased via loaded language', () => {
    const { verdict, reason } = runHeuristic('Is it disgusting and idiotic to support this bill?');
    assert.equal(verdict, 'biased');
    assert.ok(typeof reason === 'string' && reason.length > 0);
  });

  it('does not provide a reason for borderline verdict', () => {
    const { verdict, reason } = runHeuristic('Is the policy truly terrible?');
    assert.equal(verdict, 'borderline');
    assert.equal(reason, undefined);
  });
});

// ── sanitizeQuestion (heuristic paths only — no API key needed) ────────────

describe('sanitizeQuestion — heuristic paths', () => {
  it('returns biased:false for a neutral question', async () => {
    const result = await sanitizeQuestion('Should cities ban single-use plastics?');
    assert.equal(result.biased, false);
  });

  it('returns biased:true for a leading question', async () => {
    const result = await sanitizeQuestion("Isn't it obvious that fossil fuels must be banned immediately?");
    assert.equal(result.biased, true);
    assert.ok(result.biased && typeof result.reason === 'string');
    assert.ok(result.biased && typeof result.score === 'number');
    assert.ok(result.biased && result.score > 0 && result.score <= 1);
  });

  it('returns biased:true for a question with multiple loaded terms', async () => {
    const result = await sanitizeQuestion('Why do corrupt elites make such idiotic decisions?');
    assert.equal(result.biased, true);
  });
});
