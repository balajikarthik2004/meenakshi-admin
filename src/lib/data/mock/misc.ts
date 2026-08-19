import type {
  FacilityBooking,
  Money,
  RecurringRule,
  Staff,
  TransparencySnapshot,
} from '@/lib/data/types'
import { addDays, id, int, iso, pick, rng, today } from './seed'
import { DEVOTEES } from './users'

export const TRANSPARENCY: TransparencySnapshot = {
  ytdCollected: 723_000,
  annualTarget: 900_000,
  balanceToBreakeven: 177_000,
  achievedPct: 80,
  updatedAt: iso(new Date()),
}

/** The published weekly rhythm, overlaid on both calendars. */
export const RECURRING_RULES: RecurringRule[] = [
  {
    id: 'rule_0001',
    label: 'Sundareswarar Abhishekam',
    dayOfWeek: 1,
    time: '19:00',
    pujaCatalogId: 'puja_0006',
  },
  {
    id: 'rule_0002',
    label: 'Murugan Vel Puja',
    dayOfWeek: 2,
    time: '19:00',
    pujaCatalogId: 'puja_0001',
  },
  {
    id: 'rule_0003',
    label: 'Durga Kumkumarchana',
    dayOfWeek: 2,
    time: '18:00',
    pujaCatalogId: 'puja_0012',
  },
  {
    id: 'rule_0004',
    label: 'Ashtalakshmi Deepam',
    dayOfWeek: 5,
    time: '18:30',
    pujaCatalogId: 'puja_0004',
  },
  {
    id: 'rule_0005',
    label: 'Perumal Thirumanjanam',
    dayOfWeek: 6,
    time: '09:30',
    pujaCatalogId: 'puja_0002',
  },
  {
    id: 'rule_0006',
    label: 'Murugar Monthly Abhishekam',
    dayOfWeek: 4,
    time: '19:00',
    pujaCatalogId: 'puja_0001',
    nth: 3,
  },
]

export const STAFF: Staff[] = [
  {
    id: 'usr_priest',
    name: 'Ramesh Iyer',
    role: 'priest',
    title: 'Chief Priest (Sivachariar)',
    phone: '(281) 489-0359',
    email: 'ramesh@smdpearland.org',
  },
  {
    id: 'stf_0002',
    name: 'Sathish Sharma',
    role: 'priest',
    title: 'Priest — Perumal sannidhi',
    phone: '(281) 489-0362',
    email: 'sathish@smdpearland.org',
  },
  {
    id: 'stf_0003',
    name: 'Venkatesh Bhattar',
    role: 'priest',
    title: 'Priest — Murugan sannidhi',
    phone: '(281) 489-0363',
    email: 'venkatesh@smdpearland.org',
  },
  {
    id: 'stf_0004',
    name: 'Gopal Sastrigal',
    role: 'priest',
    title: 'Priest — Homam & samskaras',
    phone: '(281) 489-0364',
    email: 'gopal@smdpearland.org',
  },
  {
    id: 'usr_admin',
    name: 'Meera Sundaram',
    role: 'admin',
    title: 'Temple Administrator',
    phone: '(281) 489-0358',
    email: 'meera@smdpearland.org',
  },
  {
    id: 'usr_board',
    name: 'Perumal Annamalai',
    role: 'board',
    title: 'Board Treasurer',
    phone: '(281) 489-0361',
    email: 'perumal@smdpearland.org',
  },
]

export interface FacilitySpec {
  key: FacilityBooking['facility']
  label: string
  capacity: number
  baseRate: Money
}

export const FACILITIES: FacilitySpec[] = [
  { key: 'main-hall', label: 'Main Hall', capacity: 400, baseRate: 1200 },
  { key: 'mini-hall', label: 'Mini Hall', capacity: 120, baseRate: 450 },
  { key: 'canteen', label: 'Canteen', capacity: 80, baseRate: 300 },
]

export const FACILITY_ITEMS: { label: string; price: Money; unit: string }[] = [
  { label: 'Folding chairs', price: 2, unit: 'per chair' },
  { label: 'Banquet tables', price: 12, unit: 'per table' },
  { label: 'Catering (vegetarian, per plate)', price: 18, unit: 'per plate' },
  { label: 'Sound system & mic', price: 150, unit: 'flat' },
  { label: 'Stage lighting', price: 220, unit: 'flat' },
  { label: 'Cleaning crew', price: 180, unit: 'flat' },
]

function buildFacilityBookings(): FacilityBooking[] {
  const r = rng(660331)
  const base = today()
  const facilities = FACILITIES.map((f) => f.key)
  const statuses: FacilityBooking['status'][] = ['confirmed', 'confirmed', 'pending', 'cancelled']

  return Array.from({ length: 14 }, (_, i) => {
    const items = FACILITY_ITEMS.filter(() => r() > 0.55).map((it) => ({
      label: it.label,
      qty: it.unit === 'flat' ? 1 : int(r, 20, 220),
      price: it.price,
    }))
    const facility = pick(r, facilities)
    const baseRate = FACILITIES.find((f) => f.key === facility)!.baseRate
    const total = items.reduce<number>((s, it) => s + it.qty * it.price, baseRate)

    return {
      id: id('fac', i + 1),
      userId: pick(r, DEVOTEES).id,
      facility,
      date: iso(addDays(base, int(r, -20, 75))),
      items,
      total,
      status: pick(r, statuses),
    }
  }).sort((a, b) => a.date.localeCompare(b.date))
}

export const FACILITY_BOOKINGS: FacilityBooking[] = buildFacilityBookings()

/** Rendered by the admin "Email templates" settings tab. */
export const EMAIL_TEMPLATES = [
  {
    id: 'tpl_booking',
    name: 'Puja booking confirmation',
    subject: 'Your {{pujaName}} sponsorship is confirmed',
    body: 'Om Namah Shivaya {{devoteeName}},\n\nYour sponsorship of {{pujaName}} ({{cadence}}) is confirmed. Booking {{bookingId}}.\nSankalpam will be offered in the name(s): {{sankalpamNames}}.\n\nSri Meenakshi Temple Society, Pearland TX',
  },
  {
    id: 'tpl_receipt',
    name: 'Tax receipt',
    subject: 'Your {{year}} contribution statement',
    body: 'Dear {{devoteeName}},\n\nThank you for your support. Your total deductible contribution for {{year}} was {{amount}}.\nSri Meenakshi Temple Society is a 501(c)(3) organization; EIN {{ein}}. No goods or services were provided in exchange.',
  },
  {
    id: 'tpl_renewal',
    name: 'Membership renewal reminder',
    subject: 'Your {{tier}} membership renews on {{date}}',
    body: 'Dear {{devoteeName}},\n\nYour {{tier}} membership expires on {{date}}. Renew online in under a minute to keep your family’s benefits active.',
  },
]
