import type { ServerResponse } from 'node:http';

/**
 * Open an SSE stream on the response.
 * Returns a `send` function that writes one SSE `data:` frame,
 * and a `close` function that ends the response.
 */
export function openSseStream(res: ServerResponse): {
  send: (payload: unknown) => void;
  close: () => void;
} {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  return {
    send(payload: unknown) {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    },
    close() {
      res.end();
    },
  };
}
