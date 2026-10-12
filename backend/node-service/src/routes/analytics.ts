import { Router } from 'express';
import type { GoClient } from '../clients/goClient.js';

// Analytics are computed by the Go service; Node exposes them to the
// frontend under the same paths so the browser only talks to one API.
export function analyticsRouter(go: GoClient): Router {
  const router = Router();

  router.get('/summary', async (_req, res) => {
    const data = await go.getSummary();
    res.json({ data });
  });

  router.get('/timeline', async (req, res) => {
    const { days } = req.query;
    const data = await go.getTimeline(typeof days === 'string' ? days : undefined);
    res.json({ data });
  });

  router.get('/open-events', async (_req, res) => {
    const data = await go.getOpenEvents();
    res.json({ data });
  });

  return router;
}
