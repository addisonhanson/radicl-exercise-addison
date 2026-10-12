package analytics

import (
	"context"
	"fmt"
	"time"
)

// ThreatOrigins counts events by attacker source country over the last
// Days days, for the threat map. Events with no known country are counted
// in Unknown rather than dropped, so Total still reconciles.
type ThreatOrigins struct {
	GeneratedAt time.Time       `json:"generated_at"`
	Days        int             `json:"days"`
	Total       int             `json:"total"`
	Unknown     int             `json:"unknown"`
	Countries   []CountryOrigin `json:"countries"`
}

// CountryOrigin is the activity from one ISO 3166-1 alpha-2 country.
type CountryOrigin struct {
	Country         string `json:"country"`
	Events          int    `json:"events"`
	CriticalEvents  int    `json:"critical_events"`
	DistinctSources int    `json:"distinct_sources"`
}

// threatOriginsQuery groups events that occurred in ($1 - $2 days, $1] by
// source country, busiest first. The NULL group carries the unknown count.
const threatOriginsQuery = `
SELECT
    source_country,
    count(*),
    count(*) FILTER (WHERE severity = 'Critical'),
    count(DISTINCT source_ip)
FROM security_events
WHERE occurred_at > $1::timestamptz - make_interval(days => $2::int)
  AND occurred_at <= $1::timestamptz
GROUP BY source_country
ORDER BY count(*) DESC, source_country
`

// ThreatOrigins returns event counts by source country for the given number
// of days up to now.
func (s *Store) ThreatOrigins(ctx context.Context, now time.Time, days int) (ThreatOrigins, error) {
	rows, err := s.pool.Query(ctx, threatOriginsQuery, now, days)
	if err != nil {
		return ThreatOrigins{}, fmt.Errorf("query threat origins: %w", err)
	}
	defer rows.Close()

	result := ThreatOrigins{GeneratedAt: now, Days: days, Countries: []CountryOrigin{}}
	for rows.Next() {
		var country *string
		var c CountryOrigin
		if err := rows.Scan(&country, &c.Events, &c.CriticalEvents, &c.DistinctSources); err != nil {
			return ThreatOrigins{}, fmt.Errorf("scan threat origin: %w", err)
		}
		result.Total += c.Events
		if country == nil {
			result.Unknown = c.Events
			continue
		}
		c.Country = *country
		result.Countries = append(result.Countries, c)
	}
	if err := rows.Err(); err != nil {
		return ThreatOrigins{}, fmt.Errorf("read threat origins: %w", err)
	}

	return result, nil
}
