import { create } from 'zustand'
import type {
  AnalyticsSummary,
  AssetsAtRiskList,
  HealthStatus,
  OpenEvents,
  ThreatOrigins,
  Timeline,
} from '../types/api'

// Build the API URL from the environment.
// Render provides service names like "radicl-node-service" via property: host,
// so a bare name gets .onrender.com appended.
function buildApiUrl(envVar: string | undefined, defaultLocalUrl: string): string {
  if (!envVar) {
    return defaultLocalUrl
  }

  // If it already has a protocol, use as-is
  if (envVar.startsWith('http://') || envVar.startsWith('https://')) {
    return envVar
  }

  // If it's a Render service name (no dots), append .onrender.com
  if (!envVar.includes('.')) {
    return `https://${envVar}.onrender.com`
  }

  // Otherwise assume it's a full domain
  return `https://${envVar}`
}

// The Node service is the only API the frontend talks to; it proxies
// analytics requests to the Go service.
export const API_URL = buildApiUrl(import.meta.env.VITE_NODE_API_URL, 'http://localhost:3001')

// Fetches a Node analytics endpoint and unwraps its { data } envelope.
async function getData<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`)
  if (!response.ok) {
    throw new Error(`GET ${path} failed with status ${response.status}`)
  }
  return ((await response.json()) as { data: T }).data
}

interface AppState {
  health: HealthStatus | null
  healthError: string | null
  healthLoading: boolean

  summary: AnalyticsSummary | null
  summaryError: string | null
  summaryLoading: boolean

  timeline: Timeline | null
  timelineError: string | null
  timelineLoading: boolean

  openEvents: OpenEvents | null
  openEventsError: string | null
  openEventsLoading: boolean

  assetsAtRisk: AssetsAtRiskList | null
  assetsAtRiskError: string | null
  assetsAtRiskLoading: boolean

  threatOrigins: ThreatOrigins | null
  threatOriginsError: string | null
  threatOriginsLoading: boolean

  fetchHealthStatus: () => Promise<void>
  fetchSummary: () => Promise<void>
  fetchTimeline: () => Promise<void>
  fetchOpenEvents: () => Promise<void>
  fetchAssetsAtRisk: () => Promise<void>
  fetchThreatOrigins: () => Promise<void>
}

// Analytics actions share one shape: on failure the last good data is kept,
// so panels show an error alert over stale data rather than blanking out.
export const useAppStore = create<AppState>((set) => ({
  health: null,
  healthError: null,
  healthLoading: true,

  fetchHealthStatus: async () => {
    set({ healthLoading: true })
    try {
      const response = await fetch(`${API_URL}/api/health`)
      if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`)
      }
      set({ health: (await response.json()) as HealthStatus, healthError: null })
    } catch (error) {
      console.error('Error fetching health status:', error)
      set({ health: null, healthError: 'API unavailable' })
    }
    set({ healthLoading: false })
  },

  summary: null,
  summaryError: null,
  summaryLoading: true,

  fetchSummary: async () => {
    set({ summaryLoading: true })
    try {
      set({ summary: await getData<AnalyticsSummary>('/api/analytics/summary'), summaryError: null })
    } catch (error) {
      console.error('Error fetching analytics summary:', error)
      set({ summaryError: 'Analytics unavailable' })
    }
    set({ summaryLoading: false })
  },

  timeline: null,
  timelineError: null,
  timelineLoading: true,

  fetchTimeline: async () => {
    set({ timelineLoading: true })
    try {
      set({ timeline: await getData<Timeline>('/api/analytics/timeline'), timelineError: null })
    } catch (error) {
      console.error('Error fetching event timeline:', error)
      set({ timelineError: 'Event timeline unavailable' })
    }
    set({ timelineLoading: false })
  },

  openEvents: null,
  openEventsError: null,
  openEventsLoading: true,

  fetchOpenEvents: async () => {
    set({ openEventsLoading: true })
    try {
      set({ openEvents: await getData<OpenEvents>('/api/analytics/open-events'), openEventsError: null })
    } catch (error) {
      console.error('Error fetching open events:', error)
      set({ openEventsError: 'Open incidents unavailable' })
    }
    set({ openEventsLoading: false })
  },

  assetsAtRisk: null,
  assetsAtRiskError: null,
  assetsAtRiskLoading: true,

  fetchAssetsAtRisk: async () => {
    set({ assetsAtRiskLoading: true })
    try {
      set({
        assetsAtRisk: await getData<AssetsAtRiskList>('/api/analytics/assets-at-risk'),
        assetsAtRiskError: null,
      })
    } catch (error) {
      console.error('Error fetching assets at risk:', error)
      set({ assetsAtRiskError: 'Assets at risk unavailable' })
    }
    set({ assetsAtRiskLoading: false })
  },

  threatOrigins: null,
  threatOriginsError: null,
  threatOriginsLoading: true,

  fetchThreatOrigins: async () => {
    set({ threatOriginsLoading: true })
    try {
      set({
        threatOrigins: await getData<ThreatOrigins>('/api/analytics/threat-origins'),
        threatOriginsError: null,
      })
    } catch (error) {
      console.error('Error fetching threat origins:', error)
      set({ threatOriginsError: 'Threat origins unavailable' })
    }
    set({ threatOriginsLoading: false })
  },
}))
