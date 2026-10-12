import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { createColumnHelper } from '@tanstack/react-table'
import { useAppStore } from '../../store/useAppStore'
import type { AssetAtRisk, Environment } from '../../types/api'
import { sortBySeverity } from '../../utils/severity'
import { SeverityLabel } from './SeverityLabel'
import { SortableTable } from './SortableTable'

const environments: Environment[] = ['Production', 'Staging', 'Development']

const column = createColumnHelper<AssetAtRisk>()

const columns = [
  column.accessor('criticality', {
    header: 'Criticality',
    sortingFn: sortBySeverity,
    cell: (info) => <SeverityLabel severity={info.getValue()} />,
  }),
  column.accessor('hostname', {
    header: 'Asset',
    cell: (info) => (
      <>
        {info.getValue()}
        <Box component="span" sx={{ color: 'text.secondary', ml: 1 }}>
          {info.row.original.asset_type}
        </Box>
      </>
    ),
  }),
  column.accessor('risk_score', {
    header: 'Risk Score',
    cell: (info) => <Box component="span" sx={{ fontWeight: 'bold' }}>{info.getValue()}</Box>,
  }),
  column.accessor('environment', { header: 'Environment' }),
  column.accessor('open_events', {
    header: 'Open Events',
    cell: (info) => {
      const critical = info.row.original.critical_events
      return (
        <>
          {info.getValue()}
          {critical > 0 && (
            <Box component="span" sx={{ color: 'text.secondary', ml: 1 }}>
              {critical} critical
            </Box>
          )}
        </>
      )
    },
  }),
]

// Assets with open events, riskiest first, filterable by environment and a
// hostname search.
export function AssetsAtRiskChart() {
  const { assetsAtRisk, assetsAtRiskError, assetsAtRiskLoading } = useAppStore()
  const [environment, setEnvironment] = useState<Environment | null>(null)
  const [search, setSearch] = useState('')

  const assets = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (assetsAtRisk?.assets ?? []).filter(
      (asset) =>
        (!environment || asset.environment === environment) &&
        (!query || asset.hostname.toLowerCase().includes(query)),
    )
  }, [assetsAtRisk, environment, search])

  if (assetsAtRiskLoading && !assetsAtRisk) {
    return <Skeleton variant="rounded" sx={{ flex: 1 }} />
  }
  if (!assetsAtRisk) {
    return <Alert severity="error">{assetsAtRiskError ?? 'Assets at risk unavailable'}</Alert>
  }

  return (
    <Stack sx={{ flex: 1, minHeight: 0 }}>
      {assetsAtRiskError && <Alert severity="error" sx={{ mb: 2 }}>{assetsAtRiskError}</Alert>}
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search hosts"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={environment ?? 'All'}
          onChange={(_event, value: Environment | 'All' | null) =>
            // Clicking the active button sends null; keep the current filter.
            value !== null && setEnvironment(value === 'All' ? null : value)
          }
        >
          <ToggleButton value="All" sx={{ textTransform: 'none' }}>All</ToggleButton>
          {environments.map((env) => (
            <ToggleButton key={env} value={env} sx={{ textTransform: 'none' }}>
              {env}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {assets.length} of {assetsAtRisk.assets.length} assets
        </Typography>
      </Stack>
      <SortableTable
        data={assets}
        columns={columns}
        emptyMessage="No assets match these filters"
        growColumn="hostname"
      />
    </Stack>
  )
}
