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
