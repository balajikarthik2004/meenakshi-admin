/**
 * Everything a pledge means, in one place.
 *
 * The arithmetic of a promise — what is owed, what has arrived, what is late — is
 * asked by five screens across two apps, and the answer has to be the same on all of
 * them. A devotee reading "$400 outstanding" on their own page while the accounts desk
 * reads "$500" off the register is the one bug this feature cannot afford, so every
 * figure is derived here and nowhere else.
 *
 * Pure functions only, with no import from the data layer, so the seed, `api.ts` and a
 * render can all call it. Kept byte-identical in `meenakshi-admin/src/lib/pledge.ts`.
 */
import type {
  ISODate,
  Money,
  Pledge,
  PledgeCadence,
  PledgeInstallment,
  UUID,
} from '@/lib/data/types'

/** Offered in the order a devotee thinks of them — one gift first, then repeating. */
export const PLEDGE_CADENCES: PledgeCadence[] = ['one-time', 'monthly', 'quarterly', 'yearly']

/** Months between instalments. `one-time` has no second instalment to space from. */
const MONTHS_PER_PERIOD: Record<PledgeCadence, number> = {
  'one-time': 0,
  monthly: 1,
  quarterly: 3,
  yearly: 12,
}

/** How many instalments a devotee may promise, per cadence. */
export const MAX_INSTALLMENTS: Record<PledgeCadence, number> = {
  'one-time': 1,
  monthly: 36,
  quarterly: 20,
  yearly: 10,
}

/**
 * Calendar-safe month arithmetic.
 *
 * `setMonth` alone turns the 31st of January into the 2nd of March, which would
 * quietly shift a devotee's pledge date by two days every time February came round.
 * Clamping to the last day of the shorter month is what "the 31st, monthly" has to
 * mean for the dates to stay the ones they agreed to.
 */
export function addMonths(base: Date, months: number): Date {
  const d = new Date(base)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, lastDay))
  return d
}

/**
 * Midday on a given day.
 *
 * A due date is a day, not an instant. Pinned at midnight it serialises to the
 * previous date for anyone east of UTC, and a pledge that reads "due 1 December" in
 * the office and "30 November" on the devotee's phone is a support call. Midday is far
 * enough from either edge that no timezone reaches it.
 */
export function dueISO(d: Date): ISODate {
  const x = new Date(d)
  x.setHours(12, 0, 0, 0)
  return x.toISOString()
}

/** `yyyy-mm-dd` from a date input, read as a local day rather than as UTC midnight. */
export const dateInputToISO = (value: string): ISODate => dueISO(new Date(`${value}T12:00:00`))

/** The inverse — an ISO date in the `yyyy-mm-dd` shape `<input type="date">` wants. */
export function isoToDateInput(iso: ISODate): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Tomorrow — the earliest a pledge may fall due, since a gift dated today is a gift. */
export function earliestStart(now = new Date()): Date {
  const d = new Date(now)
  d.setDate(d.getDate() + 1)
  d.setHours(12, 0, 0, 0)
  return d
}

/**
 * The three dates a devotee actually asks for, as buttons.
 *
 * "Next month" means the 1st of it, not this same date next month: a pledge is a
 * calendar commitment, and the 1st is the day a household budget turns over. The free
 * date field beside them covers everything else.
 */
export function startDatePresets(now = new Date()): { key: string; label: string; date: Date }[] {
  const y = now.getFullYear()
  const m = now.getMonth()
  const noon = (d: Date) => {
    d.setHours(12, 0, 0, 0)
    return d
  }
  return [
    { key: 'next-month', label: 'Next month', date: noon(new Date(y, m + 1, 1)) },
    {
      key: 'next-quarter',
      label: 'Next quarter',
      date: noon(new Date(y, (Math.floor(m / 3) + 1) * 3, 1)),
    },
    { key: 'next-year', label: 'Next year', date: noon(new Date(y + 1, 0, 1)) },
  ]
}

/** The dated promises a plan comes to. Ids are positional, so they survive a reload. */
export function buildSchedule(
  pledgeId: UUID,
  plan: { startDate: ISODate; amount: Money; cadence: PledgeCadence; count: number },
): PledgeInstallment[] {
  const first = new Date(plan.startDate)
  const step = MONTHS_PER_PERIOD[plan.cadence]
  const n =
    plan.cadence === 'one-time'
      ? 1
      : Math.max(1, Math.min(plan.count, MAX_INSTALLMENTS[plan.cadence]))

  return Array.from({ length: n }, (_, i) => ({
    id: `${pledgeId}-${i + 1}`,
    dueDate: dueISO(addMonths(first, step * i)),
    amount: plan.amount,
    status: 'due' as const,
  }))
}

export interface PledgeTotals {
  /** Everything promised, paid or not. */
  pledged: Money
  /** What has actually reached the ledger against this promise. */
  received: Money
  /** Still owed. A cancelled pledge owes nothing, whatever its schedule says. */
  outstanding: Money
  paidCount: number
  dueCount: number
  overdueCount: number
  overdueAmount: Money
}

export function pledgeTotals(p: Pledge, now = new Date()): PledgeTotals {
  const live = p.status !== 'cancelled'
  const paid = p.installments.filter((i) => i.status === 'paid')
  const unpaid = p.installments.filter((i) => i.status === 'due')
  const overdue = live ? unpaid.filter((i) => new Date(i.dueDate).getTime() < now.getTime()) : []

  return {
    pledged: p.installments.reduce((s, i) => s + i.amount, 0),
    received: paid.reduce((s, i) => s + i.amount, 0),
    outstanding: live ? unpaid.reduce((s, i) => s + i.amount, 0) : 0,
    paidCount: paid.length,
    dueCount: unpaid.length,
    overdueCount: overdue.length,
    overdueAmount: overdue.reduce((s, i) => s + i.amount, 0),
  }
}

/** The instalment to chase, or to offer a "pay now" button against. */
export function nextDue(p: Pledge): PledgeInstallment | undefined {
  if (p.status === 'cancelled' || p.status === 'fulfilled') return undefined
  return [...p.installments]
    .filter((i) => i.status === 'due')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
}

export const isOverdue = (i: PledgeInstallment, now = new Date()) =>
  i.status === 'due' && new Date(i.dueDate).getTime() < now.getTime()

/**
 * The status a pledge's own schedule implies.
 *
 * Called after every change, so the badge and the instalment rows can never disagree.
 * Cancellation is the one state a schedule cannot reach on its own — somebody decided
 * it — so it is returned untouched.
 */
export function derivePledgeStatus(p: Pledge, now = new Date()): Pledge['status'] {
  if (p.status === 'cancelled') return 'cancelled'
  const settled = p.installments.filter((i) => i.status !== 'due')
  const paid = p.installments.filter((i) => i.status === 'paid')
  if (settled.length === p.installments.length) return paid.length > 0 ? 'fulfilled' : 'lapsed'
  if (paid.length > 0) return 'partially-fulfilled'
  // Nothing paid and every date already gone by: the promise was not kept.
  const allPast = p.installments.every((i) => new Date(i.dueDate).getTime() < now.getTime())
  return allPast ? 'lapsed' : 'scheduled'
}

/** How far along a pledge is, by money rather than by instalment count. */
export function pledgeProgressPct(p: Pledge): number {
  const { pledged, received } = pledgeTotals(p)
  return pledged > 0 ? (received / pledged) * 100 : 0
}

/** "12 monthly payments of $108" — the plan in one line, used on five screens. */
export function describePlan(
  plan: { amount: Money; cadence: PledgeCadence; count: number },
  fmtMoney: (n: number) => string,
): string {
  if (plan.cadence === 'one-time') return `A single payment of ${fmtMoney(plan.amount)}`
  return `${plan.count} ${plan.cadence} payments of ${fmtMoney(plan.amount)}`
}

/**
 * Totals across a set of pledges — what both dashboards and the register publish.
 *
 * The two halves are scoped differently on purpose. What is *owed* counts live pledges
 * only: a written-off promise is not outstanding work, and leaving it in would keep
 * the office chasing a figure it has already decided to stop chasing. What has been
 * *received* counts every pledge, cancelled ones included — that money arrived, it is
 * in the ledger, and a devotee who paid two instalments before withdrawing does not
 * stop having paid them.
 */
export function summarisePledges(pledges: Pledge[], now = new Date()) {
  const horizon = now.getTime() + 30 * 86400000
  const live = pledges.filter((p) => p.status !== 'cancelled')
  let pledged = 0
  let outstanding = 0
  let overdue = 0
  let dueSoon = 0

  for (const p of live) {
    const t = pledgeTotals(p, now)
    pledged += t.pledged
    outstanding += t.outstanding
    overdue += t.overdueAmount
    dueSoon += p.installments
      .filter((i) => {
        if (i.status !== 'due') return false
        const at = new Date(i.dueDate).getTime()
        return at >= now.getTime() && at <= horizon
      })
      .reduce((s, i) => s + i.amount, 0)
  }

  const received = pledges.reduce((s, p) => s + pledgeTotals(p, now).received, 0)

  return { count: live.length, pledged, received, outstanding, overdue, dueSoon }
}
