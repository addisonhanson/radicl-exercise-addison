import { Alert, Grid, Stack } from '@mui/material'
import { useAppStore } from '../store/useAppStore'
import type { AnalyticsSummary } from '../types/api'
import { formatCount, formatDuration } from '../utils/format'
import { KpiCard } from './KpiCard'

interface KpiDefinition {
  title: string
  format: (value: number | null) => string
  period: '1d' | '7d'
  select: (summary: AnalyticsSummary) => { current: number | null; previous: number | null }
}

// Top row is the current situation, bottom row is response performance.
// Every metric here is better when lower, so the default higherIsBetter=false applies.
const kpis: KpiDefinition[] = [
  { title: 'Open Incidents', format: formatCount, period: '1d', select: (s) => s.open_incidents },
  { title: 'Assets at Risk', format: formatCount, period: '1d', select: (s) => s.assets_at_risk },
  { title: 'Events (24h)', format: formatCount, period: '1d', select: (s) => s.events_24h },
  {
    title: 'Mean Time to Detect (7d)',
    format: formatDuration,
    period: '7d',
    select: (s) => ({ current: s.mttd_7d.current_seconds, previous: s.mttd_7d.previous_seconds }),
  },
  {
    title: 'Mean Time to Resolve (7d)',
    format: formatDuration,
    period: '7d',
    select: (s) => ({ current: s.mttr_7d.current_seconds, previous: s.mttr_7d.previous_seconds }),
  },
  { title: 'Active Threat Campaigns (7d)', format: formatCount, period: '7d', select: (s) => s.active_threat_campaigns_7d },
]

export function KpiGrid() {
  const { summary, summaryError, summaryLoading } = useAppStore()

  return (
    <Stack spacing={2}>
      {summaryError && <Alert severity="error">{summaryError}</Alert>}
      <Grid container spacing={3}>
        {kpis.map((kpi) => {
          const values = summary ? kpi.select(summary) : { current: null, previous: null }
          return (
            <Grid key={kpi.title} size={{ xs: 12, md: 4 }}>
              <KpiCard
                title={kpi.title}
                current={values.current}
                previous={values.previous}
                format={kpi.format}
                period={kpi.period}
                loading={summaryLoading && !summary}
              />
            </Grid>
          )
        })}
      </Grid>
    </Stack>
  )
}
