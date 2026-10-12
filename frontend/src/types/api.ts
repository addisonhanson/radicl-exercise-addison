export interface HealthStatus {
  status?: string
  service?: string
  timestamp?: string
  error?: string
}

export interface DataItem {
  id: number
  name: string
  type: string
  description?: string | null
  created_at: string
}

export interface DataResponse {
  data: DataItem[] | null
}
