package analytics

import (
	"context"
	"fmt"
	"time"
)

// Timeline is the event count per day, split by severity, for the
// dashboard's event timeline chart.
type Timeline struct {
	GeneratedAt time.Time        `json:"generated_at"`
	Days        int              `json:"days"`
	Buckets     []TimelineBucket `json:"buckets"`
}

// TimelineBucket counts events that occurred in (Start, End].
type TimelineBucket struct {
	Start    time.Time `json:"start"`
	End      time.Time `json:"end"`
	Critical int       `json:"critical"`
	High     int       `json:"high"`
	Medium   int       `json:"medium"`
	Low      int       `json:"low"`
	Total    int       `json:"total"`
}

// timelineQuery buckets events into consecutive 24 hour windows ending at
// $1 ("now"), $2 windows in total, oldest first.
//
// Rolling windows rather than calendar days keep the latest bucket from
// looking like a dip just because the day isn't over, and make it match the
// summary's events_24h. generate_series plus a LEFT JOIN returns empty
// windows as zeros so the chart has no gaps.
const timelineQuery = `
WITH buckets AS (
    SELECT gs - INTERVAL '1 day' AS bucket_start, gs AS bucket_end
    FROM generate_series(
        $1::timestamptz - make_interval(days => $2::int - 1),
        $1::timestamptz,
        INTERVAL '1 day'
    ) AS gs
)
SELECT
    b.bucket_start,
    b.bucket_end,
    count(e.event_id) FILTER (WHERE e.severity = 'Critical'),
    count(e.event_id) FILTER (WHERE e.severity = 'High'),
    count(e.event_id) FILTER (WHERE e.severity = 'Medium'),
    count(e.event_id) FILTER (WHERE e.severity = 'Low'),
    count(e.event_id)
FROM buckets b
LEFT JOIN security_events e
    ON e.occurred_at > b.bucket_start AND e.occurred_at <= b.bucket_end
GROUP BY b.bucket_start, b.bucket_end
ORDER BY b.bucket_start
`

// Timeline returns daily event counts by severity for the given number of
// days up to now.
func (s *Store) Timeline(ctx context.Context, now time.Time, days int) (Timeline, error) {
	rows, err := s.pool.Query(ctx, timelineQuery, now, days)
	if err != nil {
		return Timeline{}, fmt.Errorf("query timeline: %w", err)
	}
	defer rows.Close()

	buckets := make([]TimelineBucket, 0, days)
	for rows.Next() {
		var b TimelineBucket
		if err := rows.Scan(&b.Start, &b.End, &b.Critical, &b.High, &b.Medium, &b.Low, &b.Total); err != nil {
			return Timeline{}, fmt.Errorf("scan timeline bucket: %w", err)
		}
		buckets = append(buckets, b)
	}
	if err := rows.Err(); err != nil {
		return Timeline{}, fmt.Errorf("read timeline: %w", err)
	}

	return Timeline{GeneratedAt: now, Days: days, Buckets: buckets}, nil
}
