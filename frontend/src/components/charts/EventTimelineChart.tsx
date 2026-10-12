import { Alert, Box, Skeleton, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAppStore } from '../../store/useAppStore'
import { severityColors } from '../../theme/theme'

// Stacked bottom to top, so Critical sits on the baseline where it is easiest to read.
const severities = [
  { key: 'critical', label: 'Critical' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
] as const

// Buckets are rolling 24 hour windows, labelled by the day they end on.
const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

// Events per day over the last 30 days, stacked by severity.
export function EventTimelineChart() {
  const theme = useTheme()
  const { timeline, timelineError, timelineLoading } = useAppStore()

  if (timelineLoading && !timeline) {
    return <Skeleton variant="rounded" sx={{ flex: 1 }} />
  }
  if (!timeline) {
    return <Alert severity="error">{timelineError ?? 'Event timeline unavailable'}</Alert>
  }

  const axisTick = { fill: theme.palette.text.secondary, fontSize: 12 }

  return (
    <Stack sx={{ flex: 1, minHeight: 0 }}>
      {timelineError && <Alert severity="error" sx={{ mb: 2 }}>{timelineError}</Alert>}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeline.buckets} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={theme.palette.divider} vertical={false} />
            <XAxis
              dataKey="end"
              tickFormatter={formatDay}
              tick={axisTick}
              stroke={theme.palette.divider}
              minTickGap={24}
            />
            <YAxis allowDecimals={false} tick={axisTick} stroke={theme.palette.divider} width={40} />
            <Tooltip
              labelFormatter={(label) => formatDay(String(label))}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: theme.shape.borderRadius,
              }}
              labelStyle={{ color: theme.palette.text.primary }}
              itemStyle={{ color: theme.palette.text.primary }}
            />
            <Legend wrapperStyle={{ color: theme.palette.text.secondary, fontSize: 12 }} />
            {severities.map(({ key, label }) => (
              <Area
                key={key}
                dataKey={key}
                name={label}
                stackId="severity"
                type="monotone"
                stroke={severityColors[key]}
                strokeWidth={2}
                fill={severityColors[key]}
                fillOpacity={0.35}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Stack>
  )
}
