package analytics

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gorilla/mux"
)

type fakeQuerier struct {
	summary Summary
	err     error
	gotNow  time.Time
	gotDays int // 0 if no windowed query was made
}

func (f *fakeQuerier) Summary(_ context.Context, now time.Time) (Summary, error) {
	f.gotNow = now
	return f.summary, f.err
}

func (f *fakeQuerier) Timeline(_ context.Context, now time.Time, days int) (Timeline, error) {
	f.gotNow, f.gotDays = now, days
	return Timeline{GeneratedAt: now, Days: days}, f.err
}

// OpenEvents is stubbed until open events handler tests are added.
func (f *fakeQuerier) OpenEvents(_ context.Context, now time.Time) (OpenEvents, error) {
	f.gotNow = now
	return OpenEvents{GeneratedAt: now}, f.err
}

// AssetsAtRisk is stubbed until assets handler tests are added.
func (f *fakeQuerier) AssetsAtRisk(_ context.Context, now time.Time) (AssetsAtRiskList, error) {
	f.gotNow = now
	return AssetsAtRiskList{GeneratedAt: now}, f.err
}

func (f *fakeQuerier) ThreatOrigins(_ context.Context, now time.Time, days int) (ThreatOrigins, error) {
	f.gotNow, f.gotDays = now, days
	return ThreatOrigins{GeneratedAt: now, Days: days}, f.err
}

func newTestRouter(q Querier, now time.Time) *mux.Router {
	h := NewHandler(q)
	h.now = func() time.Time { return now }
	r := mux.NewRouter()
	h.RegisterRoutes(r)
	return r
}

func ptr(f float64) *float64 { return &f }

func TestSummaryReturnsData(t *testing.T) {
	now := time.Date(2026, 10, 12, 20, 0, 0, 0, time.UTC)
	fake := &fakeQuerier{summary: Summary{
		GeneratedAt:       now,
		OpenIncidents:     OpenIncidents{CountComparison: CountComparison{Current: 53, Previous: 40}, Critical: 6, Unacknowledged: 9},
		MeanTimeToResolve: DurationComparison{CurrentSeconds: ptr(3600), PreviousSeconds: nil},
	}}

	rec := httptest.NewRecorder()
	newTestRouter(fake, now).ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/analytics/summary", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("Content-Type = %q, want application/json", ct)
	}
	if !fake.gotNow.Equal(now) {
		t.Errorf("store called with now = %v, want %v", fake.gotNow, now)
	}

	var body struct {
		Data map[string]json.RawMessage `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode body: %v", err)
	}

	var open struct {
		Current        int `json:"current"`
		Previous       int `json:"previous"`
		Critical       int `json:"critical"`
		Unacknowledged int `json:"unacknowledged"`
	}
	if err := json.Unmarshal(body.Data["open_incidents"], &open); err != nil {
		t.Fatalf("decode open_incidents: %v", err)
	}
	if open.Current != 53 || open.Previous != 40 || open.Critical != 6 || open.Unacknowledged != 9 {
		t.Errorf("open_incidents = %+v", open)
	}

	// Missing durations must serialize as null, not 0
	if got := string(body.Data["mttr_7d"]); got != `{"current_seconds":3600,"previous_seconds":null}` {
		t.Errorf("mttr_7d = %s", got)
	}
}

func TestSummaryStoreError(t *testing.T) {
	fake := &fakeQuerier{err: errors.New("connection refused")}

	rec := httptest.NewRecorder()
	newTestRouter(fake, time.Now()).ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/analytics/summary", nil))

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", rec.Code)
	}
	var body map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	// Internal error details must not leak to clients
	if body["error"] != "Failed to load analytics summary" {
		t.Errorf("error = %q", body["error"])
	}
}

func TestSummaryRejectsWrongMethod(t *testing.T) {
	rec := httptest.NewRecorder()
	newTestRouter(&fakeQuerier{}, time.Now()).ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/api/analytics/summary", nil))

	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("status = %d, want 405", rec.Code)
	}
}

// Both windowed endpoints share parseDays: a missing ?days= uses the
// default, and anything outside 1-90 is a 400 that never reaches the store.
func TestWindowedEndpointsDaysParam(t *testing.T) {
	cases := []struct {
		query      string
		wantStatus int
		wantDays   int
	}{
		{"", http.StatusOK, defaultDays},
		{"?days=7", http.StatusOK, 7},
		{"?days=90", http.StatusOK, 90},
		{"?days=0", http.StatusBadRequest, 0},
		{"?days=91", http.StatusBadRequest, 0},
		{"?days=abc", http.StatusBadRequest, 0},
	}

	for _, path := range []string{"/api/analytics/timeline", "/api/analytics/threat-origins"} {
		for _, tc := range cases {
			t.Run(path+tc.query, func(t *testing.T) {
				fake := &fakeQuerier{}
				rec := httptest.NewRecorder()
				newTestRouter(fake, time.Now()).ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path+tc.query, nil))

				if rec.Code != tc.wantStatus {
					t.Fatalf("status = %d, want %d", rec.Code, tc.wantStatus)
				}
				if fake.gotDays != tc.wantDays {
					t.Errorf("store called with days = %d, want %d", fake.gotDays, tc.wantDays)
				}
			})
		}
	}
}
