export type UUID = string
export type ISODate = string
export type Money = number // USD cents avoided at this stage; use whole dollars

export interface Temple {
  id: UUID
  name: string
  address: string
  city: string
  state: string
  zip: string
  country: string
  phone: string
  email: string
  timezone: string
  timings: { morning: string; evening: string }
  logoUrl: string
  deities: string[]
}

export type Role = 'devotee' | 'admin' | 'board' | 'priest'

export interface User {
  id: UUID
  role: Role
  name: string
  email: string
  phone: string // immutable identity anchor
  address?: string
  city?: string
  state?: string
  zip?: string
  country: 'US' | 'IN' | 'Other'
  nakshatra?: string
  gothra?: string
  dob?: ISODate
  familyTreeId?: UUID
  membershipId?: UUID
  createdAt: ISODate
  avatarInitials: string
}

export interface FamilyTree {
  id: UUID
  primaryUserId: UUID
  members: FamilyMember[]
}
export interface FamilyMember {
  name: string
  relation: 'spouse' | 'son' | 'daughter' | 'parent' | 'other'
  nakshatra?: string
  gothra?: string
  isAdultBranch?: boolean
}

export type Cadence = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'one-time'
export type PujaType = 'yearly' | 'monthly' | 'one-time' | 'abhishekam' | 'alangaram'

export interface PujaCatalogItem {
  id: UUID
  name: string // e.g. "Murugar Puja"
  deity: string // e.g. "Murugan"
  type: PujaType
  basePrice: Money
  durationMin: number
  defaultCadence: Cadence
  recurringRule?: string // human-readable: "Every 3rd Thursday"
  description: string
  imageUrl?: string
  addOns?: PujaAddOn[]
  active?: boolean
}
export interface PujaAddOn {
  id: string
  label: string
  /** One line under the label on the booking step. Lives here so adding an add-on
   *  does not mean editing a switch in the booking JSX. */
  blurb: string
  price: Money
}

export interface Booking {
  id: UUID
  userId: UUID
  pujaCatalogId: UUID
  cadence: Cadence
  startDate: ISODate
  endDate: ISODate // for yearly: startDate + 365 days
  sankalpamNames: string[]
  addOns: string[]
  amount: Money
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  createdAt: ISODate
}

export interface PujaOccurrence {
  id: UUID
  bookingId: UUID
  scheduledAt: ISODate
  fulfilledAt?: ISODate
  officiant?: string
  notes?: string
  status: 'scheduled' | 'completed' | 'skipped'
}

export type DonationCategory =
  | 'general-hundi'
  | 'annadanam'
  | 'puja'
  | 'abhishekam'
  | 'goshala'
  | 'vedic-school'
  | 'building'
  | 'event'
  | 'other'

export interface Donation {
  id: UUID
  userId: UUID | null // null for anonymous
  category: DonationCategory
  amount: Money
  isRecurring: boolean
  recurringCadence?: Cadence
  paymentMethod: 'card' | 'ach' | 'zelle' | 'check' | 'cash'
  dedicatedTo?: string
  /** Set when `category` is `event` — the festival this gift sponsors. */
  eventId?: UUID
  /** Labels of the sponsorship items chosen, in the order they are offered. */
  eventItems?: string[]
  taxReceiptId?: UUID
  createdAt: ISODate
}

export type MembershipTier = 'silver' | 'gold' | 'platinum'
export interface Membership {
  id: UUID
  userId: UUID
  tier: MembershipTier
  startDate: ISODate
  endDate: ISODate
  autoRenew: boolean
  familyPlan: boolean
  status: 'active' | 'expired' | 'cancelled'
}

export interface TempleEvent {
  id: UUID
  title: string
  slug: string
  date: ISODate
  endDate?: ISODate
  flyerUrl?: string
  description: string
  targetAmount: Money
  collectedAmount: Money
  costs: EventCost[]
  /** The three named pieces of this festival a devotee can sponsor outright. */
  sponsorships: EventSponsorship[]
  ticketPrice?: Money
  rsvpCount: number
  status: 'upcoming' | 'ongoing' | 'completed'
}
export interface EventCost {
  label: string
  amount: Money
}

/**
 * A named piece of a festival a devotee can sponsor — the flowers, the annadanam, the
 * priests' dakshina. Priced per event, so sponsoring the flowers at Chithirai costs
 * more than at Rama Navami. Distinct from `costs`, which is the published budget the
 * temple reports against; these are the items actually offered for sponsorship.
 */
export interface EventSponsorship {
  key: string
  label: string
  blurb: string
  price: Money
}

export interface FacilityBooking {
  id: UUID
  userId: UUID
  facility: 'main-hall' | 'mini-hall' | 'canteen'
  date: ISODate
  items: { label: string; qty: number; price: Money }[]
  total: Money
  status: 'pending' | 'confirmed' | 'cancelled'
}

export interface Project {
  id: UUID
  title: string
  targetAmount: Money
  raisedAmount: Money
  spentAmount: Money
  progressPct: number
  status: 'planned' | 'in-progress' | 'completed'
  notes: string[]
}

/**
 * One head of the board-approved annual budget — what the target is actually *for*.
 * The heads reconcile to the snapshot exactly: `targetAmount` sums to `annualTarget`
 * and `collectedAmount` sums to `ytdCollected`. The breakdown table asserts this, so
 * a head that is edited without rebalancing its siblings shows up as a variance row
 * rather than quietly disagreeing with the headline tiles.
 */
export interface TargetAllocation {
  key: string
  label: string
  /** One line on what the head pays for — read directly under the label. */
  detail: string
  /** Share of the annual target earmarked for this head. */
  targetAmount: Money
  /** Raised against this head so far this year. */
  collectedAmount: Money
  /** Disbursed against this head so far this year. */
  spentAmount: Money
}

export interface TransparencySnapshot {
  ytdCollected: Money
  annualTarget: Money
  balanceToBreakeven: Money
  achievedPct: number
  updatedAt: ISODate
  /** Where the annual target goes, largest head first. */
  allocations: TargetAllocation[]
}

/* ---- Supporting types (not persisted anywhere real) ---- */

export interface RecurringRule {
  id: UUID
  label: string
  dayOfWeek: number // 0 = Sunday
  time: string // "19:00"
  pujaCatalogId?: UUID
  nth?: number // e.g. 3 => "3rd Thursday"
}

export interface PujaPnLRow {
  puja: PujaCatalogItem
  sponsors: number
  collected: Money
  cost: Money
  net: Money
  progressPct: number
}

export interface Staff {
  id: UUID
  name: string
  role: Role
  title: string
  phone: string
  email: string
}
