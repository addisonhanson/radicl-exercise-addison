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

// Every open event (Active or Investigating) with counts by severity.
// total matches the summary's open_incidents.current.
export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface OpenEventItem {
  event_id: number;
  detected_at: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  event_type: string;
  status: 'Active' | 'Investigating';
  threat_score: number;
  hostname: string;
  environment: string;
  source_ip: string | null;
  source_country: string | null;
  threat_name: string | null;
}

export interface OpenEvents {
  generated_at: string;
  total: number;
  by_severity: SeverityCounts;
  events: OpenEventItem[];
}
