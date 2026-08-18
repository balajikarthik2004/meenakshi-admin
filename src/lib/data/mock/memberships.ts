import type { Membership, MembershipTier } from '@/lib/data/types'
import { DEVOTEES } from './users'
import { addDays, chance, id, int, iso, rng, today } from './seed'

export interface TierSpec {
  tier: MembershipTier
  price: number
  tagline: string
  perks: string[]
  facilityDiscountPct: number
}

export const TIERS: TierSpec[] = [
  {
    tier: 'silver',
    price: 250,
    tagline: 'Start your family’s year at the temple',
    perks: [
      '5% off facility bookings',
      'One free Archana per year',
      'Monthly newsletter and festival calendar',
      'Named in the annual report',
    ],
    facilityDiscountPct: 5,
  },
  {
    tier: 'gold',
    price: 500,
    tagline: 'For families who are here every week',
    perks: [
      '10% off facility bookings',
      'One free Archana per year',
      'Prasadam by post, monthly',
      'Reserved seating at major festivals',
      'Named in the annual report',
    ],
    facilityDiscountPct: 10,
  },
  {
    tier: 'platinum',
    price: 1000,
    tagline: 'Patron of the Devasthanam',
    perks: [
      '15% off facility bookings',
      'One free Archana per year',
      'Prasadam by post, monthly',
      'Kalyanam sponsorship option',
      'Priority booking on every puja and hall date',
      'Named in the annual report and on the patron board',
    ],
    facilityDiscountPct: 15,
  },
]

export const TIER_BY_KEY = new Map(TIERS.map((t) => [t.tier, t]))

/** 12 silver · 12 gold · 6 platinum, renewals scattered across the coming year. */
function buildMemberships(): Membership[] {
  const r = rng(310577)
  const base = today()
  const plan: MembershipTier[] = [
    ...Array<MembershipTier>(12).fill('silver'),
    ...Array<MembershipTier>(12).fill('gold'),
    ...Array<MembershipTier>(6).fill('platinum'),
  ]

  return plan.map((tier, i) => {
    const user = DEVOTEES[i]!
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
      familyPlan: chance(r, 48),
      status: cancelled ? 'cancelled' : expired ? 'expired' : 'active',
    }
    user.membershipId = membership.id
    return membership
  })
}

export const MEMBERSHIPS: Membership[] = buildMemberships()

export const MEMBERSHIP_BY_USER = new Map(MEMBERSHIPS.map((m) => [m.userId, m]))
