import type { Membership, MembershipTier } from '@/lib/data/types'
import { DEVOTEES } from './users'
import { SENIOR_MIN_AGE, ageOn } from '@/lib/membership'
import { addDays, chance, id, int, iso, rng, today } from './seed'

export interface TierSpec {
  tier: MembershipTier
  /** What the tier is called on screen — `titleCase` alone gives "Senior". */
  label: string
  price: number
  tagline: string
  perks: string[]
  facilityDiscountPct: number
  /** Minimum age on the day of enrolment. Absent means anyone may join. */
  minAge?: number
}

/**
 * Two memberships, not three tiers.
 *
 * The temple offers one membership and one concession on it. That is deliberately not
 * a ladder: the benefits are identical, because a devotee aged sixty-six is not
 * entitled to less of the temple than one aged forty — they simply pay less for it.
 * The only benefit that differs is reserved seating, which exists because standing
 * through a four-hour Chithirai utsavam is the actual problem, and because the senior
 * devotees' committee asked for it.
 *
 * `minAge` is the one eligibility rule in the app, and it is enforced in
 * `@/lib/membership` rather than by whichever screen happens to be asking.
 */
export const TIERS: TierSpec[] = [
  {
    tier: 'normal',
    label: 'Member',
    price: 251,
    tagline: 'For families who call this temple home',
    perks: [
      '10% off facility and hall bookings',
      'Two free Archanas each year',
      'Monthly newsletter and the festival calendar',
      'Named in the annual report',
      'Voting rights at the Annual General Meeting',
    ],
    facilityDiscountPct: 10,
  },
  {
    tier: 'senior',
    label: 'Senior Citizen',
    price: 108,
    tagline: `Concessional rate for devotees aged ${SENIOR_MIN_AGE} and over`,
    perks: [
      '10% off facility and hall bookings',
      'Two free Archanas each year',
      'Monthly newsletter and the festival calendar',
      'Named in the annual report',
      'Voting rights at the Annual General Meeting',
      'Reserved seating at every major festival',
    ],
    facilityDiscountPct: 10,
    minAge: SENIOR_MIN_AGE,
  },
]

export const TIER_BY_KEY = new Map(TIERS.map((t) => [t.tier, t]))

/**
 * Memberships across the first two-thirds of the devotee roll.
 *
 * Tier follows age rather than a quota, because the senior rate is an entitlement and
 * not a marketing segment — seeding a devotee of forty onto it would make every
 * eligibility check in the console look broken the first time somebody opened a
 * record. Renewal dates are scattered so the console has lapsed, live and
 * renewing-soon rows to work with.
 */
function buildMemberships(): Membership[] {
  const r = rng(310577)
  const base = today()
  const enrolled = DEVOTEES.slice(0, Math.min(26, DEVOTEES.length))

  return enrolled.map((user, i) => {
    const age = ageOn(user.dob, base)
    const tier: MembershipTier = age !== null && age >= SENIOR_MIN_AGE ? 'senior' : 'normal'

    // Spread renewal dates: a few already lapsed, most live, some renewing soon.
    const startedDaysAgo = int(r, 20, 400)
    const startDate = addDays(base, -startedDaysAgo)
    const endDate = addDays(startDate, 365)
    const expired = endDate.getTime() < base.getTime()
    const cancelled = !expired && chance(r, 6)

    const membership: Membership = {
      id: id('mem', i + 1),
      userId: user.id,
      tier,
      startDate: iso(startDate),
      endDate: iso(endDate),
      autoRenew: chance(r, 64),
      // A senior concession is most often taken by a couple, so the family plan runs
      // a little higher on that tier than on the other.
      familyPlan: chance(r, tier === 'senior' ? 58 : 44),
      status: cancelled ? 'cancelled' : expired ? 'expired' : 'active',
    }
    user.membershipId = membership.id
    return membership
  })
}

export const MEMBERSHIPS: Membership[] = buildMemberships()

export const MEMBERSHIP_BY_USER = new Map(MEMBERSHIPS.map((m) => [m.userId, m]))
