import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createGoClient } from './goClient.js';
import { HttpError } from '../http/errors.js';

// A stand-in Go service whose behavior is chosen by the request path.
let server: Server;
let baseUrl: string;
let closedPortUrl: string;

before(async () => {
  server = createServer((req, res) => {
    const send = (status: number, body: string) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(body);
    };
    // Echoes the requested path and query so tests can check URL building
    if (req.url?.startsWith('/echo/')) {
      return send(200, JSON.stringify({ data: { url: req.url } }));
    }
    switch (req.url) {
      case '/ok/api/analytics/summary':
        return send(200, JSON.stringify({ data: { generated_at: 'now' } }));
      case '/bad-request/api/analytics/summary':
        return send(400, JSON.stringify({ error: 'invalid window' }));
      case '/server-error/api/analytics/summary':
        return send(500, JSON.stringify({ error: 'query summary: connection refused' }));
      case '/no-envelope/api/analytics/summary':
        return send(200, JSON.stringify({ something: 'else' }));
      case '/slow/api/analytics/summary':
        setTimeout(() => send(200, JSON.stringify({ data: {} })), 500);
        return;
      case '/ok/api/health':
        return send(200, JSON.stringify({ status: 'healthy' }));
      default:
        return send(404, JSON.stringify({ error: 'not found' }));
    }
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;

  // Grab a free port, then close it so connections are refused
  const closed = createServer();
  await new Promise<void>((resolve) => closed.listen(0, resolve));
  closedPortUrl = `http://localhost:${(closed.address() as AddressInfo).port}`;
  await new Promise((resolve) => closed.close(resolve));
});

after(() => {
  server.close();
});

const client = (prefix: string, timeoutMs = 200) => createGoClient({ baseUrl: `${baseUrl}${prefix}`, timeoutMs });

async function assertHttpError(promise: Promise<unknown>, status: number, message: string) {
  await assert.rejects(promise, (err: unknown) => {
    assert.ok(err instanceof HttpError, `expected HttpError, got ${String(err)}`);
    assert.equal(err.status, status);
    assert.equal(err.message, message);
    return true;
  });
}

describe('GoClient.getSummary', () => {
  it('unwraps the data envelope', async () => {
    assert.deepEqual(await client('/ok').getSummary(), { generated_at: 'now' });
  });

  it('passes 4xx errors through with the upstream message', async () => {
    await assertHttpError(client('/bad-request').getSummary(), 400, 'invalid window');
  });

  it('maps 5xx to 502 without leaking upstream details', async () => {
    await assertHttpError(client('/server-error').getSummary(), 502, 'Analytics service error');
  });

  it('maps a malformed body to 502', async () => {
    await assertHttpError(client('/no-envelope').getSummary(), 502, 'Invalid response from analytics service');
  });

  it('maps a slow response to 504', async () => {
    await assertHttpError(client('/slow', 50).getSummary(), 504, 'Analytics service timed out');
  });

  it('maps a refused connection to 503', async () => {
    const unreachable = createGoClient({ baseUrl: closedPortUrl, timeoutMs: 200 });
    await assertHttpError(unreachable.getSummary(), 503, 'Analytics service unavailable');
  });
});

describe('GoClient.getTimeline', () => {
  it('adds ?days only when given', async () => {
    // The echo server returns { url } rather than a real Timeline
    const urlOf = async (days?: string) =>
      ((await client('/echo').getTimeline(days)) as unknown as { url: string }).url;
    assert.equal(await urlOf('7'), '/echo/api/analytics/timeline?days=7');
    assert.equal(await urlOf(), '/echo/api/analytics/timeline');
  });
});

describe('GoClient.ping', () => {
  it('is true when the health check succeeds', async () => {
    assert.equal(await client('/ok').ping(), true);
  });

  it('is false when the service is unreachable', async () => {
    assert.equal(await createGoClient({ baseUrl: closedPortUrl, timeoutMs: 200 }).ping(), false);
  });
});
