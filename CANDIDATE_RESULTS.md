# Coding Exercise - Results & Submission

## Your Information

**Name:** Addison Hanson

**GitHub Username:** [@addisonhanson](https://github.com/addisonhanson)

**Deployed Application URL:** Not deployed

**Repository URL:** https://github.com/addisonhanson/radicl-exercise-addison

**Date Submitted:** 2026-10-12

**Time Spent:** ~4 hours

---

## Implementation Summary

I took the **breadth** approach: a row of KPI cards for the at-a-glance picture, then a tabbed panel with four different visualizations. All analytics are computed by the **Go service**; the **Node service** is the only API the browser talks to and acts as a typed gateway in front of Go.

```
React (MUI, Recharts, TanStack Table, d3-geo)
   │  only talks to Node
   ▼
Node / Express 5 / TypeScript  ── /api/health (checks DB + Go)
   │  typed goClient, maps Go failures to 502/503/504
   ▼
Go / gorilla/mux  ── /api/analytics/*  (SQL aggregation)
   ▼
PostgreSQL 16  (assets, threat_intelligence, security_events)
```

### Features Implemented

**Dashboard (React 19 + TypeScript + MUI 9)**
- **Six KPI cards**: Open Incidents, Assets at Risk, Events (24h), Mean Time to Detect (7d), Mean Time to Resolve (7d) and Active Threat Campaigns (7d). Each shows the current value, the previous value ("vs 12 yesterday" / "vs 4h 2m last week") and a percent-change chip colored by whether the change is **good or bad**, not just its direction, so a rising MTTR is red and a falling one is green.
- **Events Timeline tab**: stacked area chart (Recharts) of events per day over 30 days, split by severity.
- **Open Incidents tab**: severity donut beside a sortable table (TanStack Table) of the open events behind it. Clicking a slice or legend row filters the table to that severity.
- **Assets at Risk tab**: sortable table of assets with open events, with a risk score, a hostname search and an environment filter.
- **Threat Map tab**: world map (d3-geo + world-atlas) shaded by events per source country, with hover details and a ranked list of the top source countries.
- **UX states**: skeletons while loading, error alerts when a request fails (keeping any data already shown), em dashes for missing values, and a service-status chip in the footer whose tooltip shows the Node API, Go service and database status.
- **Layout**: a fixed-height chart panel so switching tabs doesn't shift the page, with charts and tables stretching to fill it. Built for 1080p, and the 3-across card grid holds at 1366×768.
- **Colors**: severity colors are an ordered red-to-amber ramp whose lightness rises from Critical to Low, so the order is still readable for colorblind users, and every color is paired with a text label.

**Go analytics service** (`backend/go-service/internal/analytics`)
- `GET /api/analytics/summary`: all six KPIs in a single SQL pass. "Open 24 hours ago" is reconstructed from the event lifecycle timestamps, so no snapshot table is needed. MTTR excludes false positives.
- `GET /api/analytics/timeline?days=30`: rolling 24-hour buckets ending now (via `generate_series`, so empty days come back as zeros), which means the newest bucket matches the Events (24h) KPI exactly.
- `GET /api/analytics/open-events`: every open event plus counts by severity, tallied from the same rows so the donut and table can never disagree.
- `GET /api/analytics/assets-at-risk`: per-asset rollup with a 0–100 risk score (the highest open threat score × an asset-criticality weight).
- `GET /api/analytics/threat-origins?days=30`: events by source country, with critical counts and distinct source IPs.
- `Store` (SQL) / `Handler` (HTTP) split behind a `Querier` interface so handlers are unit-tested with a fake. Every query is time-bounded and takes "now" as a parameter rather than `NOW()`. `?days=` is validated (1–90) with a 400 on bad input.

**Node gateway** (`backend/node-service`, Express 5 + TypeScript)
- Proxies all five analytics endpoints under the same paths through a typed `goClient`.
- Maps Go failures to meaningful statuses: unreachable → **503**, timeout → **504**, upstream 5xx or malformed body → **502**, Go 4xx → passed through with Go's message.
- `GET /api/health` reports `healthy`/`degraded` with `database` and `go_service` dependency status.
- `createApp(deps)` takes its dependencies as arguments so tests can pass in fakes.

**Database** (`database/init/`)
- `01-security-schema.sql`: `assets`, `threat_intelligence` and `security_events`, with ENUM types, INET and JSONB columns, TIMESTAMPTZ lifecycle timestamps (occurred → detected → acknowledged → resolved), CHECK constraints tying `status` to those timestamps, and indexes for the dashboard's queries (including a partial index on open events).
- `02-security-seed.sql`: about 560 events over 30 days, generated **relative to `NOW()`** so the dashboard always looks live. It uses `setseed` so the data is reproducible, and includes realistic patterns: threat campaigns, repeat attackers from consistent IPs and countries, more false positives for "Suspicious Activity", and response times that improve week over week.

**Tests**
- Go: handler tests (data envelope, null durations, error masking, 405, and the `?days=` default and validation across both windowed endpoints).
- Node: `node:test` suites for the app routes (envelopes, error mapping, health states, `?days` forwarding) and the Go client (envelope unwrapping, 4xx passthrough, 502/503/504 mapping, URL building).

### Technologies Chosen (and why)
- **MUI 9**: a full component set (cards, tables, tabs, tooltips, skeletons) with a dark theme, so time went into the dashboard rather than primitives.
- **Recharts**: declarative React charts, used for the area chart and the donut.
- **TanStack Table**: headless sorting logic rendered with MUI table components, wrapped once in a reusable `SortableTable`.
- **d3-geo + topojson-client + world-atlas** for the map, instead of `react-simple-maps`, which doesn't declare React 19 support and would break `npm install` on a fresh clone. The map outlines are projected once at module load into static SVG paths, and the map data ships with the app (no network fetch).
- **Zustand** (already in the starter) for the fetch state.
- **pgx** in Go and **tsx** for running and testing TypeScript in Node.

### Notable Decisions & Trade-offs
- **Go does the analytics, Node is the gateway.** The frontend has one origin to call, and Node turns Go's failures into clear HTTP statuses and messages.
- **The API returns raw current/previous values; the UI computes the change.** That keeps "is this change good or bad?" a presentation decision.
- **Rolling 24-hour windows instead of calendar days** for the timeline, so the latest day doesn't look like a drop just because the day isn't over.
- **The Open Incidents total equals the KPI card**, and the Assets at Risk list length equals its card, by construction.
- **Country codes**: the data stores ISO alpha-2 codes (`RU`) while the map uses ISO numeric IDs (`643`), so a small static lookup table bridges the two in the frontend.
- **No auto-refresh yet**: data loads on page load. The store keeps the last good data on errors, so adding polling would be straightforward.

### Challenges
- **gorilla/mux v1.8.1** reports a wrong HTTP method as 404 instead of 405 once a `PathPrefix` subrouter has more than one route. An existing test caught it when the second endpoint was added; routes are now registered with full paths.
- **Severity colors vs. color blindness**: a red/orange/yellow palette fails colorblind-separation checks. I kept the familiar hues but made lightness rise steadily with severity, so the order still reads, and paired every color with a label.
- **Library compatibility**: MUI 9 removed system props (layout uses `sx`), Recharts 3 chart data needs `type` aliases rather than interfaces, and TypeScript is pinned to 6.x because typescript-eslint doesn't support 7 yet.

### Future Improvements
- Polling or a refresh button, plus a "last updated" time.
- Tests for the remaining endpoints, and frontend unit tests (e.g. Vitest for the change and duration formatting).
- Code-splitting: the production bundle is about 1 MB (mostly Recharts and the map data). Lazy-loading the chart tabs would cut the initial load.
- Clicking a day on the timeline to open that day's events, and date-range filters.
- OpenAPI documentation for the gateway, CSV export from the tables, and a light/dark toggle.
- Deployment via the included `render.yaml` (already updated with `GO_SERVICE_URL`).

---

## Setup Instructions

### Your Custom Setup Instructions:

The normal flow from the main README still applies (`./start.sh` / `start.bat`, or the manual steps). These are the changes to be aware of:

**Prerequisites:** Node.js 20.19+ or 22.12+, **Go 1.24+** (from `go.mod`), Docker with Compose.

**1. Environment files** (same as the README; `ENV.example` now includes one new variable)
```bash
cp ENV.example backend/node-service/.env
cp ENV.example backend/go-service/.env
```
- **New:** `GO_SERVICE_URL=http://localhost:3002` tells the Node gateway where the Go service is. It defaults to `http://localhost:3002` if unset, so existing `.env` files still work locally.

**2. Database: the schema and seed data were replaced**
- `database/init/01-init.sql` and `02-security-data.sql` were replaced by **`01-security-schema.sql`** and **`02-security-seed.sql`**. Postgres runs them automatically on the first start of an **empty** volume.
- **If you have run this project before**, the old volume still holds the old schema, and the init scripts won't run again. Reset it (this deletes local DB data):
  ```bash
  docker compose down -v      # or: docker-compose down -v
  docker compose up -d
  ```
  `start.sh` checks for the new schema and prints this command if the volume is outdated.

**3. Dependencies:** new packages were added, so install (or reinstall, if `node_modules` already exists from an earlier checkout):
```bash
npm run install:all
# or individually:
cd frontend && npm install                 # adds d3-geo, topojson-client, world-atlas (+ types)
cd ../backend/node-service && npm install  # TypeScript toolchain (tsx, typescript)
```
`start.sh` only installs when `node_modules` is missing.

**4. Start everything**
```bash
./start.sh            # or start.bat on Windows
# or, with the database already running:
npm run start:all     # Node (3001), Go (3002), frontend (5173)
```
Open http://localhost:5173. The Node service runs TypeScript via `tsx watch`. **The Go service (`go run`) does not hot-reload**, so restart it after Go changes.

**Ports are unchanged**: Postgres 5432, Node 3001, Go 3002, frontend 5173.

**5. Tests and checks**
```bash
cd backend/go-service && go test ./...
cd backend/node-service && npm test && npm run typecheck
cd frontend && npm run typecheck && npm run lint && npm run build
```

**Build command change:** the Node service is now TypeScript. `npm run build` compiles it to `dist/`, and `npm start` runs `dist/index.js`. The root `build:node` script and `render.yaml` were updated to match.

---

## Tools Used

- **Editor / terminal**: Neovim, plus a terminal for running the stack and verification scripts.
- **AI**: **Claude Code** (Anthropic's CLI agent) as a pair programmer for most of the implementation.
- **References**: MUI, Recharts, TanStack Table, d3-geo and PostgreSQL docs, and the `render.yaml` in this repo.

**How I used AI.** I led the design and reviewed every step. I had Claude propose an approach, we agreed on it, it built one small slice (backend and UI as separate steps), and I verified each slice before it was committed, so the commit history follows that loop. Claude didn't spin up throwaway infrastructure. Instead it wrote small shell scripts that I ran against the real stack, with the expected output spelled out (e.g. "the last timeline bucket should equal the Events (24h) card"). I made the product and UX calls along the way: which charts to build, which table columns to keep, the change-chip wording, and the fixed panel height.

**Representative exchanges** (paraphrased), showing the back-and-forth:
1. **Agree before building.** *"I'm taking a breadth approach: KPI cards plus a tabbed area of charts. Read the frontend and the summary types, then give me recommendations on the open UI questions. Don't write anything until we've agreed."* Claude came back with recommendations on layout, card design, data fetching and UX states, and we settled the approach before any code was written.
2. **Steering the design.** Claude's first proposal was too elaborate, so I pared it back: *"Way too much. Condense the service status into a chip at the bottom I can hover for details. Three cards across, two rows, the main number centered and bold, the previous value underneath, and a green or red trend indicator. Lean on MUI defaults."* After that we iterated in small visual tweaks ("make the chips smaller and less stark", "say 'vs XX yesterday' instead of 'Previous'").
3. **Asking for advice, then deciding.** *"Can we combine Recharts and TanStack Table into one view? Does that work for the timeline, or is it better for another chart down the road?"* Claude explained that a table would only repeat the timeline's numbers, and that the pairing works best when the chart filters a table of the underlying rows. I chose to save it for the severity donut, which became the donut plus filterable events table.
4. **Pushing back, then reconsidering.** When the map needed a country-code lookup: *"I don't want a lookup like that every time. Let's update our country encoding to match the ISO."* Claude pointed out that our codes were already ISO (alpha-2, while the map uses ISO numeric) and laid out the cost of changing the schema. I decided a single static lookup in the frontend was the simpler trade-off.

## Additional Notes

- The seed data is generated relative to `NOW()`, so whenever the database is initialized, the dashboard shows the last 30 days as recent activity. Resetting the volume regenerates it with the same distributions.
- Several numbers deliberately reconcile across views and make easy sanity checks: the Open Incidents card equals the donut total, the Assets at Risk card equals the assets table's row count, and the Events (24h) card equals the last timeline bucket.
