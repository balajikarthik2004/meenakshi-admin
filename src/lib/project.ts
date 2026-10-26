/**
 * What a capital project's numbers mean, in one place.
 *
 * Four screens across two apps publish these figures — the devotee project list and
 * its detail page, the admin register and the transparency dashboard — and the whole
 * point of the feature is that a devotee and the board read the same number. Deriving
 * it twice is how they stop agreeing, so it is derived here and nowhere else.
 *
 * Pure functions only, with no import from the data layer, so the seed, `api.ts` and a
 * render can all call it. Kept byte-identical in `meenakshi-admin/src/lib/project.ts`.
 */
import type { Money, Project } from '@/lib/data/types'

/** Filter chips, in the order a reader cares about them. */
export const PROJECT_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'in-progress', label: 'Under way' },
  { key: 'planned', label: 'Planned' },
  { key: 'completed', label: 'Completed' },
] as const

/**
 * How much of the target has been raised.
 *
 * Uncapped on purpose: a project that raised 104% of its target did, and rounding that
 * down to 100 would quietly delete the overfunding a board needs to see before it
 * reallocates. The progress bar clamps its own width; the number does not lie.
 */
export const fundingPct = (p: Project): number =>
  p.targetAmount > 0 ? (p.raisedAmount / p.targetAmount) * 100 : 0

/** Raised and not yet spent — the money actually sitting against this project. */
export const projectBalance = (p: Project): Money => p.raisedAmount - p.spentAmount

/** Still to raise. Never negative: an overfunded project needs nothing more. */
export const stillToRaise = (p: Project): Money => Math.max(0, p.targetAmount - p.raisedAmount)

/** What a project's expense lines actually add up to — the check on `spentAmount`. */
export const expensesTotal = (p: Project): Money => p.expenses.reduce((s, e) => s + e.amount, 0)

/**
 * Whether a project can take a gift right now.
 *
 * A completed project is closed even if its flag was left on, because money given to
 * finished work is money the devotee meant for something else.
 */
export const isOpenForDonations = (p: Project): boolean =>
  p.openForDonations && p.status !== 'completed'

export interface ProjectSummary {
  count: number
  /** Open for giving right now. */
  open: number
  completed: number
  target: Money
  raised: Money
  spent: Money
  /** Raised less spent, across the whole programme. */
  balance: Money
  /** Across live projects only — a completed project needs nothing more. */
  stillToRaise: Money
}

export function summariseProjects(projects: Project[]): ProjectSummary {
  const live = projects.filter((p) => p.status !== 'completed')
  return {
    count: projects.length,
    open: projects.filter(isOpenForDonations).length,
    completed: projects.filter((p) => p.status === 'completed').length,
    target: projects.reduce((s, p) => s + p.targetAmount, 0),
    raised: projects.reduce((s, p) => s + p.raisedAmount, 0),
    spent: projects.reduce((s, p) => s + p.spentAmount, 0),
    balance: projects.reduce((s, p) => s + projectBalance(p), 0),
    stillToRaise: live.reduce((s, p) => s + stillToRaise(p), 0),
  }
}

/**
 * The colour a funding bar should wear.
 *
 * Fully funded is green, close is gold, early is the brand red. The word beside the
 * bar always says the same thing, so the colour is a way of scanning a list quickly
 * rather than the only way of knowing where a project stands.
 */
export function fundingTone(p: Project): 'brand' | 'gold' | 'leaf' {
  const pctRaised = fundingPct(p)
  if (pctRaised >= 100) return 'leaf'
  return pctRaised >= 60 ? 'gold' : 'brand'
}
