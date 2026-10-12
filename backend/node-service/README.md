# Node.js API Gateway

The frontend-facing REST API, built with Express 5 and TypeScript. It owns
event data in PostgreSQL and proxies analytics requests to the Go service,
so the browser only talks to one API.

```
frontend ──> node-service ──> PostgreSQL
                  │
                  └──> go-service (analytics)
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `backend/node-service/.env`
   (copy `ENV.example` from the project root):

```env
DATABASE_URL=postgresql://radicl_user:radicl_password@localhost:5432/radicl_db
GO_SERVICE_URL=http://localhost:3002   # default if unset
# GO_SERVICE_TIMEOUT_MS=3000           # default if unset
# PORT=3001                            # default if unset
```

3. Make sure PostgreSQL (`docker compose up -d`) and the Go service are running.

4. Start the development server:
```bash
npm run dev
```

The service will run on `http://localhost:3001`

## API Endpoints

Successful responses are wrapped as `{ "data": ... }`, errors as `{ "error": "message" }`.

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Service health plus dependency status (`database`, `go_service`). Returns `degraded` when a dependency is down. |
| `GET /api/analytics/summary` | Dashboard KPI summary, computed by the Go service |

When the Go service fails, analytics routes return `503` (unreachable),
`504` (timed out) or `502` (upstream error) instead of crashing.

## Project Structure

```
src/
├── index.ts              # Wiring: DB pool, Go client, start server
├── app.ts                # createApp(deps) - routes and middleware
├── config.ts             # Environment configuration
├── clients/goClient.ts   # Typed Go service client with timeout/error mapping
├── routes/               # Route handlers
├── http/errors.ts        # HttpError, 404 and error-handling middleware
└── types/                # Response types (mirrors Go structs)
```

## Scripts

- `npm run dev` - Start with hot reload (tsx watch)
- `npm run build` - Compile TypeScript to `dist/`
- `npm start` - Run the compiled build
- `npm run typecheck` - Type-check without emitting
- `npm test` - Run tests (node:test via tsx)
