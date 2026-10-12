// Package httpx contains small helpers for writing JSON HTTP responses.
package httpx

import (
	"encoding/json"
	"log"
	"net/http"
)

// DataEnvelope wraps successful responses as {"data": ...}.
type DataEnvelope struct {
	Data any `json:"data"`
}

// ErrorEnvelope wraps error responses as {"error": "..."}.
type ErrorEnvelope struct {
	Error string `json:"error"`
}

// WriteJSON writes v as JSON with the given status code.
func WriteJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("Error encoding JSON response: %v", err)
	}
}

// WriteData writes v wrapped in a data envelope with a 200 status.
func WriteData(w http.ResponseWriter, v any) {
	WriteJSON(w, http.StatusOK, DataEnvelope{Data: v})
}

// WriteError writes a JSON error body with the given status code.
func WriteError(w http.ResponseWriter, status int, message string) {
	WriteJSON(w, status, ErrorEnvelope{Error: message})
}
