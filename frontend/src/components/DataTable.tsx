import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import type { DataItem } from '../types/api'
import './DataTable.css'

interface DataTableProps {
  data: DataItem[]
}

export function DataTable({ data }: DataTableProps) {
  const columns = useMemo<ColumnDef<DataItem>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 80,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 200,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        size: 120,
        cell: ({ getValue }) => {
          const type = getValue<string>()
          return (
            <span className={`type-badge type-${type}`}>
              {type}
            </span>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  style={{ width: header.getSize() }}
                  onClick={header.column.getToggleSortingHandler()}
                  className={header.column.getCanSort() ? 'sortable' : ''}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {header.column.getIsSorted()
                    ? header.column.getIsSorted() === 'desc'
                      ? ' ↓'
                      : ' ↑'
                    : ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

