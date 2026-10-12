import { Router } from 'express';
import type { Pool } from 'pg';
import type { GoClient } from '../clients/goClient.js';

type DependencyStatus = 'up' | 'down';

async function checkDatabase(pool: Pool): Promise<DependencyStatus> {
  try {
    await pool.query('SELECT 1');
    return 'up';
  } catch {
    return 'down';
  }
}

// Reports this service plus its dependencies. Always 200 while Node itself
// is serving; `status` is 'degraded' when a dependency is down so the UI
// can show partial availability.
export function healthRouter(pool: Pool, go: GoClient): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const [database, goService] = await Promise.all([
      checkDatabase(pool),
      go.ping().then((ok): DependencyStatus => (ok ? 'up' : 'down')),
    ]);

    res.json({
      status: database === 'up' && goService === 'up' ? 'healthy' : 'degraded',
      service: 'node-service',
      timestamp: new Date().toISOString(),
      dependencies: {
        database,
        go_service: goService,
      },
    });
  });

  return router;
}
