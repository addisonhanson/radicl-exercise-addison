import { HttpError } from '../http/errors.js';
import type {
  AnalyticsSummary,
  AssetsAtRiskList,
  OpenEvents,
  ThreatOrigins,
  Timeline,
} from '../types/analytics.js';

// Typed client for the Go analytics service. Failures are mapped to
// HttpErrors so routes can let them propagate to the error handler:
//   Go unreachable      -> 503
//   Go too slow         -> 504
//   Go 4xx              -> same status and message (bad client input)
//   Go 5xx / bad body   -> 502
export interface GoClient {
  getSummary(): Promise<AnalyticsSummary>;
  // days params are passed through as-is; Go validates them and its 400 is relayed.
  getTimeline(days?: string): Promise<Timeline>;
  getOpenEvents(): Promise<OpenEvents>;
  getAssetsAtRisk(): Promise<AssetsAtRiskList>;
  getThreatOrigins(days?: string): Promise<ThreatOrigins>;
  ping(): Promise<boolean>;
}

interface GoClientOptions {
  baseUrl: string;
  timeoutMs: number;
}

function daysQuery(days: string | undefined): string {
  return days === undefined ? '' : `?${new URLSearchParams({ days })}`;
}

export function createGoClient({ baseUrl, timeoutMs }: GoClientOptions): GoClient {
  async function request<T>(path: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(timeoutMs) });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        throw new HttpError(504, 'Analytics service timed out');
      }
      throw new HttpError(503, 'Analytics service unavailable');
    }

    const body = (await response.json().catch(() => null)) as { data?: T; error?: string } | null;

    if (!response.ok) {
      if (response.status >= 400 && response.status < 500) {
        throw new HttpError(response.status, body?.error ?? 'Invalid analytics request');
      }
      throw new HttpError(502, 'Analytics service error');
    }
    if (!body || body.data === undefined) {
      throw new HttpError(502, 'Invalid response from analytics service');
    }

    return body.data;
  }

  return {
    getSummary: () => request<AnalyticsSummary>('/api/analytics/summary'),

    getTimeline: (days) => request<Timeline>(`/api/analytics/timeline${daysQuery(days)}`),

    getOpenEvents: () => request<OpenEvents>('/api/analytics/open-events'),

    getAssetsAtRisk: () => request<AssetsAtRiskList>('/api/analytics/assets-at-risk'),

    getThreatOrigins: (days) =>
      request<ThreatOrigins>(`/api/analytics/threat-origins${daysQuery(days)}`),

    async ping() {
      try {
        const response = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(timeoutMs) });
        return response.ok;
      } catch {
        return false;
      }
    },
  };
}
