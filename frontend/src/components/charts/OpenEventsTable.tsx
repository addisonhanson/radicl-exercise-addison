import { Box } from '@mui/material'
import { createColumnHelper } from '@tanstack/react-table'
import type { OpenEventItem } from '../../types/api'
import { formatDateTime } from '../../utils/format'
import { sortBySeverity } from '../../utils/severity'
import { SeverityLabel } from './SeverityLabel'
import { SortableTable } from './SortableTable'

const column = createColumnHelper<OpenEventItem>()

const columns = [
  column.accessor('severity', {
    header: 'Severity',
    sortingFn: sortBySeverity,
    cell: (info) => <SeverityLabel severity={info.getValue()} />,
  }),
  // The main column. Most events aren't linked to a known threat, so those
  // fall back to the event type, muted, rather than an empty cell.
  column.accessor((row) => row.threat_name ?? row.event_type, {
    id: 'threat',
    header: 'Threat',
    cell: (info) => {
      const { threat_name, event_type } = info.row.original
      return threat_name ?? (
        <Box component="span" sx={{ color: 'text.secondary' }}>
          {event_type} (unattributed)
        </Box>
      )
    },
  }),
  column.accessor('hostname', { header: 'Asset' }),
  column.accessor((row) => Date.parse(row.detected_at), {
    id: 'detected',
    header: 'Detected',
    cell: (info) => formatDateTime(info.getValue()),
  }),
  column.accessor('status', { header: 'Status' }),
]

interface OpenEventsTableProps {
  events: OpenEventItem[]
}

// Open events, arriving ordered by severity then newest first.
export function OpenEventsTable({ events }: OpenEventsTableProps) {
  return (
    <SortableTable
      data={events}
      columns={columns}
      emptyMessage="No open incidents"
      growColumn="threat"
    />
  )
}
