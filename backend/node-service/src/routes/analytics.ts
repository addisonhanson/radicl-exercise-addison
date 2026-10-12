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
    const data = await go.getTimeline(daysParam(req.query.days));
    res.json({ data });
  });

  router.get('/open-events', async (_req, res) => {
    const data = await go.getOpenEvents();
    res.json({ data });
  });

  router.get('/assets-at-risk', async (_req, res) => {
    const data = await go.getAssetsAtRisk();
    res.json({ data });
  });

  router.get('/threat-origins', async (req, res) => {
    const data = await go.getThreatOrigins(daysParam(req.query.days));
    res.json({ data });
  });

  return router;
}

// Only a single string ?days= is forwarded; repeated or nested values are
// dropped and Go applies its default.
function daysParam(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
