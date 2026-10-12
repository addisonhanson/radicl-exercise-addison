import { useMemo, useState } from 'react'
import { Alert, Chip, Grid, Skeleton, Stack, Typography } from '@mui/material'
import { useAppStore } from '../../store/useAppStore'
import type { Severity } from '../../types/api'
import { OpenEventsTable } from './OpenEventsTable'
import { SeverityDonut } from './SeverityDonut'

const PANEL_HEIGHT = 320

// Severity donut beside the open events that make it up. Selecting a
// severity in the donut filters the table to it.
export function OpenIncidentsChart() {
  const { openEvents, openEventsError, openEventsLoading } = useAppStore()
  const [selected, setSelected] = useState<Severity | null>(null)

  const events = useMemo(() => {
    const all = openEvents?.events ?? []
    return selected ? all.filter((event) => event.severity === selected) : all
  }, [openEvents, selected])

  if (openEventsLoading && !openEvents) {
    return <Skeleton variant="rounded" height={PANEL_HEIGHT} />
  }
  if (!openEvents) {
    return <Alert severity="error">{openEventsError ?? 'Open incidents unavailable'}</Alert>
  }

  return (
    <>
      {openEventsError && <Alert severity="error" sx={{ mb: 2 }}>{openEventsError}</Alert>}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SeverityDonut
            counts={openEvents.by_severity}
            total={openEvents.total}
            selected={selected}
            onSelect={setSelected}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1, minHeight: 24 }}>
            <Typography variant="body2" color="text.secondary">
              {events.length} open {events.length === 1 ? 'incident' : 'incidents'}
            </Typography>
            {selected && <Chip size="small" label={selected} onDelete={() => setSelected(null)} />}
          </Stack>
          <OpenEventsTable events={events} maxHeight={PANEL_HEIGHT} />
        </Grid>
      </Grid>
    </>
  )
}
