import type { Booking, Cadence, PujaOccurrence, User } from '@/lib/data/types'
import { PUJA_CATALOG, STANDARD_ADDONS, cadenceOptions, priceForCadence } from './catalog'
import { DEVOTEES } from './users'
import type { Rand } from './seed'
import { addDays, chance, dayInYear, id, int, iso, pick, rng, today } from './seed'

export const OFFICIANTS = ['Ramesh Iyer', 'Sathish Sharma', 'Venkatesh Bhattar', 'Gopal Sastrigal']

/**
 * Which of a puja's permitted cadences a sponsor picks. Most take the rhythm the temple
 * recommends; a few step it up, a few step it down. Weighted toward the top of the range
 * so the roster carries realistic daily volume.
 */
const LADDER_CHOICE = [0, 1, 1, 1, 2, 2, 2, 2] as const

const STATUS_MIX: Booking['status'][] = [
  ...Array<Booking['status']>(11).fill('active'),
  ...Array<Booking['status']>(2).fill('completed'),
  'paused',
  'cancelled',
]

/**
 * The mix for a devotee's guaranteed sponsorship of the year. A cancelled booking is
 * refunded and so is excluded from the tax receipt — which would put the row back at
 * $0. Cancellations still occur, but only among the extra bookings below.
 */
const GUARANTEED_STATUS_MIX = STATUS_MIX.filter((s) => s !== 'cancelled')

/**
 * The extras carry the states the guaranteed pass cannot. Since every devotee is now
 * handed an uncancellable booking per year, drawing the extras from the ordinary mix
 * too would leave roughly one cancellation in the entire roster and give the Bookings
 * status filter nothing to show. These are weighted the other way to compensate.
 */
const EXTRA_STATUS_MIX: Booking['status'][] = [
  ...Array<Booking['status']>(5).fill('active'),
  ...Array<Booking['status']>(3).fill('completed'),
  ...Array<Booking['status']>(2).fill('paused'),
  ...Array<Booking['status']>(3).fill('cancelled'),
]

/** One sponsorship, paid for on `createdAt`. */
function makeBooking(
  r: Rand,
  n: number,
  user: User,
  createdAt: Date,
  base: Date,
  guaranteed = false,
): Booking {
  const puja = pick(r, PUJA_CATALOG)
  const options = cadenceOptions(puja)
  const cadence = options[Math.min(options.length - 1, pick(r, LADDER_CHOICE))]!

  // The temple takes payment a few days before the first puja is offered.
  const startDate = addDays(createdAt, int(r, 1, 9))
  const endDate = addDays(startDate, cadence === 'one-time' ? 1 : 365)

  const addOns = STANDARD_ADDONS.filter((a) => (a.price === 0 ? chance(r, 55) : chance(r, 28))).map(
    (a) => a.id,
  )
  const addOnTotal = addOns.reduce(
    (s, a) => s + (STANDARD_ADDONS.find((x) => x.id === a)?.price ?? 0),
    0,
  )

  const sankalpamNames = [user.name]
  if (chance(r, 45)) sankalpamNames.push(`${user.name.split(' ')[0]} family`)

  // A term that has already run out is completed, not active — the older half of the
  // roster is last year's sponsorships, and they should not still be listed as running.
  let status = pick(r, guaranteed ? GUARANTEED_STATUS_MIX : EXTRA_STATUS_MIX)
  if (status === 'active' && endDate.getTime() < base.getTime()) status = 'completed'

  return {
    id: id('bkg', n),
    userId: user.id,
    pujaCatalogId: puja.id,
    cadence,
    startDate: iso(startDate),
    endDate: iso(endDate),
    sankalpamNames,
    addOns,
    amount: priceForCadence(puja, cadence) + addOnTotal,
    status,
    createdAt: iso(createdAt),
  }
}

function buildBookings(): Booking[] {
  const r = rng(430915)
  const base = today()
  const thisYear = base.getFullYear()
  const out: Booking[] = []

  // Every devotee sponsors at least once in each of the last two tax years. Bulk tax
  // receipts are cut per devotee per year, so a devotee with no sponsorship in the
  // selected year printed a $0 in the Sponsorships column — true to the data, but it
  // read as a broken figure on more than half the rows. Guaranteeing coverage here is
  // what makes that column meaningful.
  for (const user of DEVOTEES) {
    for (const year of [thisYear - 1, thisYear]) {
      out.push(makeBooking(r, out.length + 1, user, dayInYear(r, year, base), base, true))
    }
  }

  // Extra sponsorships on top, so volume per devotee still varies rather than everyone
  // holding exactly one booking a year. Weighted to the current year for live volume.
  for (let i = 0; i < 26; i++) {
    const user = pick(r, DEVOTEES)
    const year = pick(r, [thisYear - 1, thisYear, thisYear])
    out.push(makeBooking(r, out.length + 1, user, dayInYear(r, year, base), base))
  }

  return out
}

export const BOOKINGS: Booking[] = buildBookings()

const NOTE_POOL = [
  'Family attending in person',
  'Prasadam to be couriered',
  'Sponsor requested livestream link',
  'Archana names read at the Amman sannidhi',
  'Rescheduled from the previous week',
]

/** Step for a cadence, in days. `yearly`/`one-time` are handled explicitly. */
const CADENCE_DAYS: Record<Cadence, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  quarterly: 91,
  yearly: 365,
  'one-time': 0,
}

/**
 * Materialises occurrences across a −14 → +30 day window from every active booking.
 * The backward half gives the admin app a plausible fulfilment history; the forward
 * half is the "next 30 days" the devotee dashboard and Today panel read from.
 */
function buildOccurrences(): PujaOccurrence[] {
  const r = rng(88123)
  const base = today()
  const now = Date.now()
  const from = -14
  const to = 30
  const out: PujaOccurrence[] = []
  let n = 0

  for (const b of BOOKINGS) {
    if (b.status !== 'active') continue
    const step = CADENCE_DAYS[b.cadence]
    const hour = pick(r, [8, 9, 11, 17, 18, 19])
    const minute = pick(r, [0, 15, 30])

    const offsets: number[] = []
    if (step === 0) {
      offsets.push(int(r, from, to))
    } else {
      // Anchor the series on the booking start date so each booking has its own rhythm.
      const startOffset = Math.round((new Date(b.startDate).getTime() - base.getTime()) / 86400000)
      let k = Math.ceil((from - startOffset) / step)
      for (;;) {
        const off = startOffset + k * step
        if (off > to) break
        if (off >= from) offsets.push(off)
        k++
      }
    }

    for (const off of offsets) {
      const at = addDays(base, off)
      at.setHours(hour, minute, 0, 0)
      const past = at.getTime() < now
      const skipped = past && chance(r, 4)
      n++
      out.push({
        id: id('occ', n),
        bookingId: b.id,
        scheduledAt: iso(at),
        fulfilledAt: past && !skipped ? iso(at) : undefined,
        officiant: pick(r, OFFICIANTS),
        notes: chance(r, 12) ? pick(r, NOTE_POOL) : undefined,
        status: skipped ? 'skipped' : past ? 'completed' : 'scheduled',
      })
    }
  }

  return out.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
}

export const OCCURRENCES: PujaOccurrence[] = buildOccurrences()

/** Total sponsorship revenue booked — feeds the $723K transparency reconciliation. */
export const BOOKINGS_REVENUE = BOOKINGS.filter((b) => b.status !== 'cancelled').reduce(
  (s, b) => s + b.amount,
  0,
)
