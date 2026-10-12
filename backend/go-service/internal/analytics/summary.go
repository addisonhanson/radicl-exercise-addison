package analytics

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Summary holds the headline KPI metrics for the dashboard.
//
// Each comparison pairs the current value with the same metric for the
// preceding period, so clients can render a trend. Durations are in seconds
// and are null when there is no data in the window.
type Summary struct {
	GeneratedAt           time.Time          `json:"generated_at"`
	OpenIncidents         OpenIncidents      `json:"open_incidents"`
	AssetsAtRisk          AssetsAtRisk       `json:"assets_at_risk"`
	EventsLast24h         CountComparison    `json:"events_24h"`
	MeanTimeToDetect      DurationComparison `json:"mttd_7d"`
	MeanTimeToResolve     DurationComparison `json:"mttr_7d"`
	ActiveThreatCampaigns CountComparison    `json:"active_threat_campaigns_7d"`
}

// OpenIncidents counts events that are Active or Investigating, compared
// with how many were open 24 hours earlier.
type OpenIncidents struct {
	CountComparison
	Critical       int `json:"critical"`
	Unacknowledged int `json:"unacknowledged"`
}

// AssetsAtRisk counts distinct assets with at least one open event,
// compared with 24 hours earlier.
type AssetsAtRisk struct {
	CountComparison
	CriticalProduction int `json:"critical_production"`
}

// CountComparison is a count for the current period and the one before it.
type CountComparison struct {
	Current  int `json:"current"`
	Previous int `json:"previous"`
}

// DurationComparison is an average duration in seconds for the current
// period and the one before it.
type DurationComparison struct {
	CurrentSeconds  *float64 `json:"current_seconds"`
	PreviousSeconds *float64 `json:"previous_seconds"`
}

// Store runs analytics queries against Postgres.
type Store struct {
	pool *pgxpool.Pool
}

// NewStore returns a Store backed by the given connection pool.
func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

// summaryQuery computes every KPI in a single pass over security_events.
//
// $1 is the reference time ("now"), passed in rather than using NOW() so
// results are consistent within a request and testable.
//
// "Open at time T" is reconstructed from lifecycle timestamps: detected at
// or before T and not resolved until after T. This lets us compare current
// open counts with 24 hours ago without storing snapshots.
//
// MTTR only counts status 'Resolved', so false positives being closed
// quickly don't make response times look better than they are.
const summaryQuery = `
WITH params AS (
    SELECT $1::timestamptz AS now,
           $1::timestamptz - INTERVAL '24 hours' AS day_ago,
           $1::timestamptz - INTERVAL '48 hours' AS two_days_ago,
           $1::timestamptz - INTERVAL '7 days'  AS week_ago,
           $1::timestamptz - INTERVAL '14 days' AS two_weeks_ago
),
flagged AS (
    SELECT e.*,
           a.criticality AS asset_criticality,
           a.environment AS asset_environment,
           e.status IN ('Active', 'Investigating') AS is_open,
           (e.detected_at <= p.day_ago AND (e.resolved_at IS NULL OR e.resolved_at > p.day_ago)) AS was_open_day_ago
    FROM security_events e
    JOIN assets a USING (asset_id)
    CROSS JOIN params p
)
SELECT
    -- Open incidents
    count(*) FILTER (WHERE is_open),
    count(*) FILTER (WHERE was_open_day_ago),
    count(*) FILTER (WHERE is_open AND severity = 'Critical'),
    count(*) FILTER (WHERE status = 'Active'),

    -- Assets at risk
    count(DISTINCT asset_id) FILTER (WHERE is_open),
    count(DISTINCT asset_id) FILTER (WHERE was_open_day_ago),
    count(DISTINCT asset_id) FILTER (WHERE is_open AND asset_criticality = 'Critical' AND asset_environment = 'Production'),

    -- Events in the last 24h vs the 24h before
    count(*) FILTER (WHERE occurred_at > p.day_ago AND occurred_at <= p.now),
    count(*) FILTER (WHERE occurred_at > p.two_days_ago AND occurred_at <= p.day_ago),

    -- MTTD over events detected in the window
    EXTRACT(EPOCH FROM avg(detected_at - occurred_at)
        FILTER (WHERE detected_at > p.week_ago AND detected_at <= p.now))::float8,
    EXTRACT(EPOCH FROM avg(detected_at - occurred_at)
        FILTER (WHERE detected_at > p.two_weeks_ago AND detected_at <= p.week_ago))::float8,

    -- MTTR over events resolved in the window
    EXTRACT(EPOCH FROM avg(resolved_at - detected_at)
        FILTER (WHERE status = 'Resolved' AND resolved_at > p.week_ago AND resolved_at <= p.now))::float8,
    EXTRACT(EPOCH FROM avg(resolved_at - detected_at)
        FILTER (WHERE status = 'Resolved' AND resolved_at > p.two_weeks_ago AND resolved_at <= p.week_ago))::float8,

    -- Distinct known threats with activity in the window
    count(DISTINCT threat_id) FILTER (WHERE occurred_at > p.week_ago AND occurred_at <= p.now),
    count(DISTINCT threat_id) FILTER (WHERE occurred_at > p.two_weeks_ago AND occurred_at <= p.week_ago)
FROM flagged
CROSS JOIN params p
`

// Summary returns the KPI summary as of the given time.
func (s *Store) Summary(ctx context.Context, now time.Time) (Summary, error) {
	sum := Summary{GeneratedAt: now}

	err := s.pool.QueryRow(ctx, summaryQuery, now).Scan(
		&sum.OpenIncidents.Current,
		&sum.OpenIncidents.Previous,
		&sum.OpenIncidents.Critical,
		&sum.OpenIncidents.Unacknowledged,

		&sum.AssetsAtRisk.Current,
		&sum.AssetsAtRisk.Previous,
		&sum.AssetsAtRisk.CriticalProduction,

		&sum.EventsLast24h.Current,
		&sum.EventsLast24h.Previous,

		&sum.MeanTimeToDetect.CurrentSeconds,
		&sum.MeanTimeToDetect.PreviousSeconds,

		&sum.MeanTimeToResolve.CurrentSeconds,
		&sum.MeanTimeToResolve.PreviousSeconds,

		&sum.ActiveThreatCampaigns.Current,
		&sum.ActiveThreatCampaigns.Previous,
	)
	if err != nil {
		return Summary{}, fmt.Errorf("query summary: %w", err)
	}

	return sum, nil
}
