import type { Pledge, PledgeCadence } from '@/lib/data/types'
import { buildSchedule, derivePledgeStatus } from '@/lib/pledge'
import { DONATION_CATEGORIES } from './donations'
import { DEVOTEES } from './users'
import { chance, id, int, pick, rng, today } from './seed'

/**
 * Pledges the temple is already holding — promises, not money.
 *
 * Every seeded pledge is forward-only: no instalment starts life paid. That is a
 * deliberate constraint rather than laziness. A "paid" instalment has to point at a
 * real `Donation`, and `DONATIONS` is built to reconcile to exactly $723,000 — the
 * figure the public transparency strip publishes. Seeding a settled instalment would
 * either dangle a reference to a donation that does not exist, or add one and break
 * the reconciliation the whole seed is arranged around. Payment history therefore
 * begins the first time somebody settles an instalment through the app, which routes
 * through `settlePledgeInstallment` and mints a genuine ledger entry.
 *
 * The spread still gives both consoles something real to work with: some pledges fall
 * due months out, some are overdue and wanting a reminder, and a couple were written
 * off — which is what the register's status filter is for.
 */

/** Festival sponsorship is excluded on purpose — see the note in `Donate.tsx`. */
const PLEDGEABLE = DONATION_CATEGORIES.map((c) => c.key).filter((k) => k !== 'event')

const CADENCES: PledgeCadence[] = ['one-time', 'monthly', 'monthly', 'quarterly', 'yearly']

/**
 * A one-off promise can be a major gift. A repeating one cannot be the same figure —
 * $5,000 monthly for two years is $120,000 from a single household, which would leave
 * the pledge book larger than the temple's entire operating year and every tile built
 * on it reading like a typo.
 */
const ONCE_AMOUNTS = [251, 501, 1001, 2500, 5000, 10000]
const REPEAT_AMOUNTS = [54, 108, 108, 251, 251, 501]

const NOTES = [
  'After the house sale closes in the spring.',
  'Matching whatever my brother gives this year.',
  'Paid by cheque at the office on the first Sunday.',
  'From the year-end bonus.',
  'In three parts, as agreed with the office.',
]

const DEDICATIONS = [
  'In memory of my father',
  'For my daughter’s wedding',
  'On my mother’s 80th birthday',
  'In gratitude for a safe recovery',
]

/** Instalments per cadence — a yearly pledge over ten years is not a realistic promise. */
const COUNT_RANGE: Record<PledgeCadence, [number, number]> = {
  'one-time': [1, 1],
  monthly: [6, 24],
  quarterly: [4, 8],
  yearly: [2, 5],
}

function buildPledges(): Pledge[] {
  const r = rng(4471903)
  const base = today()
  const out: Pledge[] = []

  for (let i = 0; i < 24; i++) {
    const n = i + 1
    const pledgeId = id('pld', n)
    // Two were promised for a date that has now passed and never arrived. They are
    // the only way `lapsed` — and the status filter that selects it — is reachable in
    // a seed where nothing has been paid yet.
    const abandoned = i === 3 || i === 11
    const cadence: PledgeCadence = abandoned ? 'one-time' : pick(r, CADENCES)
    const [lo, hi] = COUNT_RANGE[cadence]
    const user = pick(r, DEVOTEES)

    // A fifth of the register is already late — otherwise the chase list, the overdue
    // tile and the reminder button are all features with nothing to act on.
    const late = abandoned || chance(r, 22)
    // A third of what is not already late falls inside the month, so "due in the next
    // 30 days" is a figure the office can actually act on rather than a standing zero.
    const soon = !late && chance(r, 34)
    const offsetDays = late ? -int(r, 12, 150) : soon ? int(r, 3, 28) : int(r, 35, 300)
    const start = new Date(base)
    start.setDate(start.getDate() + offsetDays)
    start.setHours(12, 0, 0, 0)

    const pledge: Pledge = {
      id: pledgeId,
      userId: user.id,
      category: pick(r, PLEDGEABLE),
      amount: cadence === 'one-time' ? pick(r, ONCE_AMOUNTS) : pick(r, REPEAT_AMOUNTS),
      cadence,
      startDate: start.toISOString(),
      installments: [],
      dedicatedTo: chance(r, 24) ? pick(r, DEDICATIONS) : undefined,
      intendedMethod: pick(r, ['check', 'ach', 'zelle', 'card'] as const),
      note: chance(r, 38) ? pick(r, NOTES) : undefined,
      status: 'scheduled',
      // Dated before the first instalment falls due, which is what makes it a promise.
      createdAt: new Date(start.getTime() - int(r, 10, 90) * 86400000).toISOString(),
    }

    pledge.installments = buildSchedule(pledgeId, {
      startDate: pledge.startDate,
      amount: pledge.amount,
      cadence,
      count: int(r, lo, hi),
    })

    // Two in the set were withdrawn. A register with no cancelled row makes the status
    // filter look decorative.
    if (i === 6 || i === 17) {
      pledge.status = 'cancelled'
      pledge.cancelledAt = new Date(base.getTime() - int(r, 3, 40) * 86400000).toISOString()
    } else {
      pledge.status = derivePledgeStatus(pledge, base)
    }

    out.push(pledge)
  }

  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export const PLEDGES: Pledge[] = buildPledges()
