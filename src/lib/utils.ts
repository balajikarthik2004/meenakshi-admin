import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const usdCents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

/** Section 4: every amount is USD. Whole dollars unless the caller asks for cents. */
export const money = (n: number, cents = false) => (cents ? usdCents : usd).format(n)

/** Compact form for stat tiles — $723K, $1.2M. */
export function moneyShort(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`
  return usd.format(n)
}

const toDate = (d: string | Date) => (typeof d === 'string' ? parseISO(d) : d)

export function fmtDate(d: string | Date, pattern = 'MMM d, yyyy') {
  const date = toDate(d)
  return isValid(date) ? format(date, pattern) : '—'
}

export const fmtDay = (d: string | Date) => fmtDate(d, 'EEE, MMM d')
export const fmtDateTime = (d: string | Date) => fmtDate(d, "MMM d, yyyy 'at' h:mm a")
export const fmtTime = (d: string | Date) => fmtDate(d, 'h:mm a')

export function fmtRelative(d: string | Date) {
  const date = toDate(d)
  return isValid(date) ? `${formatDistanceToNowStrict(date)} ago` : '—'
}

export const pct = (n: number) => `${Math.round(n)}%`

export const titleCase = (s: string) =>
  s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

/** Escapes a value for CSV export (used by the devotee and admin download buttons). */
function csvCell(v: unknown) {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0]!)
  return [headers.join(','), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(','))].join(
    '\n',
  )
}

export function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Builds a Google Calendar "add event" link for the calendar day drawer. */
export function googleCalendarUrl(opts: {
  title: string
  start: Date
  durationMin?: number
  details?: string
  location?: string
}) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '')
  const end = new Date(opts.start.getTime() + (opts.durationMin ?? 60) * 60000)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: opts.title,
    dates: `${stamp(opts.start)}/${stamp(end)}`,
    details: opts.details ?? '',
    location: opts.location ?? '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
