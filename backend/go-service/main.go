package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/radicl/go-service/internal/analytics"
	"github.com/rs/cors"
)

type HealthResponse struct {
	Status    string `json:"status"`
	Service   string `json:"service"`
	Timestamp string `json:"timestamp"`
}

type HelloResponse struct {
	Message string `json:"message"`
	Version string `json:"version"`
}

type DataItem struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Type        string    `json:"type"`
	Description *string   `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type DataResponse struct {
	Data []DataItem `json:"data"`
}

var dbPool *pgxpool.Pool

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(HealthResponse{
		Status:    "healthy",
		Service:   "go-service",
		Timestamp: time.Now().Format(time.RFC3339),
	})
}

func helloHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(HelloResponse{
		Message: "Hello from Go service!",
		Version: "1.0.0",
	})
}

func dataHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	ctx := context.Background()
	query := "SELECT id, name, type, description, created_at FROM items WHERE type = 'go' ORDER BY id"
	
	rows, err := dbPool.Query(ctx, query)
	if err != nil {
		log.Printf("Error querying database: %v", err)
		http.Error(w, `{"error": "Failed to fetch data from database"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	
	var items []DataItem
	for rows.Next() {
		var item DataItem
		err := rows.Scan(&item.ID, &item.Name, &item.Type, &item.Description, &item.CreatedAt)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}
		items = append(items, item)
	}
	
	if err := rows.Err(); err != nil {
		log.Printf("Error iterating rows: %v", err)
		http.Error(w, `{"error": "Failed to process data"}`, http.StatusInternalServerError)
		return
	}
	
	data := DataResponse{Data: items}
	json.NewEncoder(w).Encode(data)
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: Error loading .env file: %v", err)
	}

	// Initialize database connection
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}
	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "5432"
	}
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "radicl_db"
	}
	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "radicl_user"
	}
	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "radicl_password"
	}
	dbSSLMode := os.Getenv("DB_SSLMODE")
	if dbSSLMode == "" {
		dbSSLMode = "disable"
	}

	// Build connection string
	connString := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		dbUser, dbPassword, dbHost, dbPort, dbName, dbSSLMode,
	)

	// Create connection pool
	var err error
	dbPool, err = pgxpool.New(context.Background(), connString)
	if err != nil {
		log.Fatalf("Unable to create connection pool: %v\n", err)
	}
	defer dbPool.Close()

	// Test database connection
	err = dbPool.Ping(context.Background())
	if err != nil {
		log.Printf("Warning: Unable to connect to database: %v\n", err)
		log.Println("Service will start anyway. Database operations may fail.")
	} else {
		log.Println("Connected to PostgreSQL database")
	}

	// Get service port
	port := os.Getenv("PORT")
	if port == "" {
		port = "3002"
	}

	r := mux.NewRouter()

	// Routes
	r.HandleFunc("/api/health", healthHandler).Methods("GET")
	r.HandleFunc("/api/go/hello", helloHandler).Methods("GET")
	r.HandleFunc("/api/go/data", dataHandler).Methods("GET")

	analytics.NewHandler(analytics.NewStore(dbPool)).RegisterRoutes(r)

	// CORS
	handler := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type", "Authorization"},
	}).Handler(r)

	addr := fmt.Sprintf(":%s", port)
	log.Printf("Go service running on port %s\n", port)
	log.Fatal(http.ListenAndServe(addr, handler))
}

