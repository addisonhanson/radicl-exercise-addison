import { useState } from 'react'
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { severityColors } from '../../theme/theme'
import type { OpenEventItem, Severity } from '../../types/api'

const severityRank: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }

const formatDateTime = (ms: number) =>
  new Date(ms).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

const column = createColumnHelper<OpenEventItem>()

// Takes the spare width; every other column is sized to its content.
const THREAT_COLUMN = 'threat'

// Defined outside the component so TanStack Table sees a stable reference.
const columns = [
  column.accessor('severity', {
    header: 'Severity',
    // Sort by rank, not alphabetically; ascending puts Critical first.
    sortingFn: (a, b, id) =>
      severityRank[a.getValue<Severity>(id)] - severityRank[b.getValue<Severity>(id)],
    cell: (info) => (
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            flexShrink: 0,
            bgcolor: severityColors[info.getValue().toLowerCase() as Lowercase<Severity>],
          }}
        />
        <span>{info.getValue()}</span>
      </Stack>
    ),
  }),
  // The main column. Most events aren't linked to a known threat, so those
  // fall back to the event type, muted, rather than an empty cell.
  column.accessor((row) => row.threat_name ?? row.event_type, {
    id: THREAT_COLUMN,
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
  maxHeight: number
}

// Sortable list of open events. Rows arrive already ordered by severity then
// newest first, which is the order shown until a column header is clicked.
export function OpenEventsTable({ events, maxHeight }: OpenEventsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data: events,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <TableContainer sx={{ maxHeight }}>
      <Table size="small" stickyHeader>
        <TableHead>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => {
                const sorted = header.column.getIsSorted()
                return (
                  <TableCell
                    key={header.id}
                    sx={{ whiteSpace: 'nowrap', width: header.column.id === THREAT_COLUMN ? '100%' : undefined }}
                  >
                    <TableSortLabel
                      active={sorted !== false}
                      direction={sorted || 'asc'}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableSortLabel>
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} hover>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} sx={{ whiteSpace: 'nowrap' }}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {events.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                No open incidents
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
