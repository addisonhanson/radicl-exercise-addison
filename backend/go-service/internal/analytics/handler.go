// Package analytics serves aggregated security metrics for the dashboard.
package analytics

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/radicl/go-service/internal/httpx"
)

// queryTimeout bounds how long a single analytics query may run.
const queryTimeout = 5 * time.Second

// Bounds for the ?days= parameter on windowed endpoints.
const (
	defaultDays = 30
	maxDays     = 90
)

// Querier is the data access the handlers need. *Store implements it; tests
// substitute a fake.
type Querier interface {
	Summary(ctx context.Context, now time.Time) (Summary, error)
	Timeline(ctx context.Context, now time.Time, days int) (Timeline, error)
	OpenEvents(ctx context.Context, now time.Time) (OpenEvents, error)
	AssetsAtRisk(ctx context.Context, now time.Time) (AssetsAtRiskList, error)
	ThreatOrigins(ctx context.Context, now time.Time, days int) (ThreatOrigins, error)
}

// Handler serves the /api/analytics endpoints.
type Handler struct {
	store Querier
	now   func() time.Time
}

// NewHandler returns a Handler backed by store, using the wall clock.
func NewHandler(store Querier) *Handler {
	return &Handler{store: store, now: time.Now}
}

// RegisterRoutes mounts the analytics endpoints on r.
func (h *Handler) RegisterRoutes(r *mux.Router) {
	// Full paths rather than a PathPrefix subrouter: with more than one route,
	// mux v1.8.1 subrouters report a wrong method as 404 instead of 405.
	r.HandleFunc("/api/analytics/summary", h.summary).Methods(http.MethodGet)
	r.HandleFunc("/api/analytics/timeline", h.timeline).Methods(http.MethodGet)
	r.HandleFunc("/api/analytics/open-events", h.openEvents).Methods(http.MethodGet)
	r.HandleFunc("/api/analytics/assets-at-risk", h.assetsAtRisk).Methods(http.MethodGet)
	r.HandleFunc("/api/analytics/threat-origins", h.threatOrigins).Methods(http.MethodGet)
}

// summary handles GET /api/analytics/summary.
func (h *Handler) summary(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), queryTimeout)
	defer cancel()

	sum, err := h.store.Summary(ctx, h.now().UTC())
	if err != nil {
		log.Printf("Error building analytics summary: %v", err)
		httpx.WriteError(w, http.StatusInternalServerError, "Failed to load analytics summary")
		return
	}

	httpx.WriteData(w, sum)
}

// timeline handles GET /api/analytics/timeline?days=N.
func (h *Handler) timeline(w http.ResponseWriter, r *http.Request) {
	days, ok := parseDays(w, r)
	if !ok {
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), queryTimeout)
	defer cancel()

	tl, err := h.store.Timeline(ctx, h.now().UTC(), days)
	if err != nil {
		log.Printf("Error building event timeline: %v", err)
		httpx.WriteError(w, http.StatusInternalServerError, "Failed to load event timeline")
		return
	}

	httpx.WriteData(w, tl)
}

// openEvents handles GET /api/analytics/open-events.
func (h *Handler) openEvents(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), queryTimeout)
	defer cancel()

	open, err := h.store.OpenEvents(ctx, h.now().UTC())
	if err != nil {
		log.Printf("Error listing open events: %v", err)
		httpx.WriteError(w, http.StatusInternalServerError, "Failed to load open events")
		return
	}

	httpx.WriteData(w, open)
}

// assetsAtRisk handles GET /api/analytics/assets-at-risk.
func (h *Handler) assetsAtRisk(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), queryTimeout)
	defer cancel()

	assets, err := h.store.AssetsAtRisk(ctx, h.now().UTC())
	if err != nil {
		log.Printf("Error listing assets at risk: %v", err)
		httpx.WriteError(w, http.StatusInternalServerError, "Failed to load assets at risk")
		return
	}

	httpx.WriteData(w, assets)
}

// threatOrigins handles GET /api/analytics/threat-origins?days=N.
func (h *Handler) threatOrigins(w http.ResponseWriter, r *http.Request) {
	days, ok := parseDays(w, r)
	if !ok {
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), queryTimeout)
	defer cancel()

	origins, err := h.store.ThreatOrigins(ctx, h.now().UTC(), days)
	if err != nil {
		log.Printf("Error building threat origins: %v", err)
		httpx.WriteError(w, http.StatusInternalServerError, "Failed to load threat origins")
		return
	}

	httpx.WriteData(w, origins)
}

// parseDays reads the optional ?days= window, defaulting to defaultDays.
// An invalid value writes a 400 and returns ok=false.
func parseDays(w http.ResponseWriter, r *http.Request) (days int, ok bool) {
	raw := r.URL.Query().Get("days")
	if raw == "" {
		return defaultDays, true
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n < 1 || n > maxDays {
		httpx.WriteError(w, http.StatusBadRequest,
			fmt.Sprintf("days must be an integer between 1 and %d", maxDays))
		return 0, false
	}
	return n, true
}
