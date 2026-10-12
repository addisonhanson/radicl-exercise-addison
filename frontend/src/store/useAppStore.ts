import { create } from 'zustand'
import type { HealthStatus } from '../types/api'

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

  fetchHealthStatus: () => Promise<void>
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
}))
