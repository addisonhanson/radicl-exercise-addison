// Display helpers for KPI values. Null means "no data" and renders as an em dash.

export function formatCount(value: number | null): string {
  return value === null ? '—' : value.toLocaleString()
}

// Formats a duration in seconds as its two largest units, e.g. "4h 12m".
export function formatDuration(seconds: number | null): string {
  if (seconds === null) {
    return '—'
  }
  const s = Math.round(seconds)
  if (s < 60) {
    return `${s}s`
  }
  const minutes = Math.floor(s / 60)
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ${minutes % 60}m`
  }
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

// Formats a timestamp (ms since epoch) as a short local date and time, e.g. "Oct 12, 02:15 PM".
export function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
