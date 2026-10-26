import {
  BadgeCheck,
  Building2,
  BadgeDollarSign,
  CalendarCheck2,
  BookOpen,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  CalendarCheck,
  CalendarDays,
  ChefHat,
  Gauge,
  GraduationCap,
  HardHat,
  Heart,
  HeartHandshake,
  Landmark,
  LayoutDashboard,
  Megaphone,
  ReceiptText,
  Settings,
  ShieldCheck,
  Stamp,
  Wallet,
  UserCheck,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import type { Role } from '@/lib/data/types'

/**
 * Who may see what, in one table.
 *
 * This used to be stated in three places that could disagree: the sidebar decided what
 * to render, the sign-in cards advertised what each role "can see", and the settings
 * permission matrix described it a third way. Nothing kept them honest, and only three
 * of sixteen nav items were filtered at all — so a priest signing in was shown the
 * donation ledger, the tax receipts and the temple settings.
 *
 * Everything about role access now derives from `NAV_GROUPS` below: the sidebar, the
 * route guard, the sign-in blurbs and the redirect a role lands on. Adding a page means
 * naming its roles once.
 */

export interface NavItem {
  to: string
  label: string
  Icon: typeof Users
  /** `end` for a path that is a prefix of its siblings, so it does not stay lit. */
  end?: boolean
  /** Required. A page with no roles named is a page nobody has thought about. */
  roles: Role[]
}

/* Shorthands, so a row reads as a sentence rather than a wall of unions. */
const ALL_STAFF: Role[] = ['admin', 'board', 'priest', 'finance', 'committee', 'kitchen']
const OPS: Role[] = ['admin', 'priest', 'committee']
const MONEY: Role[] = ['admin', 'board', 'finance']
// The pass and the counter. Deliberately narrow: this is a working surface.
const KITCHEN: Role[] = ['admin', 'kitchen']
// The Vedic Heritage School coordinators.
const SCHOOL: Role[] = ['admin', 'school']

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Operations',
    items: [
      // The dashboard leads on donation revenue, which is not a priest's or the puja
      // committee's business — both land on their own worklist instead.
      { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard, roles: MONEY },
      { to: '/bookings/today', label: 'Today’s pujas', Icon: CalendarCheck, roles: OPS },
      {
        to: '/bookings',
        label: 'All bookings',
        Icon: BookOpen,
        end: true,
        // Finance needs the ledger of sponsorships behind the payments it verifies.
        roles: ['admin', 'priest', 'committee', 'finance'],
      },
      {
        to: '/approvals/finance',
        label: 'Payment approvals',
        Icon: BadgeCheck,
        roles: ['finance', 'admin'],
      },
      {
        to: '/approvals/committee',
        label: 'Priest assignment',
        Icon: UserCheck,
        roles: ['committee', 'admin'],
      },
      { to: '/catalog', label: 'Puja catalogue', Icon: Landmark, roles: OPS },
    ],
  },
  {
    title: 'People',
    items: [
      // Devotee records carry addresses and phone numbers. Oversight needs them; the
      // desks that only handle a payment or a priest rota do not.
      { to: '/devotees', label: 'Devotees', Icon: Users, end: true, roles: ['admin', 'board'] },
      // Volunteers belong to whoever runs the festival, so the puja committee holds them
      // alongside the administrator. The board is left out on purpose: this is an
      // operational roster, not an oversight record, and it carries phone numbers.
      {
        to: '/volunteers',
        label: 'Volunteers',
        Icon: HeartHandshake,
        end: true,
        roles: ['admin', 'committee'],
      },
      {
        to: '/volunteers/campaigns',
        label: 'Volunteer campaigns',
        Icon: Megaphone,
        roles: ['admin', 'committee'],
      },
      // Memberships sit with People rather than Money: the register is mostly used to
      // check who is a member and chase a renewal, and the dues it collects are a
      // minor line beside donations. The board reads it for AGM voting rolls.
      { to: '/memberships', label: 'Memberships', Icon: Heart, roles: ['admin', 'board'] },
    ],
  },
  {
    // The physical side of running a puja: what it consumes, what that costs, and
    // whether the shelf can actually meet tomorrow's list. Grouped apart from
    // Operations because the audience is different — this is the store keeper's
    // sidebar, and the accounts desk visits exactly one row of it.
    title: 'Stores',
    items: [
      { to: '/inventory', label: 'Inventory', Icon: Boxes, roles: ['admin', 'priest'] },
      {
        to: '/requirements',
        label: 'Puja requirements',
        Icon: ClipboardList,
        end: true,
        roles: ['admin', 'priest'],
      },
      {
        to: '/requirements/readiness',
        label: 'Puja readiness',
        Icon: ClipboardCheck,
        roles: ['admin', 'priest'],
      },
      {
        to: '/requirements/finance',
        label: 'Requirement budgets',
        Icon: Wallet,
        roles: ['finance', 'admin'],
      },
      {
        to: '/requirements/approvals',
        label: 'Requirement approvals',
        Icon: Stamp,
        roles: ['admin'],
      },
    ],
  },
  {
    title: 'Money',
    items: [
      {
        to: '/donations',
        label: 'Donation ledger',
        Icon: BadgeDollarSign,
        end: true,
        roles: MONEY,
      },
      {
        to: '/donations/receipts',
        label: 'Tax receipts',
        Icon: ReceiptText,
        roles: ['admin', 'finance'],
      },
      // Promised money that has not arrived. It sits next to the ledger because the
      // question is a finance one — what is still owed and what is late — and it is
      // shown to the board too, since an outstanding pledge book is part of what the
      // AGM is told about next year's position.
      { to: '/donations/pledges', label: 'Pledge register', Icon: CalendarCheck2, roles: MONEY },
      // The capital programme. Money, not Programme: what the desk does here is book
      // expenditure against a restricted fund, and the board reads it at the AGM.
      { to: '/projects', label: 'Capital projects', Icon: HardHat, roles: MONEY },
      { to: '/transparency', label: 'Transparency', Icon: Gauge, roles: MONEY },
      // Deliberately not the administrator: the AGM view is the board's own record.
      { to: '/board', label: 'Board view', Icon: ShieldCheck, roles: ['board'] },
    ],
  },
  {
    // The cafeteria runs on its own clock and is staffed by its own people, so it
    // gets its own group rather than being filed under Operations with the pujas.
    title: 'Cafeteria',
    items: [
      { to: '/kitchen', label: 'Kitchen board', Icon: ChefHat, end: true, roles: KITCHEN },
      { to: '/kitchen/menu', label: 'Menu & availability', Icon: UtensilsCrossed, roles: KITCHEN },
    ],
  },
  {
    // The Vedic Heritage School. Its own group: the coordinators are volunteers who
    // open the console for this and nothing else, twice a term.
    title: 'School',
    items: [
      { to: '/school', label: 'Classes & enrolment', Icon: GraduationCap, roles: SCHOOL },
    ],
  },
  {
    title: 'Programme',
    items: [
      {
        to: '/events',
        label: 'Events',
        Icon: CalendarDays,
        end: true,
        roles: ['admin', 'committee'],
      },
      { to: '/calendar', label: 'Calendar CMS', Icon: CalendarDays, roles: ['admin', 'committee'] },
      // The hall book. The committee runs the programme the halls are let around, so
      // it decides the dates alongside the administrator; finance is left out because
      // the hire income reaches it through the donation ledger, not through this queue.
      { to: '/facility', label: 'Hall bookings', Icon: Building2, roles: ['admin', 'committee'] },
      { to: '/settings', label: 'Settings', Icon: Settings, roles: ['admin'] },
    ],
  },
]

/** The sidebar this role actually gets, with empty groups dropped. */
export function navGroupsFor(role: Role) {
  return NAV_GROUPS.map((g) => ({
    title: g.title,
    items: g.items.filter((i) => i.roles.includes(role)),
  })).filter((g) => g.items.length > 0)
}

/**
 * Where a role starts, and where it is sent if it asks for something it cannot open.
 *
 * Every entry must be a route that role is allowed, or the guard would bounce it back
 * to a page that bounces it again. `roleHomeIsReachable` in the tests below asserts it.
 */
export const ROLE_HOME: Record<Role, string> = {
  admin: '/dashboard',
  board: '/board',
  finance: '/approvals/finance',
  committee: '/approvals/committee',
  priest: '/bookings/today',
  kitchen: '/kitchen',
  school: '/school',
  // A devotee has no business in the operations console at all.
  devotee: '/signin',
}

/**
 * Child routes that carry no nav item of their own but must inherit access from one —
 * a detail page, an editor. Without these, opening a devotee record would redirect.
 */
const ROUTE_ALIASES: { prefix: string; inherits: string }[] = [
  { prefix: '/devotees/', inherits: '/devotees' },
  { prefix: '/events/', inherits: '/events' },
  { prefix: '/donations/receipts', inherits: '/donations/receipts' },
  { prefix: '/donations/pledges', inherits: '/donations/pledges' },
  { prefix: '/kitchen/menu', inherits: '/kitchen/menu' },
]

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items)

/**
 * Whether a role may open a path.
 *
 * Matched longest-prefix-first so `/bookings/today` and `/donations/receipts` resolve to
 * themselves rather than to `/bookings` and `/donations`. A path nothing claims is open
 * to any signed-in staff member — that covers `/` and the not-found route, neither of
 * which should trap somebody in a redirect.
 */
export function canAccess(role: Role, pathname: string): boolean {
  const alias = ROUTE_ALIASES.find((a) => pathname.startsWith(a.prefix))
  const target = alias ? alias.inherits : pathname

  const match = [...ALL_ITEMS]
    .sort((a, b) => b.to.length - a.to.length)
    .find((i) => target === i.to || target.startsWith(`${i.to}/`))

  if (!match) return ALL_STAFF.includes(role)
  return match.roles.includes(role)
}

/** The first few things a role can open — the "can see" list on the sign-in cards. */
export function highlightsFor(role: Role, limit = 4): string[] {
  return ALL_ITEMS.filter((i) => i.roles.includes(role))
    .slice(0, limit)
    .map((i) => i.label)
}
