import { createServer } from 'node:http';
import { handleDeliberate } from './routes.js';
import { DeliberationCache } from '../cache/index.js';

const PORT = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3000;

const cache = new DeliberationCache({
  maxEntries: 200,
  persistPath: '.cache/deliberations.json',
});

// Load persisted cache before accepting requests
await cache.load();

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (url.pathname === '/deliberate') {
    handleDeliberate(req, res, cache).catch((err: unknown) => {
      console.error('Unhandled error in /deliberate:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Decider server listening on http://localhost:${PORT}`);
  console.log('POST /deliberate  — streams persona responses via SSE');
});
