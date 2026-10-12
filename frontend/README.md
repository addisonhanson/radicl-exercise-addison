# React Frontend

Security operations dashboard built with React 19, TypeScript, Vite 7 and MUI.

## Setup

```bash
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Backend Integration

The frontend talks only to the Node.js API gateway (`http://localhost:3001`
by default), which proxies analytics requests to the Go service. Override the
API location with `VITE_NODE_API_URL` (a full URL, a domain, or a Render
service name).

## Available Scripts

- `npm run dev` - Start the dev server with hot module replacement
- `npm run build` - Type-check and build for production
- `npm run typecheck` - Type-check only
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint

## Technology Stack

- React 19 + TypeScript
- Vite 7
- MUI (Material UI) with a dark theme (`src/theme/theme.ts`)
- Zustand for client state
- Recharts and TanStack Table (installed for upcoming dashboard visualizations)

## Structure

```
src/
├── main.tsx              # Entry point: theme provider + CssBaseline
├── App.tsx               # Page layout
├── components/           # UI components
├── store/useAppStore.ts  # Zustand store and API base URL
├── theme/theme.ts        # MUI theme
└── types/api.ts          # API response types
```
