/**
 * Unit tests for the HTTP route handler.
 *
 * These tests cover all early-return paths (before deliberateStream is called):
 *   - CORS preflight
 *   - Method rejection
 *   - JSON parsing errors
 *   - Question field validation
 *
 * The valid-POST SSE path requires a live ANTHROPIC_API_KEY and is not
 * tested here — covered by integration tests.
 *
 * Run with: npm test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { handleDeliberate } from './routes.js';

// ── Test helpers ───────────────────────────────────────────────────────

function makeReq(method: string, body: string): IncomingMessage {
  const req = new EventEmitter() as unknown as IncomingMessage;
  (req as unknown as Record<string, unknown>).method = method;
  // Emit the body asynchronously, as a real HTTP request would
  setImmediate(() => {
    req.emit('data', Buffer.from(body));
    req.emit('end');
  });
  return req;
}

interface ResState {
  res: ServerResponse;
  statusCode: number | null;
  headers: Record<string, string>;
  body: string;
  ended: boolean;
}

function makeRes(): ResState {
  // IMPORTANT: read state.statusCode / state.body AFTER the handler resolves.
  // Never destructure primitive fields before the call — they are copied by value
  // and won't reflect updates made inside the handler.
  const state: ResState = {
    res: null as unknown as ServerResponse,
    statusCode: null,
    headers: {},
    body: '',
    ended: false,
  };
  state.res = {
    writeHead(code: number, hdrs?: Record<string, string>) {
      state.statusCode = code;
      if (hdrs) Object.assign(state.headers, hdrs);
    },
    write(data: string) {
      state.body += data;
      return true;
    },
    end(data?: string) {
      if (data) state.body += data;
      state.ended = true;
      return this;
    },
  } as unknown as ServerResponse;
  return state;
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('handleDeliberate', () => {
  // ── CORS preflight ───────────────────────────────────────────────────

  it('OPTIONS returns 204 with CORS headers', async () => {
    const state = makeRes();
    await handleDeliberate(makeReq('OPTIONS', ''), state.res);

    assert.equal(state.statusCode, 204);
    assert.equal(state.headers['Access-Control-Allow-Origin'], '*');
    assert.ok(state.headers['Access-Control-Allow-Methods']?.includes('POST'));
    assert.ok(state.headers['Access-Control-Allow-Headers']?.includes('Content-Type'));
  });

  it('OPTIONS response is ended immediately', async () => {
    const state = makeRes();
    await handleDeliberate(makeReq('OPTIONS', ''), state.res);

    assert.equal(state.ended, true);
  });

  // ── Method rejection ─────────────────────────────────────────────────

  it('GET returns 405 with JSON error body', async () => {
    const state = makeRes();
    await handleDeliberate(makeReq('GET', ''), state.res);

    assert.equal(state.statusCode, 405);
    assert.ok((JSON.parse(state.body) as { error: string }).error);
  });

  it('PUT returns 405', async () => {
    const state = makeRes();
    await handleDeliberate(makeReq('PUT', '{"question":"test"}'), state.res);

    assert.equal(state.statusCode, 405);
  });

  it('DELETE returns 405', async () => {
    const state = makeRes();
    await handleDeliberate(makeReq('DELETE', ''), state.res);

    assert.equal(state.statusCode, 405);
  });

  it('PATCH returns 405', async () => {
    const state = makeRes();
    await handleDeliberate(makeReq('PATCH', '{"question":"test"}'), state.res);

    assert.equal(state.statusCode, 405);
  });

  // ── JSON parsing ─────────────────────────────────────────────────────

  it('POST with malformed JSON returns 400 with error message', async () => {
    const state = makeRes();
    await handleDeliberate(makeReq('POST', 'this is not json at all'), state.res);

    assert.equal(state.statusCode, 400);
    assert.equal((JSON.parse(state.body) as { error: string }).error, 'Invalid JSON body');
  });

  it('POST with empty body returns 400', async () => {
    const state = makeRes();
    await handleDeliberate(makeReq('POST', ''), state.res);

    assert.equal(state.statusCode, 400);
  });

  it('POST with truncated JSON returns 400', async () => {
    const state = makeRes();
    await handleDeliberate(makeReq('POST', '{"question":"incomplete'), state.res);

    assert.equal(state.statusCode, 400);
  });

  // ── Question validation ───────────────────────────────────────────────

  it('POST with missing question field returns 400 mentioning "question"', async () => {
    const state = makeRes();
    await handleDeliberate(makeReq('POST', '{"options":{}}'), state.res);

    assert.equal(state.statusCode, 400);
    assert.match((JSON.parse(state.body) as { error: string }).error, /question/);
  });

  it('POST with null question returns 400', async () => {
    const state = makeRes();
    await handleDeliberate(makeReq('POST', '{"question":null}'), state.res);

    assert.equal(state.statusCode, 400);
  });

  it('POST with numeric question returns 400', async () => {
    const state = makeRes();
    await handleDeliberate(makeReq('POST', '{"question":42}'), state.res);

    assert.equal(state.statusCode, 400);
  });

  it('POST with boolean question returns 400', async () => {
    const state = makeRes();
    await handleDeliberate(makeReq('POST', '{"question":true}'), state.res);

    assert.equal(state.statusCode, 400);
  });

  it('POST with array question returns 400', async () => {
    const state = makeRes();
    await handleDeliberate(makeReq('POST', '{"question":["a","b"]}'), state.res);

    assert.equal(state.statusCode, 400);
  });

  it('POST with empty string question returns 400', async () => {
    const state = makeRes();
    await handleDeliberate(makeReq('POST', '{"question":""}'), state.res);

    assert.equal(state.statusCode, 400);
    assert.match((JSON.parse(state.body) as { error: string }).error, /question/);
  });

  it('POST with whitespace-only question returns 400', async () => {
    const state = makeRes();
    await handleDeliberate(makeReq('POST', '{"question":"   "}'), state.res);

    assert.equal(state.statusCode, 400);
  });

  it('POST with tab-only question returns 400', async () => {
    const state = makeRes();
    await handleDeliberate(makeReq('POST', '{"question":"\t\t"}'), state.res);

    assert.equal(state.statusCode, 400);
  });

  it('POST with empty JSON object (no fields) returns 400', async () => {
    const state = makeRes();
    await handleDeliberate(makeReq('POST', '{}'), state.res);

    assert.equal(state.statusCode, 400);
  });
});
