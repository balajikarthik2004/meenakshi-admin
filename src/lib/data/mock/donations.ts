import type { Donation, DonationCategory } from '@/lib/data/types'
import { BOOKINGS_REVENUE } from './bookings'
import { DEVOTEES } from './users'
import type { Rand } from './seed'
import { chance, dayInYear, id, int, iso, pick, rng, today } from './seed'

/** Perumal's headline number: pujas + donations must reconcile to exactly this. */
export const TOTAL_COLLECTED_TARGET = 723_000

export const DONATION_CATEGORIES: { key: DonationCategory; label: string; blurb: string }[] = [
  { key: 'general-hundi', label: 'E-Hundi', blurb: 'Wherever the need is greatest' },
  { key: 'annadanam', label: 'Annadanam', blurb: 'Free meals served every weekend' },
  { key: 'puja', label: 'Puja Fund', blurb: 'Flowers, dravyam and priest honorarium' },
  { key: 'abhishekam', label: 'Abhishekam', blurb: 'Milk, honey and sandal for the deities' },
  { key: 'goshala', label: 'Goshala', blurb: 'Care and feed for the temple cows' },
  { key: 'vedic-school', label: 'Vedic School', blurb: 'Weekend Sanskrit and chanting classes' },
  { key: 'building', label: 'Building Fund', blurb: 'Rajagopuram, halls and grounds' },
  { key: 'event', label: 'Event Sponsorship', blurb: 'Festival-specific sponsorship' },
]

const CATEGORY_KEYS = DONATION_CATEGORIES.map((c) => c.key)

const METHODS: Donation['paymentMethod'][] = [
  'card',
  'card',
  'card',
  'ach',
  'ach',
  'zelle',
  'zelle',
  'check',
  'cash',
]

const SMALL_AMOUNTS = [54, 54, 108, 108, 108, 251, 251, 501, 501, 1001, 1001, 2500]

const DEDICATIONS = [
  'In memory of my father',
  'For my daughter’s wedding',
  'Thanksgiving for a new home',
  'On my mother’s 80th birthday',
  'For my son’s upanayanam',
  'In gratitude for a safe recovery',
]

/**
 * 250 donations across the trailing 12 months. The tail is deliberately fat — the
 * building-fund majors are what carry a $1M temple budget, and Perumal's P&L needs
 * to look like a real ledger, not a uniform sample.
 */
/** One gift. `isMajor` gifts are the capital-campaign cheques that carry the budget. */
function makeDonation(
  r: Rand,
  n: number,
  userId: string | null,
  isMajor: boolean,
  createdAt: Date,
): Donation {
  const isRecurring = !isMajor && chance(r, 22)
  return {
    id: id('don', n),
    userId,
    category: isMajor ? 'building' : pick(r, CATEGORY_KEYS),
    amount: isMajor ? int(r, 12, 58) * 1000 : pick(r, SMALL_AMOUNTS),
    isRecurring,
    recurringCadence: isRecurring
      ? pick(r, ['monthly', 'quarterly', 'yearly'] as const)
      : undefined,
    paymentMethod: isMajor ? pick(r, ['ach', 'check'] as const) : pick(r, METHODS),
    dedicatedTo: chance(r, 26) ? pick(r, DEDICATIONS) : undefined,
    taxReceiptId: chance(r, 74) ? id('rcpt', n) : undefined,
    createdAt: iso(createdAt),
  }
}

function buildDonations(): Donation[] {
  const r = rng(9042117)
  const base = today()
  const thisYear = base.getFullYear()
  const out: Donation[] = []

  // Every devotee gives at least once in each of the last two tax years, for the same
  // reason the booking seed guarantees a sponsorship: a statement row with $0 against a
  // devotee's name is not a statement worth posting.
  for (const user of DEVOTEES) {
    for (const year of [thisYear - 1, thisYear]) {
      out.push(makeDonation(r, out.length + 1, user.id, false, dayInYear(r, year, base)))
    }
  }

  // The wider ledger on top — anonymous hundi gifts, recurring givers and the capital
  // majors, spread across both tax years.
  for (let i = 0; i < 220; i++) {
    const isMajor = i % 17 === 3
    const anonymous = chance(r, 9)
    const year = pick(r, [thisYear - 1, thisYear])
    out.push(
      makeDonation(
        r,
        out.length + 1,
        anonymous ? null : pick(r, DEVOTEES).id,
        isMajor,
        dayInYear(r, year, base),
      ),
    )
  }

  // Reconcile to the exact headline figure: scale the capital majors, then settle the
  // rounding remainder on the single largest gift. Small gifts keep their round values.
  const majors = out.filter((d) => d.amount >= 12000)
  const majorSum = majors.reduce((s, d) => s + d.amount, 0)
  const smallSum = out.reduce((s, d) => s + d.amount, 0) - majorSum
  const wanted = TOTAL_COLLECTED_TARGET - BOOKINGS_REVENUE - smallSum
  const factor = wanted / majorSum
  majors.forEach((d) => {
    d.amount = Math.round((d.amount * factor) / 100) * 100
  })
  const drift = TOTAL_COLLECTED_TARGET - BOOKINGS_REVENUE - out.reduce((s, d) => s + d.amount, 0)
  const anchor = majors.reduce((m, d) => (d.amount > m.amount ? d : m), majors[0]!)
  anchor.amount += drift

  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export const DONATIONS: Donation[] = buildDonations()

export const DONATIONS_REVENUE = DONATIONS.reduce((s, d) => s + d.amount, 0)
