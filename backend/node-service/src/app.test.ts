import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Pool } from 'pg';
import { createApp } from './app.js';
import type { GoClient } from './clients/goClient.js';
import { HttpError } from './http/errors.js';
import type { AnalyticsSummary } from './types/analytics.js';

const summary: AnalyticsSummary = {
  generated_at: '2026-10-12T20:00:00Z',
  open_incidents: { current: 52, previous: 26, critical: 6, unacknowledged: 5 },
  assets_at_risk: { current: 19, previous: 16, critical_production: 6 },
  events_24h: { current: 62, previous: 10 },
  mttd_7d: { current_seconds: 3960, previous_seconds: 5068 },
  mttr_7d: { current_seconds: 52431, previous_seconds: null },
  active_threat_campaigns_7d: { current: 7, previous: 4 },
};

// Mutable fakes so each test can choose how dependencies behave
const fakes = {
  dbUp: true,
  goUp: true,
  summaryError: null as Error | null,
};

const pool = {
  query: async () => {
    if (!fakes.dbUp) throw new Error('connection refused');
    return { rows: [] };
  },
} as unknown as Pool;

const go: GoClient = {
  getSummary: async () => {
    if (fakes.summaryError) throw fakes.summaryError;
    return summary;
  },
  ping: async () => fakes.goUp,
};

let server: Server;
let baseUrl: string;

before(async () => {
  server = createApp({ pool, go }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

function reset() {
  fakes.dbUp = true;
  fakes.goUp = true;
  fakes.summaryError = null;
}

async function get(path: string) {
  const res = await fetch(`${baseUrl}${path}`);
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

describe('GET /api/analytics/summary', () => {
  it('returns the Go summary in a data envelope', async () => {
    reset();
    const { status, body } = await get('/api/analytics/summary');
    assert.equal(status, 200);
    assert.deepEqual(body, { data: summary });
  });

  it('maps Go client errors to their HTTP status', async () => {
    reset();
    fakes.summaryError = new HttpError(503, 'Analytics service unavailable');
    const { status, body } = await get('/api/analytics/summary');
    assert.equal(status, 503);
    assert.deepEqual(body, { error: 'Analytics service unavailable' });
  });

  it('hides unexpected errors behind a generic 500', async () => {
    reset();
    fakes.summaryError = new Error('something internal');
    const { status, body } = await get('/api/analytics/summary');
    assert.equal(status, 500);
    assert.deepEqual(body, { error: 'Internal server error' });
  });
});

describe('GET /api/health', () => {
  it('is healthy when all dependencies are up', async () => {
    reset();
    const { status, body } = await get('/api/health');
    assert.equal(status, 200);
    assert.equal(body.status, 'healthy');
    assert.deepEqual(body.dependencies, { database: 'up', go_service: 'up' });
  });

  it('is degraded, but still 200, when Go is down', async () => {
    reset();
    fakes.goUp = false;
    const { status, body } = await get('/api/health');
    assert.equal(status, 200);
    assert.equal(body.status, 'degraded');
    assert.deepEqual(body.dependencies, { database: 'up', go_service: 'down' });
  });

  it('is degraded when the database is down', async () => {
    reset();
    fakes.dbUp = false;
    const { body } = await get('/api/health');
    assert.equal(body.status, 'degraded');
    assert.deepEqual(body.dependencies, { database: 'down', go_service: 'up' });
  });
});

describe('unknown routes', () => {
  it('return a JSON 404', async () => {
    const { status, body } = await get('/api/nope');
    assert.equal(status, 404);
    assert.deepEqual(body, { error: 'Not found' });
  });
});
