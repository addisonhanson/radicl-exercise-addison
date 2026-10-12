import { Card, CardContent, Chip, Skeleton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'

interface KpiCardProps {
  title: string
  current: number | null
  previous: number | null
  format: (value: number | null) => string
  // The comparison window, shown as "vs <previous> yesterday" or "... last week".
  period: '1d' | '7d'
  // Whether an increase is good news. Drives the change chip's color, so a
  // rising MTTR shows a red up arrow rather than a green one.
  higherIsBetter?: boolean
  loading?: boolean
}

// Percent change from previous to current. There is no meaningful percentage
// when previous is zero, so no chip is shown then.
function ChangeChip({ current, previous, higherIsBetter }: {
  current: number
  previous: number
  higherIsBetter: boolean
}) {
  if (previous === 0) {
    return null
  }
  if (current === previous) {
    return <Chip size="small" label="0%" sx={compactChip} />
  }
  const increased = current > previous
  const percent = Math.round((Math.abs(current - previous) / previous) * 100)
  const color = increased === higherIsBetter ? 'success' : 'error'
  return (
    <Chip
      size="small"
      icon={increased ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
      label={percent === 0 ? '<1%' : `${percent}%`}
      // A soft tint rather than a solid fill, so the chip doesn't overpower the number.
      sx={(theme) => ({
        ...compactChip,
        color: theme.palette[color].light,
        bgcolor: alpha(theme.palette[color].main, 0.15),
        '& .MuiChip-icon': { color: 'inherit' },
      })}
    />
  )
}

const periodLabel = {
  '1d': 'yesterday',
  '7d': 'last week',
} as const

const compactChip = {
  height: 20,
  fontSize: '0.75rem',
  '& .MuiChip-label': { px: 0.75 },
  '& .MuiChip-icon': { fontSize: '0.875rem', ml: 0.5, mr: -0.25 },
}

export function KpiCard({
  title,
  current,
  previous,
  format,
  period,
  higherIsBetter = false,
  loading = false,
}: KpiCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          {loading ? (
            <>
              <Skeleton variant="text" width={96} sx={{ typography: 'h3' }} />
              <Skeleton variant="text" width={120} />
            </>
          ) : (
            <>
              <Typography variant="h3" component="p" sx={{ fontWeight: 'bold' }}>
                {format(current)}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                {current !== null && previous !== null && (
                  <ChangeChip current={current} previous={previous} higherIsBetter={higherIsBetter} />
                )}
                <Typography variant="body2" color="text.secondary">
                  vs{' '}
                  <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    {format(previous)}
                  </Typography>{' '}
                  {periodLabel[period]}
                </Typography>
              </Stack>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
