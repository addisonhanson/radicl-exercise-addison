import { Box, ButtonBase, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { severityColors } from '../../theme/theme'
import type { Severity, SeverityCounts } from '../../types/api'

// Recharts needs a type alias rather than an interface for chart data.
type Slice = {
  severity: Severity
  key: keyof SeverityCounts
  count: number
}

interface SeverityDonutProps {
  counts: SeverityCounts
  total: number
  selected: Severity | null
  onSelect: (severity: Severity | null) => void
}

const DONUT_SIZE = 200

// Open incidents split by severity. Clicking a slice or legend row selects
// that severity (clicking it again clears it); the other slices fade back.
export function SeverityDonut({ counts, total, selected, onSelect }: SeverityDonutProps) {
  const theme = useTheme()

  const slices: Slice[] = [
    { severity: 'Critical', key: 'critical', count: counts.critical },
    { severity: 'High', key: 'high', count: counts.high },
    { severity: 'Medium', key: 'medium', count: counts.medium },
    { severity: 'Low', key: 'low', count: counts.low },
  ]

  const toggle = (severity: Severity) => onSelect(selected === severity ? null : severity)
  const centerCount = selected ? counts[slices.find((s) => s.severity === selected)!.key] : total

  return (
    <Stack spacing={2} sx={{ alignItems: 'center' }}>
      <Box sx={{ position: 'relative', width: DONUT_SIZE, height: DONUT_SIZE }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="count"
              nameKey="severity"
              innerRadius="62%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              // A surface-colored stroke leaves a small gap between slices.
              stroke={theme.palette.background.paper}
              strokeWidth={2}
              onClick={(_, index) => toggle(slices[index].severity)}
              style={{ cursor: 'pointer' }}
            >
              {slices.map((slice) => (
                <Cell
                  key={slice.key}
                  fill={severityColors[slice.key]}
                  fillOpacity={selected && selected !== slice.severity ? 0.25 : 1}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: theme.shape.borderRadius,
              }}
              itemStyle={{ color: theme.palette.text.primary }}
            />
          </PieChart>
        </ResponsiveContainer>
        <Stack
          sx={{
            position: 'absolute',
            inset: 0,
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <Typography variant="h4" component="p" sx={{ fontWeight: 'bold' }}>
            {centerCount}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {selected ?? 'open'}
          </Typography>
        </Stack>
      </Box>

      {/* Legend doubles as a larger click target and carries the exact counts. */}
      <Stack sx={{ width: '100%', maxWidth: 220 }}>
        {slices.map((slice) => (
          <ButtonBase
            key={slice.key}
            onClick={() => toggle(slice.severity)}
            sx={{
              justifyContent: 'space-between',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              opacity: selected && selected !== slice.severity ? 0.5 : 1,
              bgcolor: selected === slice.severity ? 'action.selected' : 'transparent',
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: severityColors[slice.key] }} />
              <Typography variant="body2">{slice.severity}</Typography>
            </Stack>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {slice.count}
            </Typography>
          </ButtonBase>
        ))}
      </Stack>
    </Stack>
  )
}
