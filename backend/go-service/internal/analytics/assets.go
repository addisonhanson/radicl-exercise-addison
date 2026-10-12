package analytics

import (
	"context"
	"fmt"
	"time"
)

// AssetsAtRiskList is every asset with at least one open event, riskiest
// first. Its length matches the summary's assets_at_risk.current.
type AssetsAtRiskList struct {
	GeneratedAt time.Time     `json:"generated_at"`
	Assets      []AssetAtRisk `json:"assets"`
}

// AssetAtRisk is one asset and a rollup of its open events.
//
// RiskScore (0-100) is the highest threat score among its open events,
// weighted by how critical the asset is, so a moderate threat to a critical
// database outranks the same threat to a low-value workstation.
type AssetAtRisk struct {
	AssetID        int       `json:"asset_id"`
	Hostname       string    `json:"hostname"`
	AssetType      string    `json:"asset_type"`
	Environment    string    `json:"environment"`
	Criticality    string    `json:"criticality"`
	OwnerTeam      *string   `json:"owner_team"`
	OpenEvents     int       `json:"open_events"`
	CriticalEvents int       `json:"critical_events"`
	TopSeverity    string    `json:"top_severity"`
	MaxThreatScore int       `json:"max_threat_score"`
	RiskScore      int       `json:"risk_score"`
	LastDetectedAt time.Time `json:"last_detected_at"`
}

// assetsAtRiskQuery rolls up open events per asset. min() over the
// severity_level enum picks the most severe level, since Critical is
// declared first.
const assetsAtRiskQuery = `
SELECT
    a.asset_id,
    a.hostname,
    a.asset_type::text,
    a.environment::text,
    a.criticality::text,
    a.owner_team,
    count(*),
    count(*) FILTER (WHERE e.severity = 'Critical'),
    min(e.severity)::text,
    max(e.threat_score),
    round(max(e.threat_score) * CASE a.criticality
        WHEN 'Critical' THEN 1.0
        WHEN 'High'     THEN 0.8
        WHEN 'Medium'   THEN 0.6
        ELSE 0.4
    END)::int AS risk_score,
    max(e.detected_at)
FROM assets a
JOIN security_events e ON e.asset_id = a.asset_id
WHERE e.status IN ('Active', 'Investigating')
GROUP BY a.asset_id
ORDER BY risk_score DESC, count(*) DESC, a.hostname
`

// AssetsAtRisk returns every asset with open events, riskiest first.
func (s *Store) AssetsAtRisk(ctx context.Context, now time.Time) (AssetsAtRiskList, error) {
	rows, err := s.pool.Query(ctx, assetsAtRiskQuery)
	if err != nil {
		return AssetsAtRiskList{}, fmt.Errorf("query assets at risk: %w", err)
	}
	defer rows.Close()

	result := AssetsAtRiskList{GeneratedAt: now, Assets: []AssetAtRisk{}}
	for rows.Next() {
		var a AssetAtRisk
		if err := rows.Scan(
			&a.AssetID, &a.Hostname, &a.AssetType, &a.Environment, &a.Criticality, &a.OwnerTeam,
			&a.OpenEvents, &a.CriticalEvents, &a.TopSeverity, &a.MaxThreatScore, &a.RiskScore,
			&a.LastDetectedAt,
		); err != nil {
			return AssetsAtRiskList{}, fmt.Errorf("scan asset at risk: %w", err)
		}
		result.Assets = append(result.Assets, a)
	}
	if err := rows.Err(); err != nil {
		return AssetsAtRiskList{}, fmt.Errorf("read assets at risk: %w", err)
	}

	return result, nil
}
