import { create } from 'zustand'
import type { AnalyticsSummary, HealthStatus, OpenEvents, Timeline } from '../types/api'

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

  fetchHealthStatus: () => Promise<void>
  fetchSummary: () => Promise<void>
  fetchTimeline: () => Promise<void>
  fetchOpenEvents: () => Promise<void>
}

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

  // On failure the last good summary is kept so the cards don't blank out.
  fetchSummary: async () => {
    set({ summaryLoading: true })
    try {
      const response = await fetch(`${API_URL}/api/analytics/summary`)
      if (!response.ok) {
        throw new Error(`Analytics summary failed with status ${response.status}`)
      }
      const body = (await response.json()) as { data: AnalyticsSummary }
      set({ summary: body.data, summaryError: null })
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
      const response = await fetch(`${API_URL}/api/analytics/timeline`)
      if (!response.ok) {
        throw new Error(`Event timeline failed with status ${response.status}`)
      }
      const body = (await response.json()) as { data: Timeline }
      set({ timeline: body.data, timelineError: null })
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
      const response = await fetch(`${API_URL}/api/analytics/open-events`)
      if (!response.ok) {
        throw new Error(`Open events failed with status ${response.status}`)
      }
      const body = (await response.json()) as { data: OpenEvents }
      set({ openEvents: body.data, openEventsError: null })
    } catch (error) {
      console.error('Error fetching open events:', error)
      set({ openEventsError: 'Open incidents unavailable' })
    }
    set({ openEventsLoading: false })
  },
}))
