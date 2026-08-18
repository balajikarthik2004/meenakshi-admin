export type UUID = string
export type ISODate = string
export type Money = number // USD cents avoided at prototype stage; use whole dollars

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
  ticketPrice?: Money
  rsvpCount: number
  status: 'upcoming' | 'ongoing' | 'completed'
}
export interface EventCost {
  label: string
  amount: Money
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

export interface TransparencySnapshot {
  ytdCollected: Money
  annualTarget: Money
  balanceToBreakeven: Money
  achievedPct: number
  updatedAt: ISODate
}

/* ---- Prototype-only supporting types (not persisted anywhere real) ---- */

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
