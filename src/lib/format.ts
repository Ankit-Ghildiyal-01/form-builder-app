/** Shared date formatting, so timestamps read identically everywhere. */

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}

/** Full timestamp, e.g. `12 Mar 2025, 14:32`. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, DATE_TIME_OPTIONS)
}

/** Date only, e.g. `12 Mar 2025`. */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, DATE_OPTIONS)
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * Compact age for list views, e.g. `just now`, `12m ago`, `3h ago`, `5d ago`.
 * Falls back to an absolute date beyond a week, where "43d ago" stops being
 * easier to read than the date itself.
 */
export function formatRelative(iso: string): string {
  const timestamp = new Date(iso).getTime()
  if (Number.isNaN(timestamp)) return '—'

  const elapsed = Date.now() - timestamp
  if (elapsed < MINUTE) return 'just now'
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}d ago`
  return formatDate(iso)
}

/** `1 field` / `4 fields`, used across the template and instance lists. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}
