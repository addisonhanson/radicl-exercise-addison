import { Card, CardContent, Chip, Grid, Skeleton, Stack, Typography } from '@mui/material'
import { useAppStore } from '../store/useAppStore'

type ServiceState = 'up' | 'down' | 'unknown'

interface ServiceRow {
  name: string
  state: ServiceState
}

const chipColor = {
  up: 'success',
  down: 'error',
  unknown: 'default',
} as const

// Shows the Node API and, via its health response, the Go service and database.
// If Node itself is unreachable, its dependencies are unknown.
export function ServiceStatus() {
  const { health, healthLoading } = useAppStore()

  const services: ServiceRow[] = [
    { name: 'Node API', state: health ? 'up' : 'down' },
    { name: 'Go Analytics', state: health?.dependencies.go_service ?? 'unknown' },
    { name: 'Database', state: health?.dependencies.database ?? 'unknown' },
  ]

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Service Status</Typography>
      <Grid container spacing={2}>
        {services.map((service) => (
          <Grid key={service.name} size={{ xs: 12, sm: 4 }}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1">{service.name}</Typography>
                  {healthLoading && !health ? (
                    <Skeleton variant="rounded" width={56} height={24} />
                  ) : (
                    <Chip
                      size="small"
                      label={service.state}
                      color={chipColor[service.state]}
                      variant={service.state === 'unknown' ? 'outlined' : 'filled'}
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {health && (
        <Typography variant="caption" color="text.secondary">
          Last checked {new Date(health.timestamp).toLocaleTimeString()}
        </Typography>
      )}
    </Stack>
  )
}
