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

// Bounds for the timeline's ?days= parameter.
const (
	defaultTimelineDays = 30
	maxTimelineDays     = 90
)

// Querier is the data access the handlers need. *Store implements it; tests
// substitute a fake.
type Querier interface {
	Summary(ctx context.Context, now time.Time) (Summary, error)
	Timeline(ctx context.Context, now time.Time, days int) (Timeline, error)
	OpenEvents(ctx context.Context, now time.Time) (OpenEvents, error)
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
	days := defaultTimelineDays
	if raw := r.URL.Query().Get("days"); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil || n < 1 || n > maxTimelineDays {
			httpx.WriteError(w, http.StatusBadRequest,
				fmt.Sprintf("days must be an integer between 1 and %d", maxTimelineDays))
			return
		}
		days = n
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
