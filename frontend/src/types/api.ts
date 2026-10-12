export type DependencyStatus = 'up' | 'down'

// Response from the Node gateway's GET /api/health
export interface HealthStatus {
  status: 'healthy' | 'degraded'
  service: string
  timestamp: string
  dependencies: {
    database: DependencyStatus
    go_service: DependencyStatus
  }
}
