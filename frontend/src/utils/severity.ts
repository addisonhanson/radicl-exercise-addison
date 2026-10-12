import type { Row } from '@tanstack/react-table'
import type { Severity } from '../types/api'

// Severity rank; ascending puts Critical first.
export const severityRank: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }

// TanStack Table sortingFn that orders a severity column by rank rather
// than alphabetically.
export function sortBySeverity<T>(a: Row<T>, b: Row<T>, columnId: string): number {
  return severityRank[a.getValue<Severity>(columnId)] - severityRank[b.getValue<Severity>(columnId)]
}
