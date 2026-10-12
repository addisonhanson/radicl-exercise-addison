// Mirrors the response types in backend/go-service/internal/analytics.
// Durations are in seconds and null when there is no data in the window.

export interface CountComparison {
  current: number;
  previous: number;
}

export interface DurationComparison {
  current_seconds: number | null;
  previous_seconds: number | null;
}

export interface OpenIncidents extends CountComparison {
  critical: number;
  unacknowledged: number;
}

export interface AssetsAtRisk extends CountComparison {
  critical_production: number;
}

export interface AnalyticsSummary {
  generated_at: string;
  open_incidents: OpenIncidents;
  assets_at_risk: AssetsAtRisk;
  events_24h: CountComparison;
  mttd_7d: DurationComparison;
  mttr_7d: DurationComparison;
  active_threat_campaigns_7d: CountComparison;
}

// Daily event counts by severity. Each bucket covers (start, end], a rolling
// 24 hour window, oldest first.
export interface TimelineBucket {
  start: string;
  end: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface Timeline {
  generated_at: string;
  days: number;
  buckets: TimelineBucket[];
}
