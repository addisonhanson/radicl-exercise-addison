import { Router } from 'express';
import type { Pool } from 'pg';

interface DataItem {
  id: number;
  name: string;
  type: string;
  description: string | null;
  created_at: Date;
}

// Starter endpoints still used by the original frontend. To be removed once
// the dashboard replaces them.
export function placeholderRouter(pool: Pool): Router {
  const router = Router();

  router.get('/hello', (_req, res) => {
    res.json({
      message: 'Hello from Node.js service!',
      version: '1.0.0',
    });
  });

  router.get('/data', async (_req, res) => {
    const result = await pool.query<DataItem>(
      "SELECT id, name, type, description, created_at FROM items WHERE type = 'node' ORDER BY id",
    );
    res.json({ data: result.rows });
  });

  return router;
}
