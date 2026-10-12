import { useMemo } from 'react'
import { Alert, Box, Grid, Skeleton, Stack, Tooltip, Typography } from '@mui/material'
import { red } from '@mui/material/colors'
import { alpha, useTheme } from '@mui/material/styles'
import { useAppStore } from '../../store/useAppStore'
import type { CountryOrigin } from '../../types/api'
import { alpha2ToNumeric } from './threatMap/isoNumeric'
import { countryShapes, MAP_HEIGHT, MAP_WIDTH } from './threatMap/worldShapes'

const TOP_COUNT = 8

// A single-hue sequential ramp: more events, more opaque red.
const RAMP_COLOR = red[400]
const MIN_OPACITY = 0.25

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
const countryName = (alpha2: string) => regionNames.of(alpha2) ?? alpha2

// Square-root scaling keeps a few very busy countries from washing out the rest.
const intensity = (events: number, max: number) =>
  MIN_OPACITY + (1 - MIN_OPACITY) * Math.sqrt(events / max)

// World map shaded by how many events came from each source country over the
// last 30 days, beside a ranked list of the busiest countries.
export function ThreatMapChart() {
  const theme = useTheme()
  const { threatOrigins, threatOriginsError, threatOriginsLoading } = useAppStore()

  const byNumeric = useMemo(() => {
    const map = new Map<string, CountryOrigin>()
    for (const origin of threatOrigins?.countries ?? []) {
      const numeric = alpha2ToNumeric[origin.country]
      if (numeric) map.set(numeric, origin)
    }
    return map
  }, [threatOrigins])

  if (threatOriginsLoading && !threatOrigins) {
    return <Skeleton variant="rounded" sx={{ flex: 1 }} />
  }
  if (!threatOrigins) {
    return <Alert severity="error">{threatOriginsError ?? 'Threat origins unavailable'}</Alert>
  }

  const max = Math.max(1, ...threatOrigins.countries.map((c) => c.events))
  const top = threatOrigins.countries.slice(0, TOP_COUNT)

  return (
    <Stack sx={{ flex: 1, minHeight: 0 }}>
      {threatOriginsError && <Alert severity="error" sx={{ mb: 2 }}>{threatOriginsError}</Alert>}
      <Grid container spacing={3} sx={{ flex: 1, minHeight: 0 }}>
        <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
          <Box
            component="svg"
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            role="img"
            aria-label="World map of event source countries"
            sx={{
              // Fills the column; the viewBox keeps the map's aspect ratio, centered.
              display: 'block',
              width: '100%',
              flex: 1,
              minHeight: 0,
              '& path.has-events:hover': { stroke: theme.palette.text.primary, strokeWidth: 1 },
            }}
          >
            {countryShapes.map((shape) => {
              const origin = byNumeric.get(shape.id)
              const path = (
                <path
                  key={shape.id}
                  d={shape.d}
                  className={origin ? 'has-events' : undefined}
                  fill={origin ? alpha(RAMP_COLOR, intensity(origin.events, max)) : theme.palette.action.hover}
                  stroke={theme.palette.background.paper}
                  strokeWidth={0.5}
                />
              )
              return origin ? (
                <Tooltip key={shape.id} followCursor title={<OriginDetails name={shape.name} origin={origin} />}>
                  {path}
                </Tooltip>
              ) : (
                path
              )
            })}
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">Fewer</Typography>
            <Box
              sx={{
                width: 120,
                height: 8,
                borderRadius: 1,
                background: `linear-gradient(to right, ${alpha(RAMP_COLOR, MIN_OPACITY)}, ${RAMP_COLOR})`,
              }}
            />
            <Typography variant="caption" color="text.secondary">More events</Typography>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Top source countries · last {threatOrigins.days} days
          </Typography>
          <Stack spacing={1}>
            {top.map((origin) => (
              <Box key={origin.country}>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography variant="body2">{countryName(origin.country)}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{origin.events}</Typography>
                </Stack>
                <Box sx={{ height: 4, borderRadius: 1, bgcolor: 'action.hover' }}>
                  <Box
                    sx={{
                      height: '100%',
                      borderRadius: 1,
                      width: `${(origin.events / max) * 100}%`,
                      bgcolor: alpha(RAMP_COLOR, intensity(origin.events, max)),
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Stack>
          {threatOrigins.unknown > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              {threatOrigins.unknown} events with unknown origin
            </Typography>
          )}
        </Grid>
      </Grid>
    </Stack>
  )
}

function OriginDetails({ name, origin }: { name: string; origin: CountryOrigin }) {
  return (
    <>
      <Typography variant="subtitle2">{name}</Typography>
      <Typography variant="caption" component="div">{origin.events} events</Typography>
      <Typography variant="caption" component="div">{origin.critical_events} critical</Typography>
      <Typography variant="caption" component="div">
        {origin.distinct_sources} distinct source {origin.distinct_sources === 1 ? 'IP' : 'IPs'}
      </Typography>
    </>
  )
}
