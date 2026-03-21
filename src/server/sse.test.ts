/**
 * Unit tests for the SSE stream helper.
 * Pure function — no mocking required.
 *
 * Run with: npm test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { ServerResponse } from 'node:http';
import { openSseStream } from './sse.js';

function makeMockRes() {
  const state = {
    statusCode: null as number | null,
    headers: {} as Record<string, string>,
    written: [] as string[],
    ended: false,
  };
  const res = {
    writeHead(code: number, hdrs?: Record<string, string>) {
      state.statusCode = code;
      if (hdrs) Object.assign(state.headers, hdrs);
    },
    write(data: string) {
      state.written.push(data);
      return true;
    },
    end() {
      state.ended = true;
      return this;
    },
  } as unknown as ServerResponse;
  return { res, state };
}

describe('openSseStream', () => {
  it('sets status 200 with correct SSE headers', () => {
    const { res, state } = makeMockRes();

    openSseStream(res);

    assert.equal(state.statusCode, 200);
    assert.equal(state.headers['Content-Type'], 'text/event-stream');
    assert.equal(state.headers['Cache-Control'], 'no-cache');
    assert.equal(state.headers['Connection'], 'keep-alive');
    assert.equal(state.headers['Access-Control-Allow-Origin'], '*');
  });

  it('send() writes a correctly formatted SSE data frame', () => {
    const { res, state } = makeMockRes();
    const { send } = openSseStream(res);

    send({ type: 'test', value: 42 });

    assert.equal(state.written.length, 1);
    assert.equal(state.written[0], 'data: {"type":"test","value":42}\n\n');
  });

  it('send() can write multiple independent frames', () => {
    const { res, state } = makeMockRes();
    const { send } = openSseStream(res);

    send({ type: 'a' });
    send({ type: 'b', x: 1 });

    assert.equal(state.written.length, 2);
    assert.equal(state.written[0], 'data: {"type":"a"}\n\n');
    assert.equal(state.written[1], 'data: {"type":"b","x":1}\n\n');
  });

  it('close() ends the response', () => {
    const { res, state } = makeMockRes();
    const { close } = openSseStream(res);

    assert.equal(state.ended, false);
    close();
    assert.equal(state.ended, true);
  });

  it('send() correctly serializes nested objects', () => {
    const { res, state } = makeMockRes();
    const { send } = openSseStream(res);

    send({ type: 'persona', data: { id: 'p01', label: 'Test Persona' } });

    const frame = state.written[0]!;
    assert.ok(frame.startsWith('data: '), 'starts with data: prefix');
    assert.ok(frame.endsWith('\n\n'), 'ends with double newline');
    const parsed = JSON.parse(frame.slice(6));
    assert.equal(parsed.type, 'persona');
    assert.equal(parsed.data.id, 'p01');
    assert.equal(parsed.data.label, 'Test Persona');
  });

  it('send() handles arrays and null values', () => {
    const { res, state } = makeMockRes();
    const { send } = openSseStream(res);

    send({ items: [1, 2, 3], nothing: null });

    const parsed = JSON.parse(state.written[0]!.slice(6));
    assert.deepEqual(parsed.items, [1, 2, 3]);
    assert.equal(parsed.nothing, null);
  });
});
