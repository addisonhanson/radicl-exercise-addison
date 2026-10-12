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

// Every asset with at least one open event, riskiest first. risk_score
// (0-100) is the highest open threat score weighted by asset criticality.
export interface AssetAtRisk {
  asset_id: number;
  hostname: string;
  asset_type: string;
  environment: 'Production' | 'Staging' | 'Development';
  criticality: 'Critical' | 'High' | 'Medium' | 'Low';
  owner_team: string | null;
  open_events: number;
  critical_events: number;
  top_severity: 'Critical' | 'High' | 'Medium' | 'Low';
  max_threat_score: number;
  risk_score: number;
  last_detected_at: string;
}

export interface AssetsAtRiskList {
  generated_at: string;
  assets: AssetAtRisk[];
}

// Event counts by ISO 3166-1 alpha-2 source country over the last `days`
// days, busiest first. Events with no known country are counted in unknown.
export interface CountryOrigin {
  country: string;
  events: number;
  critical_events: number;
  distinct_sources: number;
}

export interface ThreatOrigins {
  generated_at: string;
  days: number;
  total: number;
  unknown: number;
  countries: CountryOrigin[];
}
