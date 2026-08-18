import type { Booking, Cadence, PujaOccurrence } from '@/lib/data/types'
import { PUJA_CATALOG, STANDARD_ADDONS, cadenceOptions, priceForCadence } from './catalog'
import { DEVOTEES } from './users'
import { addDays, chance, id, int, iso, pick, rng, today } from './seed'

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

function buildBookings(): Booking[] {
  const r = rng(430915)
  const base = today()
  const out: Booking[] = []

  for (let i = 0; i < 80; i++) {
    const user = pick(r, DEVOTEES)
    const puja = pick(r, PUJA_CATALOG)
    const options = cadenceOptions(puja)
    const cadence = options[Math.min(options.length - 1, pick(r, LADDER_CHOICE))]!
    const status = pick(r, STATUS_MIX)

    // Started somewhere in the last 11 months so renewals fall across the year.
    const startedDaysAgo = int(r, 5, 330)
    const startDate = addDays(base, -startedDaysAgo)
    const endDate = addDays(startDate, cadence === 'one-time' ? 1 : 365)

    const addOns = STANDARD_ADDONS.filter((a) =>
      a.price === 0 ? chance(r, 55) : chance(r, 28),
    ).map((a) => a.id)
    const addOnTotal = addOns.reduce(
      (s, a) => s + (STANDARD_ADDONS.find((x) => x.id === a)?.price ?? 0),
      0,
    )

    const sankalpamNames = [user.name]
    if (chance(r, 45)) sankalpamNames.push(`${user.name.split(' ')[0]} family`)

    out.push({
      id: id('bkg', i + 1),
      userId: user.id,
      pujaCatalogId: puja.id,
      cadence,
      startDate: iso(startDate),
      endDate: iso(endDate),
      sankalpamNames,
      addOns,
      amount: priceForCadence(puja, cadence) + addOnTotal,
      status,
      createdAt: iso(addDays(startDate, -int(r, 1, 9))),
    })
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
