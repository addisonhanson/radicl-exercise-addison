import express, { type Express } from 'express';
import cors from 'cors';
import type { Pool } from 'pg';
import type { GoClient } from './clients/goClient.js';
import { errorHandler, notFoundHandler } from './http/errors.js';
import { analyticsRouter } from './routes/analytics.js';
import { healthRouter } from './routes/health.js';
import { placeholderRouter } from './routes/placeholder.js';

export interface AppDependencies {
  pool: Pool;
  go: GoClient;
}

// Builds the Express app from its dependencies so tests can inject fakes.
export function createApp({ pool, go }: AppDependencies): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/health', healthRouter(pool, go));
  app.use('/api/analytics', analyticsRouter(go));
  app.use('/api/node', placeholderRouter(pool));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
