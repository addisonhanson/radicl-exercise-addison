// Package analytics serves aggregated security metrics for the dashboard.
package analytics

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/radicl/go-service/internal/httpx"
)

// queryTimeout bounds how long a single analytics query may run.
const queryTimeout = 5 * time.Second

// Querier is the data access the handlers need. *Store implements it; tests
// substitute a fake.
type Querier interface {
	Summary(ctx context.Context, now time.Time) (Summary, error)
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
	api := r.PathPrefix("/api/analytics").Subrouter()
	api.HandleFunc("/summary", h.summary).Methods(http.MethodGet)
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
