import type { IncomingMessage, ServerResponse } from 'node:http';
import { deliberateStream } from '../deliberation/index.js';
import type { DeliberationOptions } from '../deliberation/index.js';
import type { DeliberationCache } from '../cache/index.js';
import { openSseStream } from './sse.js';

const MAX_BODY_BYTES = 1024 * 1024; // 1 MB — a question + options will never approach this

/** Read the full request body as a string, rejecting payloads larger than MAX_BODY_BYTES. */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on('data', (chunk: Buffer) => {
      total += chunk.byteLength;
      if (total > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/**
 * POST /deliberate
 *
 * Request body (JSON):
 *   { question: string, options?: DeliberationOptions }
 *
 * Response: text/event-stream (SSE)
 *   data: {"type":"persona","persona":"Label","dimensions":{...},"response":"...","inputTokens":N,"outputTokens":N}
 *   data: {"type":"failed","persona":"Label","error":"..."}
 *   data: {"type":"synthesis","text":"..."}
 *   data: {"type":"done","durationMs":N,"totalResponses":N,"totalFailed":N}
 *   data: {"type":"error","message":"..."}   ← only on bad requests or uncaught throws
 */
export async function handleDeliberate(
  req: IncomingMessage,
  res: ServerResponse,
  cache?: DeliberationCache,
): Promise<void> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body: { question?: unknown; options?: unknown };
  try {
    const raw = await readBody(req);
    body = JSON.parse(raw) as { question?: unknown; options?: unknown };
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    return;
  }

  const { question, options } = body;

  if (typeof question !== 'string' || question.trim().length === 0) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '`question` must be a non-empty string' }));
    return;
  }

  const opts = (options as DeliberationOptions | undefined) ?? {};
  const cacheKey = {
    question: question.trim(),
    panelSize: opts.panelSize,
    seed: opts.seed,
  };

  const { send, close } = openSseStream(res);

  try {
    // ── Cache hit: replay stored result immediately ──────────────────
    const cached = cache?.get(cacheKey);
    if (cached) {
      for (const r of cached.responses) {
        send({
          type: 'persona',
          persona: r.persona.label,
          dimensions: r.persona.dimensions,
          response: r.response,
          inputTokens: r.inputTokens,
          outputTokens: r.outputTokens,
        });
      }
      for (const f of cached.failed) {
        send({ type: 'failed', persona: f.persona.label, error: f.error });
      }
      if (cached.synthesis) {
        send({ type: 'synthesis', text: cached.synthesis });
      }
      send({
        type: 'done',
        durationMs: cached.durationMs,
        totalResponses: cached.responses.length,
        totalFailed: cached.failed.length,
        fromCache: true,
      });
      return;
    }

    // ── Cache miss: run deliberation, then store ─────────────────────
    const result = await deliberateStream(
      question.trim(),
      {
        onPersona(r) {
          send({
            type: 'persona',
            persona: r.persona.label,
            dimensions: r.persona.dimensions,
            response: r.response,
            inputTokens: r.inputTokens,
            outputTokens: r.outputTokens,
          });
        },
        onFailed(f) {
          send({ type: 'failed', persona: f.persona.label, error: f.error });
        },
      },
      opts,
    );

    if (result.synthesis) {
      send({ type: 'synthesis', text: result.synthesis });
    }

    send({
      type: 'done',
      durationMs: result.durationMs,
      totalResponses: result.responses.length,
      totalFailed: result.failed.length,
      fromCache: false,
    });

    // Store and persist asynchronously — don't block the response
    if (cache) {
      cache.set(cacheKey, result);
      cache.persist().catch((err: unknown) => {
        console.error('Cache persist failed:', err);
      });
    }
  } catch (err) {
    send({
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    });
  } finally {
    close();
  }
}
