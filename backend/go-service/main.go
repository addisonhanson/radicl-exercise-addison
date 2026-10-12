package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/radicl/go-service/internal/analytics"
	"github.com/radicl/go-service/internal/httpx"
	"github.com/rs/cors"
)

type HealthResponse struct {
	Status    string `json:"status"`
	Service   string `json:"service"`
	Timestamp string `json:"timestamp"`
}

var dbPool *pgxpool.Pool

func healthHandler(w http.ResponseWriter, r *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, HealthResponse{
		Status:    "healthy",
		Service:   "go-service",
		Timestamp: time.Now().Format(time.RFC3339),
	})
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
