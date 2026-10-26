/**
 * Who may hold which membership, and what it costs.
 *
 * The senior rate is age-restricted, which makes it the first thing in this app whose
 * price depends on a fact about the person rather than on what they chose. That rule
 * has to be computed the same way in three places — the devotee's own enrolment page,
 * the console that grants a membership on someone's behalf, and the seed — so it is
 * computed here and nowhere else.
 *
 * Pure functions only, with no import from the data layer. Kept byte-identical in
 * `meenakshi-admin/src/lib/membership.ts`.
 */
import type { ISODate, Membership, MembershipTier, User } from '@/lib/data/types'

/** The age at which the concessional rate applies, on the day of enrolment. */
export const SENIOR_MIN_AGE = 65

/** Added to either tier for a family plan — spouse and minor children. */
export const FAMILY_PLAN_SURCHARGE = 100

/**
 * Completed years, not elapsed years.
 *
 * Someone whose sixty-fifth birthday is tomorrow is sixty-four today, and a rate that
 * turned on a decimal would let them in a day early and then argue about it at the
 * desk. The month-and-day comparison is the whole reason this is not a subtraction.
 */
export function ageOn(dob: ISODate | undefined, on: Date = new Date()): number | null {
  if (!dob) return null
  const born = new Date(dob)
  if (Number.isNaN(born.getTime())) return null

  let years = on.getFullYear() - born.getFullYear()
  const monthDiff = on.getMonth() - born.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && on.getDate() < born.getDate())) years -= 1
  return years
}

export type EligibilityReason = 'eligible' | 'too-young' | 'no-dob'

/**
 * Whether a person may take a tier, and if not, which of the two reasons applies.
 *
 * "We don't know your date of birth" and "you are not old enough" need different
 * answers from the UI — the first is fixable in thirty seconds on the profile page,
 * the second is not — so they are never collapsed into a single `false`.
 */
export function eligibilityFor(
  tier: MembershipTier,
  user: Pick<User, 'dob'>,
  on: Date = new Date(),
): EligibilityReason {
  if (tier !== 'senior') return 'eligible'
  const age = ageOn(user.dob, on)
  if (age === null) return 'no-dob'
  return age >= SENIOR_MIN_AGE ? 'eligible' : 'too-young'
}

export const isEligibleFor = (
  tier: MembershipTier,
  user: Pick<User, 'dob'>,
  on: Date = new Date(),
): boolean => eligibilityFor(tier, user, on) === 'eligible'

/**
 * The tier a devotee should be offered first.
 *
 * A seventy-year-old shown the full rate at the top of the page and the concession
 * below it will quite often pay the full rate, which is not generosity — it is the
 * page failing to tell them something they were entitled to know.
 */
export const suggestedTier = (user: Pick<User, 'dob'>, on: Date = new Date()): MembershipTier =>
  isEligibleFor('senior', user, on) ? 'senior' : 'normal'

export const priceFor = (basePrice: number, familyPlan: boolean): number =>
  basePrice + (familyPlan ? FAMILY_PLAN_SURCHARGE : 0)

/** Days until a membership lapses — negative once it already has. */
export function daysUntilRenewal(m: Membership, on: Date = new Date()): number {
  return Math.ceil((new Date(m.endDate).getTime() - on.getTime()) / 86400000)
}

/** Live, and inside the window where the office would chase a renewal. */
export const isRenewingSoon = (m: Membership, withinDays = 45, on: Date = new Date()): boolean => {
  const left = daysUntilRenewal(m, on)
  return m.status === 'active' && left >= 0 && left <= withinDays
}
