import { Box, Chip, Tooltip, Typography } from '@mui/material'
import { useAppStore } from '../store/useAppStore'

type ServiceState = 'up' | 'down' | 'unknown'

// A compact overall status chip; hovering shows each service. The Node API is
// checked directly and reports the Go service and database. If Node itself is
// unreachable, its dependencies are unknown.
export function ServiceStatus() {
  const { health, healthLoading } = useAppStore()

  const services: { name: string; state: ServiceState }[] = [
    { name: 'Node API', state: health ? 'up' : 'down' },
    { name: 'Go Analytics', state: health?.dependencies.go_service ?? 'unknown' },
    { name: 'Database', state: health?.dependencies.database ?? 'unknown' },
  ]

  const chip = healthLoading && !health
    ? { label: 'Checking services…', color: 'default' as const }
    : !health
      ? { label: 'API unavailable', color: 'error' as const }
      : health.status === 'healthy'
        ? { label: 'All systems operational', color: 'success' as const }
        : { label: 'Degraded', color: 'warning' as const }

  const details = (
    <Box>
      {services.map((service) => (
        <Typography key={service.name} variant="caption" component="div">
          {service.name}: {service.state}
        </Typography>
      ))}
      {health && (
        <Typography variant="caption" component="div" sx={{ mt: 0.5, opacity: 0.7 }}>
          Last checked {new Date(health.timestamp).toLocaleTimeString()}
        </Typography>
      )}
    </Box>
  )

  return (
    <Tooltip title={details} arrow>
      <Chip size="small" variant="outlined" label={chip.label} color={chip.color} />
    </Tooltip>
  )
}
