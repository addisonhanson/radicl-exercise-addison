# RADICL Fullstack Developer - Coding Exercise

> ## 🎯 START HERE: [CANDIDATE_README.md](CANDIDATE_README.md)
> 
> **If you're a candidate:**
> 1. Read **[CANDIDATE_README.md](CANDIDATE_README.md)** for exercise instructions and requirements
> 2. Then read this file for technical documentation, setup instructions, and troubleshooting
> 
> Both files contain essential information for completing the exercise.

---

## About This Exercise

This is a take-home coding exercise for our **Fullstack Developer** position. You'll be building a cybersecurity operations dashboard using this existing full-stack application as your foundation.

**What's already here:**
- Working React frontend (with example components)
- Node.js and Go backend services (with example endpoints)
- PostgreSQL database (ready for your schema)
- Example data visualizations and tables (not related to security)

**What you'll build:**
- Cybersecurity-themed database schema
- Security event APIs
- Professional dashboard with visualizations
- Your own creative features

This exercise tests your ability to adapt existing code and build new features - a realistic representation of our daily work.

## ⚠️ IMPORTANT: Document Your Setup Changes

**If you modify anything about the setup process, YOU MUST document it in CANDIDATE_RESULTS.md:**

- ✅ Added new SQL scripts? Document where they are and how to run them
- ✅ Installed new npm packages or Go modules? List the new dependencies
- ✅ Changed environment variables? Document what's required
- ✅ Added new services or changed ports? Specify the configuration
- ✅ Modified database schema? Explain the migration steps
- ✅ Changed build commands? Provide the new commands

**We will be running your application locally.** Include clear, step-by-step setup instructions in the CANDIDATE_RESULTS.md file. Test your instructions by cloning your repo in a fresh directory and following them exactly.

## Architecture

```
radicl-coding-exercises/
├── frontend/              # React.js + Vite frontend
├── backend/
│   ├── node-service/      # Node.js + Express backend
│   └── go-service/        # Go + Gorilla Mux backend
├── database/              # PostgreSQL initialization scripts
├── docker-compose.yml     # Docker Compose configuration
└── README.md
```

## Technology Stack

### Frontend
- **React 19** - Modern UI library with hooks
- **Vite 7** - Lightning-fast build tool and dev server
- **TanStack Table v8** - Powerful headless table library
- **Recharts** - Composable charting library
- **ESLint** - Code quality and linting

### Backend Services

#### Node.js Service
- **Express** - Fast, minimalist web framework
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment configuration
- **Nodemon** - Development auto-reload

#### Go Service
- **Gorilla Mux** - Powerful HTTP router
- **rs/cors** - CORS middleware
- **net/http** - Standard HTTP server

### Database
- **PostgreSQL 16** - Robust relational database
- **Docker Compose** - Containerized database setup
- **Automatic initialization** - SQL scripts for schema and seed data

## Quick Start

### Prerequisites
- **Node.js 20.19+ or 22.12+** and npm (required for Vite 7)
- Go 1.21+
- Docker and Docker Compose (for database)
- Terminal access

> **⚠️ Important:** This project uses Vite 7, which requires Node.js 20.19+ or 22.12+. If you're using Node.js 20.x, ensure you have at least version 20.19. We recommend using [nvm (Node Version Manager)](https://github.com/nvm-sh/nvm) to manage Node.js versions.

**Install/Upgrade Node.js with nvm:**
```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 20.19 or later
nvm install 20.19
nvm use 20.19

# Verify version
node --version  # Should show v20.19.x or higher
```

### Run `start.sh` or `start.bat` to setup the application for you, but here are manual instructions for reference

### 1. Configure Environment Variables

**Important:** Create `.env` files for database connectivity:

```bash
# Copy the example environment file to create .env files
cp ENV.example backend/node-service/.env
cp ENV.example backend/go-service/.env
```

The default values in `ENV.example` are pre-configured for local development and will work immediately.

**What's configured:**
- PostgreSQL connection strings
- Database credentials (radicl_user/radicl_password)
- Service ports (3001 for Node.js, 3002 for Go)

> **Note:** These are development credentials only. Never use these in production!

### 2. Start the PostgreSQL Database

```bash
docker-compose up -d
```

The database will run on `localhost:5432`. See [database/README.md](database/README.md) for detailed configuration.

### 3. Start the Node.js Backend

```bash
cd backend/node-service
npm install
npm run dev
```

The Node.js service will run on `http://localhost:3001`

### 4. Start the Go Backend

```bash
cd backend/go-service
go mod tidy
go run main.go
```

The Go service will run on `http://localhost:3002`

### 5. Start the React Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

The frontend calls only the Node.js service, which acts as an API gateway and
proxies analytics requests to the Go service.

### Node.js Service (Port 3001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check, including database and Go service status |
| `/api/analytics/summary` | GET | Dashboard KPI summary (proxied to Go) |

### Go Service (Port 3002)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/analytics/summary` | GET | Dashboard KPI summary |

## Development

### Frontend Development
```bash
cd frontend
npm run dev    # Start dev server
npm run build  # Build for production
npm run lint   # Run linter
```

### Node.js Backend Development
```bash
cd backend/node-service
npm run dev    # Start with hot reload
npm start      # Start production mode
```

### Go Backend Development
```bash
cd backend/go-service
go run main.go        # Run in development
go build -o service   # Build binary
./service             # Run binary
```

### Database Development
```bash
docker-compose up -d           # Start database
docker-compose stop            # Stop database
docker-compose down -v         # Remove database and data
docker-compose logs postgres   # View database logs

# Connect to database
docker-compose exec postgres psql -U radicl_user -d radicl_db

# Run SQL file
docker-compose exec -T postgres psql -U radicl_user -d radicl_db < your-script.sql
```

See [database/README.md](database/README.md) for complete documentation.

## Project Structure

### Frontend
```
frontend/
├── src/
│   ├── App.jsx        # Main application component
│   ├── App.css        # Application styles
│   ├── main.jsx       # Entry point
│   └── index.css      # Global styles
├── package.json
└── vite.config.js
```

### Node.js Backend
```
backend/node-service/
├── src/
│   └── index.js       # Express server
├── package.json
└── .env.example
```

### Go Backend
```
backend/go-service/
├── main.go            # HTTP server
├── go.mod
└── .env.example
```

## Included Features

- ✅ Modern React frontend with responsive design
- ✅ Interactive data tables with sorting (TanStack Table)
- ✅ Data visualization with charts (Recharts)
- ✅ RESTful API endpoints in both Node.js and Go
- ✅ PostgreSQL database with Docker Compose
- ✅ Automatic database initialization with sample data
- ✅ CORS enabled for cross-origin requests
- ✅ Health check endpoints for service monitoring
- ✅ Environment-based configuration
- ✅ Hot reload for development

## Environment Configuration

Each service can be configured via environment variables. Create a `.env` file in the project root:

```env
# PostgreSQL Database
POSTGRES_DB=radicl_db
POSTGRES_USER=radicl_user
POSTGRES_PASSWORD=radicl_password
POSTGRES_PORT=5432

# Database Connection URLs
DATABASE_URL=postgresql://radicl_user:radicl_password@localhost:5432/radicl_db

# For Go Service
DB_HOST=localhost
DB_PORT=5432
DB_NAME=radicl_db
DB_USER=radicl_user
DB_PASSWORD=radicl_password
DB_SSLMODE=disable
```

### Node.js Service
Create `backend/node-service/.env`:
```env
PORT=3001
DATABASE_URL=postgresql://radicl_user:radicl_password@localhost:5432/radicl_db
```

### Go Service
Create `backend/go-service/.env`:
```env
PORT=3002
DB_HOST=localhost
DB_PORT=5432
DB_NAME=radicl_db
DB_USER=radicl_user
DB_PASSWORD=radicl_password
DB_SSLMODE=disable
```

**⚠️ Security Note:** Default credentials are for development only. Use strong passwords in production!

## Testing the Setup

1. Open your browser to `http://localhost:5173`
2. You should see the RADICL Security Operations dashboard
3. The Service Status panel shows the Node API, Go analytics service and database as `up`
4. `curl http://localhost:3001/api/analytics/summary` returns the KPI summary via the Node gateway

## Production Build

### Frontend
```bash
cd frontend
npm run build
# Output will be in frontend/dist/
```

### Node.js Backend
```bash
cd backend/node-service
npm start
```

### Go Backend
```bash
cd backend/go-service
go build -o go-service
./go-service
```

## Troubleshooting

Common issues and quick solutions:

### Database Connection Errors

**Symptom:** Backend services fail with "Failed to fetch data from database" or cannot connect to PostgreSQL

**Solution:**
```bash
# Check if .env files exist
ls backend/node-service/.env
ls backend/go-service/.env

# If missing, copy from template:
cp ENV.example backend/node-service/.env
cp ENV.example backend/go-service/.env

# Restart the backend services
cd backend/node-service
npm run dev
```

**Common causes:**
- Missing `.env` files (most common)
- Database not running (`docker-compose up -d`)
- Incorrect credentials in `.env` file
- Database not initialized

### Node.js Version Issues

**Symptom:** Frontend fails to start with error: `crypto.hash is not a function` or `Vite requires Node.js version 20.19+ or 22.12+`

**Solution:**
```bash
# Check your current Node.js version
node --version

# If below 20.19, upgrade using nvm:
nvm install 20.19
nvm use 20.19

# Restart the frontend
cd frontend
npm run dev
```

### Port Already in Use
```bash
# Kill process on specific port
lsof -ti:5173 | xargs kill -9  # Frontend
lsof -ti:3001 | xargs kill -9  # Node.js
lsof -ti:3002 | xargs kill -9  # Go
lsof -ti:5432 | xargs kill -9  # PostgreSQL
```

### Dependencies Issues
```bash
# Clean and reinstall all dependencies
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf backend/node-service/node_modules backend/node-service/package-lock.json

npm install
cd frontend && npm install && cd ..
cd backend/node-service && npm install && cd ../..
```

### Database Issues
```bash
# Reset database completely
docker-compose down -v
docker-compose up -d
```

## License

ISC

## Contributing

Feel free to submit issues and enhancement requests!
