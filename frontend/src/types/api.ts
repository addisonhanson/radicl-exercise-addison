export type DependencyStatus = 'up' | 'down'

// Response from the Node gateway's GET /api/health
export interface HealthStatus {
  status: 'healthy' | 'degraded'
  service: string
  timestamp: string
  dependencies: {
    database: DependencyStatus
    go_service: DependencyStatus
  }
}

// Response types for GET /api/analytics/summary, mirroring
// backend/node-service/src/types/analytics.ts. Durations are in seconds and
// null when there is no data in the window.
export interface CountComparison {
  current: number
  previous: number
}

export interface DurationComparison {
  current_seconds: number | null
  previous_seconds: number | null
}

export interface OpenIncidents extends CountComparison {
  critical: number
  unacknowledged: number
}

export interface AssetsAtRisk extends CountComparison {
  critical_production: number
}

export interface AnalyticsSummary {
  generated_at: string
  open_incidents: OpenIncidents
  assets_at_risk: AssetsAtRisk
  events_24h: CountComparison
  mttd_7d: DurationComparison
  mttr_7d: DurationComparison
  active_threat_campaigns_7d: CountComparison
}

// Response for GET /api/analytics/timeline. Each bucket counts events that
// occurred in (start, end], a rolling 24 hour window, oldest first.
// Recharts needs a type alias rather than an interface for chart data.
export type TimelineBucket = {
  start: string
  end: string
  critical: number
  high: number
  medium: number
  low: number
  total: number
}

export interface Timeline {
  generated_at: string
  days: number
  buckets: TimelineBucket[]
}

// Response for GET /api/analytics/open-events: every open event (Active or
// Investigating) with counts by severity. total matches open_incidents.current.
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low'

export interface SeverityCounts {
  critical: number
  high: number
  medium: number
  low: number
}

export type OpenEventItem = {
  event_id: number
  detected_at: string
  severity: Severity
  event_type: string
  status: 'Active' | 'Investigating'
  threat_score: number
  hostname: string
  environment: string
  source_ip: string | null
  source_country: string | null
  threat_name: string | null
}

export interface OpenEvents {
  generated_at: string
  total: number
  by_severity: SeverityCounts
  events: OpenEventItem[]
}

// Response for GET /api/analytics/assets-at-risk: every asset with at least
// one open event, riskiest first. risk_score (0-100) is the highest open
// threat score weighted by asset criticality.
export type Environment = 'Production' | 'Staging' | 'Development'

export type AssetAtRisk = {
  asset_id: number
  hostname: string
  asset_type: string
  environment: Environment
  criticality: Severity
  owner_team: string | null
  open_events: number
  critical_events: number
  top_severity: Severity
  max_threat_score: number
  risk_score: number
  last_detected_at: string
}

export interface AssetsAtRiskList {
  generated_at: string
  assets: AssetAtRisk[]
}

// Response for GET /api/analytics/threat-origins: event counts by ISO 3166-1
// alpha-2 source country over the last `days` days, busiest first.
export type CountryOrigin = {
  country: string
  events: number
  critical_events: number
  distinct_sources: number
}

export interface ThreatOrigins {
  generated_at: string
  days: number
  total: number
  unknown: number
  countries: CountryOrigin[]
}
