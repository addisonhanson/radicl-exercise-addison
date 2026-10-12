import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'

interface SortableTableProps<T> {
  data: T[]
  // Column value types vary per column, which ColumnDef can't express as one
  // array type without `any`; this is TanStack Table's documented pattern.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[]
  emptyMessage: string
  // The column that takes the spare width; the rest are sized to content.
  growColumn?: string
}

// A compact MUI table driven by TanStack Table, sortable by clicking a column
// header and scrolling under a sticky header. Rows keep the order they arrive
// in until a header is clicked. Pass columns defined outside the component so
// the reference is stable. It fills the remaining height of a flex-column
// parent and scrolls within it.
export function SortableTable<T>({ data, columns, emptyMessage, growColumn }: SortableTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <TableContainer sx={{ flex: 1, minHeight: 0 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => {
                const sorted = header.column.getIsSorted()
                return (
                  <TableCell
                    key={header.id}
                    sx={{ whiteSpace: 'nowrap', width: header.column.id === growColumn ? '100%' : undefined }}
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
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
