package analytics

import (
	"context"
	"fmt"
	"time"
)

// OpenEvents lists every open event (Active or Investigating) along with
// counts by severity, for the dashboard's severity donut and its table.
// The total matches the summary's open_incidents.current.
type OpenEvents struct {
	GeneratedAt time.Time       `json:"generated_at"`
	Total       int             `json:"total"`
	BySeverity  SeverityCounts  `json:"by_severity"`
	Events      []OpenEventItem `json:"events"`
}

// SeverityCounts is a count per severity level.
type SeverityCounts struct {
	Critical int `json:"critical"`
	High     int `json:"high"`
	Medium   int `json:"medium"`
	Low      int `json:"low"`
}

// OpenEventItem is one open event with its asset and known threat, if any.
type OpenEventItem struct {
	EventID       int       `json:"event_id"`
	DetectedAt    time.Time `json:"detected_at"`
	Severity      string    `json:"severity"`
	EventType     string    `json:"event_type"`
	Status        string    `json:"status"`
	ThreatScore   int       `json:"threat_score"`
	Hostname      string    `json:"hostname"`
	Environment   string    `json:"environment"`
	SourceIP      *string   `json:"source_ip"`
	SourceCountry *string   `json:"source_country"`
	ThreatName    *string   `json:"threat_name"`
}

// openEventsQuery lists open events, most severe first (severity_level enum
// order is Critical..Low), newest first within a severity. host() renders
// the INET source address without its /32 mask.
const openEventsQuery = `
SELECT
    e.event_id,
    e.detected_at,
    e.severity::text,
    e.event_type::text,
    e.status::text,
    e.threat_score,
    a.hostname,
    a.environment::text,
    host(e.source_ip),
    e.source_country,
    t.threat_name
FROM security_events e
JOIN assets a ON a.asset_id = e.asset_id
LEFT JOIN threat_intelligence t ON t.threat_id = e.threat_id
WHERE e.status IN ('Active', 'Investigating')
ORDER BY e.severity, e.detected_at DESC
`

// OpenEvents returns all open events and their severity counts. Counts are
// tallied from the same rows so the donut and table can never disagree.
func (s *Store) OpenEvents(ctx context.Context, now time.Time) (OpenEvents, error) {
	rows, err := s.pool.Query(ctx, openEventsQuery)
	if err != nil {
		return OpenEvents{}, fmt.Errorf("query open events: %w", err)
	}
	defer rows.Close()

	result := OpenEvents{GeneratedAt: now, Events: []OpenEventItem{}}
	for rows.Next() {
		var ev OpenEventItem
		if err := rows.Scan(
			&ev.EventID, &ev.DetectedAt, &ev.Severity, &ev.EventType, &ev.Status, &ev.ThreatScore,
			&ev.Hostname, &ev.Environment, &ev.SourceIP, &ev.SourceCountry, &ev.ThreatName,
		); err != nil {
			return OpenEvents{}, fmt.Errorf("scan open event: %w", err)
		}

		switch ev.Severity {
		case "Critical":
			result.BySeverity.Critical++
		case "High":
			result.BySeverity.High++
		case "Medium":
			result.BySeverity.Medium++
		case "Low":
			result.BySeverity.Low++
		}
		result.Events = append(result.Events, ev)
	}
	if err := rows.Err(); err != nil {
		return OpenEvents{}, fmt.Errorf("read open events: %w", err)
	}

	result.Total = len(result.Events)
	return result, nil
}
