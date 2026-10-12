import { create } from 'zustand'
import type { DataItem, DataResponse, HealthStatus } from '../types/api'

// Build API URLs from environment variables
// Render provides service names like "radicl-node-service" via property: host
// We need to append .onrender.com for the full domain
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

const NODE_API_URL = buildApiUrl(import.meta.env.VITE_NODE_API_URL, 'http://localhost:3001')
const GO_API_URL = buildApiUrl(import.meta.env.VITE_GO_API_URL, 'http://localhost:3002')

console.log('API URLs configured:', { NODE_API_URL, GO_API_URL })

async function fetchHealth(baseUrl: string): Promise<HealthStatus> {
  try {
    const response = await fetch(`${baseUrl}/api/health`)
    return (await response.json()) as HealthStatus
  } catch {
    return { error: 'Service unavailable' }
  }
}

interface AppState {
  nodeHealth: HealthStatus | null
  goHealth: HealthStatus | null
  nodeData: DataItem[] | null
  goData: DataItem[] | null
  allData: DataItem[]
  loading: boolean

  fetchHealthStatus: () => Promise<void>
  fetchNodeData: () => Promise<void>
  fetchGoData: () => Promise<void>
  updateAllData: () => void
  fetchAllData: () => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  // State
  nodeHealth: null,
  goHealth: null,
  nodeData: null,
  goData: null,
  allData: [],
  loading: true,

  // Actions
  fetchHealthStatus: async () => {
    set({ loading: true })
    const [nodeHealth, goHealth] = await Promise.all([
      fetchHealth(NODE_API_URL),
      fetchHealth(GO_API_URL),
    ])
    set({ nodeHealth, goHealth, loading: false })
  },

  fetchNodeData: async () => {
    try {
      const response = await fetch(`${NODE_API_URL}/api/node/data`)
      const data = (await response.json()) as DataResponse
      set({ nodeData: data.data ?? [] })
      get().updateAllData()
    } catch (error) {
      console.error('Error fetching Node data:', error)
      set({ nodeData: [] })
    }
  },

  fetchGoData: async () => {
    try {
      const response = await fetch(`${GO_API_URL}/api/go/data`)
      const data = (await response.json()) as DataResponse
      set({ goData: data.data ?? [] })
      get().updateAllData()
    } catch (error) {
      console.error('Error fetching Go data:', error)
      set({ goData: [] })
    }
  },

  updateAllData: () => {
    const { nodeData, goData } = get()
    const combined: DataItem[] = []
    if (nodeData) combined.push(...nodeData)
    if (goData) combined.push(...goData)
    set({ allData: combined })
  },

  fetchAllData: async () => {
    await Promise.all([get().fetchNodeData(), get().fetchGoData()])
  },
}))
