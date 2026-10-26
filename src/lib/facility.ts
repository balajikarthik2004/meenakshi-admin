import type {
  FacilityBooking,
  FacilityBookingStatus,
  FacilitySlotKey,
  FacilityVenue,
  Money,
} from '@/lib/data/types'
import { EVENT_TYPE_BY_KEY, SLOT_BY_KEY } from '@/lib/data/mock/facility'

/**
 * The hall availability engine.
 *
 * Everything that decides whether a date can be taken lives here rather than in the
 * two pages that ask. The devotee's calendar and the office's calendar have to agree
 * exactly — a date the devotee is allowed to request and the office is then told is
 * double-booked is worse than no calendar at all — and they only agree because both
 * call `slotAvailability` and neither re-implements it.
 *
 * Pure: no dates of its own, no API, no React. `now` is always passed in so the
 * notice-period rule can be tested, and so a calendar rendering next March does not
 * get a different answer than the server would.
 */

/** A calendar day, in the local sense the booking register uses. */
export const dayKey = (d: string | Date): string => {
  const date = typeof d === 'string' ? new Date(d) : d
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

/**
 * Does this booking still hold the room?
 *
 * A declined or cancelled request frees the slot immediately — that is the whole
 * reason the office declines one. A completed booking is in the past and holds
 * nothing, but it is left blocking its own day so the history stays legible.
 */
export const holdsVenue = (status: FacilityBookingStatus): boolean =>
  status === 'pending' || status === 'confirmed' || status === 'completed'

/**
 * Two slots collide if they are the same slot, or if either is the full day.
 *
 * Morning and evening are the only pair that can share a date.
 */
export function slotsCollide(a: FacilitySlotKey, b: FacilitySlotKey): boolean {
  if (a === b) return true
  return a === 'full-day' || b === 'full-day'
}

export type SlotState =
  /** Bookable now. */
  | { state: 'free' }
  /** Someone else holds it. */
  | { state: 'taken'; by: FacilityBooking }
  /** Inside the venue's notice period, in the past, or the venue is out of service. */
  | { state: 'closed'; reason: string }

/**
 * The state of one (venue, day, slot), against the register as it stands.
 *
 * `ignoreBookingId` lets the office re-decide a request without the request itself
 * reading as the clash — confirming a pending booking must not trip over its own
 * pending row.
 */
export function slotAvailability({
  venue,
  day,
  slot,
  bookings,
  now,
  ignoreBookingId,
  respectNotice = true,
}: {
  venue: FacilityVenue
  day: string | Date
  slot: FacilitySlotKey
  bookings: FacilityBooking[]
  now: Date
  ignoreBookingId?: string
  /**
   * The notice period is a rule for devotees, not a law of physics.
   *
   * The office takes a wedding at ten days' notice when it can staff it, so the
   * staff calendar passes `false` and sees the real picture: free, taken, or past.
   * The devotee's picker leaves it on, which is what stops a date being requested
   * that the office would only have to refuse.
   */
  respectNotice?: boolean
}): SlotState {
  const key = dayKey(day)

  if (!venue.active) return { state: 'closed', reason: `${venue.name} is out of service` }

  const noticeDays = daysBetween(now, new Date(key))
  if (noticeDays < 0) return { state: 'closed', reason: 'That date has passed' }
  if (respectNotice && noticeDays < venue.minNoticeDays) {
    return {
      state: 'closed',
      reason: `${venue.name} needs ${venue.minNoticeDays} days’ notice`,
    }
  }

  const clash = bookings.find(
    (b) =>
      b.id !== ignoreBookingId &&
      b.venueId === venue.id &&
      holdsVenue(b.status) &&
      dayKey(b.date) === key &&
      slotsCollide(b.slot, slot),
  )
  if (clash) return { state: 'taken', by: clash }

  return { state: 'free' }
}

/** Whole days from `from` to `to`, counting calendar days rather than 24-hour spans. */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((b - a) / 86_400_000)
}

export type DayAvailability = {
  day: string
  date: Date
  slots: Record<FacilitySlotKey, SlotState>
  /** `open` — something can still be booked. `partial` — one half left. */
  summary: 'open' | 'partial' | 'full' | 'closed'
}

/**
 * A venue's month, one entry per day, for the calendar both apps draw.
 *
 * The summary is derived from the two half-day slots rather than from all three:
 * `full-day` is free exactly when both halves are, so counting it as a third opinion
 * would make a day with a morning booking read as "partial" on one slot and "taken"
 * on another with no way to resolve the two.
 */
export function monthAvailability({
  venue,
  year,
  month,
  bookings,
  now,
  respectNotice = true,
}: {
  venue: FacilityVenue
  /** Four digits. */
  year: number
  /** 0-indexed, as `Date` has it. */
  month: number
  bookings: FacilityBooking[]
  now: Date
  /** See `slotAvailability` — off for the staff calendar. */
  respectNotice?: boolean
}): DayAvailability[] {
  const days = new Date(year, month + 1, 0).getDate()

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(year, month, i + 1)
    const opts = { venue, day: date, bookings, now, respectNotice }
    const slots = {
      morning: slotAvailability({ ...opts, slot: 'morning' }),
      evening: slotAvailability({ ...opts, slot: 'evening' }),
      'full-day': slotAvailability({ ...opts, slot: 'full-day' }),
    } satisfies Record<FacilitySlotKey, SlotState>

    const halves = [slots.morning, slots.evening]
    const free = halves.filter((s) => s.state === 'free').length
    const summary: DayAvailability['summary'] = halves.every((s) => s.state === 'closed')
      ? 'closed'
      : free === 2
        ? 'open'
        : free === 1
          ? 'partial'
          : 'full'

    return { day: dayKey(date), date, slots, summary }
  })
}

/**
 * What a booking costs.
 *
 * One function, called by the devotee's estimate panel and by the API that writes the
 * row, so the figure a family is shown is arithmetically the figure that gets stored.
 * The deposit is returned alongside but deliberately not folded into `total` — it is
 * refundable, and a quote that buries it reads as a price rise at the counter.
 */
export function priceBooking({
  venue,
  slot,
  items,
  discountPct,
}: {
  venue: FacilityVenue
  slot: FacilitySlotKey
  items: { label: string; qty: number; price: Money }[]
  discountPct: number
}) {
  const hireCharge = venue.rates[slot]
  const addOnsTotal = items.reduce<number>((s, it) => s + it.qty * it.price, 0)
  const discount = Math.round(((hireCharge + addOnsTotal) * discountPct) / 100)
  return {
    hireCharge,
    addOnsTotal,
    discountPct,
    discount,
    total: hireCharge + addOnsTotal - discount,
    deposit: venue.deposit,
  }
}

/* ------------------------------------------------------------------- labels */

export const slotLabel = (k: FacilitySlotKey) => SLOT_BY_KEY.get(k)?.label ?? k
export const slotHint = (k: FacilitySlotKey) => SLOT_BY_KEY.get(k)?.hint ?? ''
export const eventTypeLabel = (k: FacilityBooking['eventType']) =>
  EVENT_TYPE_BY_KEY.get(k)?.label ?? k

/** Counts for the office's stat tiles, in one pass. */
export function summariseFacility(bookings: FacilityBooking[], now: Date) {
  const pending = bookings.filter((b) => b.status === 'pending')
  const confirmed = bookings.filter((b) => b.status === 'confirmed')
  const upcoming = confirmed.filter((b) => new Date(b.date) >= now)
  return {
    total: bookings.length,
    pending: pending.length,
    confirmed: confirmed.length,
    upcoming: upcoming.length,
    /** Hire income on the book, deposits excluded — they go back. */
    bookedRevenue: confirmed.reduce((s, b) => s + b.total, 0),
    depositsHeld: confirmed
      .filter((b) => b.depositPaidAt)
      .reduce((s, b) => s + b.deposit, 0),
    /** The oldest request still waiting, which is what the queue is judged on. */
    oldestPending: pending
      .map((b) => b.createdAt)
      .sort()
      .at(0),
  }
}
