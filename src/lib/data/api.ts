/**
 * The single seam between the UI and the data.
 *
 * Everything below reads and writes in-memory mock arrays. Swap the bodies for `fetch`
 * calls and the whole app moves to a real backend without touching a single screen.
 */
import type {
  Booking,
  Donation,
  FacilityBooking,
  FamilyTree,
  Membership,
  MembershipTier,
  Money,
  Project,
  PujaCatalogItem,
  PujaOccurrence,
  PujaPnLRow,
  PujaType,
  RecurringRule,
  Temple,
  TempleEvent,
  TransparencySnapshot,
  User,
  UUID,
} from './types'
import {
  BOOKINGS,
  DONATIONS,
  EVENTS,
  FACILITY_BOOKINGS,
  FAMILY_TREES,
  MEMBERSHIPS,
  OCCURRENCES,
  PROJECTS,
  PUJA_CATALOG,
  OCCURRENCES_PER_YEAR,
  PUJA_UNIT_COST,
  RECURRING_RULES,
  TEMPLE,
  TRANSPARENCY,
  USERS,
} from './mock'
import { LOCAL_KEYS, readLocal, writeLocal } from './local'
import { useAuthStore } from '@/lib/store/auth'
import { useProfileSignal } from '@/lib/store/profile'

export const simulateLatency = () => new Promise((r) => setTimeout(r, 150 + Math.random() * 150))

const clone = <T>(x: T): T => structuredClone(x)

/* ------------------------------------------------------------------ identity */

export async function getCurrentUser(): Promise<User | null> {
  await simulateLatency()
  return useAuthStore.getState().user
}

export async function getTemple(): Promise<Temple> {
  await simulateLatency()
  return TEMPLE
}

export async function getDevoteeById(id: UUID): Promise<User | null> {
  await simulateLatency()
  return USERS.find((u) => u.id === id) ?? null
}

export async function listDevotees(query?: {
  search?: string
  tier?: MembershipTier
  city?: string
}): Promise<User[]> {
  await simulateLatency()
  const q = query?.search?.trim().toLowerCase()
  return USERS.filter((u) => u.role === 'devotee')
    .filter((u) => (q ? [u.name, u.email, u.phone].some((f) => f.toLowerCase().includes(q)) : true))
    .filter((u) => (query?.city ? u.city === query.city : true))
    .filter((u) => {
      if (!query?.tier) return true
      const m = MEMBERSHIPS.find((x) => x.userId === u.id && x.status === 'active')
      return m?.tier === query.tier
    })
}

export async function updateDevotee(id: UUID, patch: Partial<User>): Promise<User> {
  await simulateLatency()
  const u = USERS.find((x) => x.id === id)
  if (!u) throw new Error(`No such devotee: ${id}`)
  Object.assign(u, patch)
  if (useAuthStore.getState().user?.id === id) useAuthStore.getState().setUser({ ...u })
  return u
}

/**
 * Family trees the devotee has edited, replayed over the seed on first import so a
 * saved tree survives a reload. Seeded trees stay untouched until they are edited.
 */
function hydrateFamilyTrees() {
  for (const saved of readLocal<FamilyTree[]>(LOCAL_KEYS.familyTrees, [])) {
    const i = FAMILY_TREES.findIndex((f) => f.primaryUserId === saved.primaryUserId)
    if (i >= 0) FAMILY_TREES[i] = saved
    else FAMILY_TREES.push(saved)
  }
}
hydrateFamilyTrees()

export async function getFamilyTree(userId: UUID): Promise<FamilyTree | null> {
  await simulateLatency()
  return FAMILY_TREES.find((f) => f.primaryUserId === userId) ?? null
}

export async function saveFamilyTree(tree: FamilyTree): Promise<FamilyTree> {
  await simulateLatency()
  // Match on the devotee, not the tree id — the profile page mints `fam_<userId>`
  // when a devotee has no seeded tree, which would otherwise append a second tree
  // for the same person the first time they add a relative.
  const i = FAMILY_TREES.findIndex((f) => f.primaryUserId === tree.primaryUserId)
  if (i >= 0) FAMILY_TREES[i] = tree
  else FAMILY_TREES.push(tree)

  // Persist only the edited trees, not the whole seeded set.
  const edited = readLocal<FamilyTree[]>(LOCAL_KEYS.familyTrees, []).filter(
    (f) => f.primaryUserId !== tree.primaryUserId,
  )
  writeLocal(LOCAL_KEYS.familyTrees, [...edited, tree])

  // Tell anything deriving state from the tree — the completion ring, for one — that
  // its copy is now stale.
  useProfileSignal.getState().bumpFamily()

  return tree
}

/* ---------------------------------------------------------------- catalogue */

export async function getPujaCatalog(type?: PujaType): Promise<PujaCatalogItem[]> {
  await simulateLatency()
  return PUJA_CATALOG.filter((p) => (type ? p.type === type : true))
}

export async function getPujaById(id: UUID): Promise<PujaCatalogItem | null> {
  await simulateLatency()
  return PUJA_CATALOG.find((p) => p.id === id) ?? null
}

export async function savePujaCatalogItem(item: PujaCatalogItem): Promise<PujaCatalogItem> {
  await simulateLatency()
  const i = PUJA_CATALOG.findIndex((p) => p.id === item.id)
  if (i >= 0) PUJA_CATALOG[i] = item
  else PUJA_CATALOG.push(item)
  return item
}

export async function deletePujaCatalogItem(id: UUID): Promise<void> {
  await simulateLatency()
  const i = PUJA_CATALOG.findIndex((p) => p.id === id)
  if (i >= 0) PUJA_CATALOG.splice(i, 1)
}

/* ----------------------------------------------------------------- bookings */

export async function getMyBookings(userId: UUID): Promise<Booking[]> {
  await simulateLatency()
  return BOOKINGS.filter((b) => b.userId === userId).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
}

export async function listBookings(filter?: {
  status?: Booking['status']
  pujaCatalogId?: UUID
  from?: string
  to?: string
}): Promise<Booking[]> {
  await simulateLatency()
  return BOOKINGS.filter((b) => (filter?.status ? b.status === filter.status : true))
    .filter((b) => (filter?.pujaCatalogId ? b.pujaCatalogId === filter.pujaCatalogId : true))
    .filter((b) => (filter?.from ? b.startDate >= filter.from : true))
    .filter((b) => (filter?.to ? b.startDate <= filter.to : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getUpcomingOccurrences(userId?: UUID, days = 30): Promise<PujaOccurrence[]> {
  await simulateLatency()
  const now = Date.now()
  const until = now + days * 86400000
  const mine = userId ? new Set(BOOKINGS.filter((b) => b.userId === userId).map((b) => b.id)) : null
  return OCCURRENCES.filter((o) => {
    const t = new Date(o.scheduledAt).getTime()
    return t >= now && t <= until && (!mine || mine.has(o.bookingId))
  })
}

export async function getOccurrencesOn(date: Date, userId?: UUID): Promise<PujaOccurrence[]> {
  await simulateLatency()
  const key = date.toDateString()
  const mine = userId ? new Set(BOOKINGS.filter((b) => b.userId === userId).map((b) => b.id)) : null
  return OCCURRENCES.filter(
    (o) => new Date(o.scheduledAt).toDateString() === key && (!mine || mine.has(o.bookingId)),
  )
}

export async function setOccurrenceStatus(
  id: UUID,
  status: PujaOccurrence['status'],
): Promise<PujaOccurrence | null> {
  await simulateLatency()
  const o = OCCURRENCES.find((x) => x.id === id)
  if (!o) return null
  o.status = status
  o.fulfilledAt = status === 'completed' ? new Date().toISOString() : undefined
  return o
}

export async function createBooking(
  input: Omit<Booking, 'id' | 'createdAt' | 'status' | 'endDate'>,
): Promise<Booking> {
  await simulateLatency()
  const start = new Date(input.startDate)
  const end = new Date(start)
  end.setDate(end.getDate() + (input.cadence === 'one-time' ? 1 : 365))
  const booking: Booking = {
    ...input,
    id: `bkg_${String(BOOKINGS.length + 1).padStart(4, '0')}`,
    endDate: end.toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
  }
  BOOKINGS.unshift(booking)
  return booking
}

export async function setBookingStatus(
  id: UUID,
  status: Booking['status'],
): Promise<Booking | null> {
  await simulateLatency()
  const b = BOOKINGS.find((x) => x.id === id)
  if (!b) return null
  b.status = status
  return b
}

/* ---------------------------------------------------------------- donations */

export async function listDonations(userId?: UUID): Promise<Donation[]> {
  await simulateLatency()
  return DONATIONS.filter((d) => (userId ? d.userId === userId : true))
}

export async function createDonation(
  input: Omit<Donation, 'id' | 'createdAt' | 'taxReceiptId'>,
): Promise<Donation> {
  await simulateLatency()
  const n = DONATIONS.length + 1
  const donation: Donation = {
    ...input,
    id: `don_${String(n).padStart(4, '0')}`,
    taxReceiptId: `rcpt_${String(n).padStart(4, '0')}`,
    createdAt: new Date().toISOString(),
  }
  DONATIONS.unshift(donation)

  // An event sponsorship is money raised *for that festival*, so it moves the festival's
  // break-even meter as well as landing in the ledger. Without this the devotee sponsors
  // the flowers and the event page still reads the same figure it did a moment ago.
  if (donation.eventId) {
    const event = EVENTS.find((e) => e.id === donation.eventId)
    if (event) event.collectedAmount += donation.amount
  }

  return donation
}

export async function issueTaxReceipts(ids: UUID[]): Promise<number> {
  await simulateLatency()
  let n = 0
  for (const id of ids) {
    const d = DONATIONS.find((x) => x.id === id)
    if (d && !d.taxReceiptId) {
      d.taxReceiptId = `rcpt_${d.id.replace('don_', '')}`
      n++
    }
  }
  return n
}

/** Per-donor totals for a calendar year — the tax-receipt bulk tool reads this. */
export async function getYearlyContributions(
  year: number,
): Promise<Array<{ user: User; donations: Money; sponsorships: Money; total: Money }>> {
  await simulateLatency()
  return USERS.filter((u) => u.role === 'devotee')
    .map((user) => {
      const donations = DONATIONS.filter(
        (d) => d.userId === user.id && new Date(d.createdAt).getFullYear() === year,
      ).reduce((s, d) => s + d.amount, 0)
      const sponsorships = BOOKINGS.filter(
        (b) =>
          b.userId === user.id &&
          b.status !== 'cancelled' &&
          new Date(b.createdAt).getFullYear() === year,
      ).reduce((s, b) => s + b.amount, 0)
      return { user, donations, sponsorships, total: donations + sponsorships }
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total)
}

/* -------------------------------------------------------------- memberships */

export async function getMembership(userId: UUID): Promise<Membership | null> {
  await simulateLatency()
  return (
    MEMBERSHIPS.filter((m) => m.userId === userId).sort((a, b) =>
      b.endDate.localeCompare(a.endDate),
    )[0] ?? null
  )
}

export async function listMemberships(): Promise<Membership[]> {
  await simulateLatency()
  return [...MEMBERSHIPS].sort((a, b) => a.endDate.localeCompare(b.endDate))
}

export async function createMembership(
  input: Omit<Membership, 'id' | 'status'>,
): Promise<Membership> {
  await simulateLatency()
  const m: Membership = {
    ...input,
    id: `mem_${String(MEMBERSHIPS.length + 1).padStart(4, '0')}`,
    status: 'active',
  }
  MEMBERSHIPS.push(m)
  const u = USERS.find((x) => x.id === input.userId)
  if (u) u.membershipId = m.id
  return m
}

/* ------------------------------------------------------------------- events */

export async function listEvents(
  status?: 'upcoming' | 'ongoing' | 'completed',
): Promise<TempleEvent[]> {
  await simulateLatency()
  return EVENTS.filter((e) => (status ? e.status === status : true)).sort((a, b) =>
    a.date.localeCompare(b.date),
  )
}

export async function getEventBySlug(slug: string): Promise<TempleEvent | null> {
  await simulateLatency()
  return EVENTS.find((e) => e.slug === slug) ?? null
}

export async function getEventById(id: UUID): Promise<TempleEvent | null> {
  await simulateLatency()
  return EVENTS.find((e) => e.id === id) ?? null
}

export async function saveEvent(event: TempleEvent): Promise<TempleEvent> {
  await simulateLatency()
  const i = EVENTS.findIndex((e) => e.id === event.id)
  if (i >= 0) EVENTS[i] = event
  else EVENTS.push(event)
  EVENTS.sort((a, b) => a.date.localeCompare(b.date))
  return event
}

export async function deleteEvent(id: UUID): Promise<void> {
  await simulateLatency()
  const i = EVENTS.findIndex((e) => e.id === id)
  if (i >= 0) EVENTS.splice(i, 1)
}

export async function rsvpToEvent(id: UUID, seats: number): Promise<TempleEvent | null> {
  await simulateLatency()
  const e = EVENTS.find((x) => x.id === id)
  if (!e) return null
  e.rsvpCount += seats
  if (e.ticketPrice) e.collectedAmount += e.ticketPrice * seats
  return e
}

/* ----------------------------------------------------------------- facility */

export async function listFacilityBookings(): Promise<FacilityBooking[]> {
  await simulateLatency()
  return [...FACILITY_BOOKINGS]
}

export async function createFacilityBooking(
  input: Omit<FacilityBooking, 'id' | 'status'>,
): Promise<FacilityBooking> {
  await simulateLatency()
  const fb: FacilityBooking = {
    ...input,
    id: `fac_${String(FACILITY_BOOKINGS.length + 1).padStart(4, '0')}`,
    status: 'pending',
  }
  FACILITY_BOOKINGS.push(fb)
  return fb
}

export async function setFacilityBookingStatus(
  id: UUID,
  status: FacilityBooking['status'],
): Promise<void> {
  await simulateLatency()
  const fb = FACILITY_BOOKINGS.find((x) => x.id === id)
  if (fb) fb.status = status
}

/* ------------------------------------------------------------- transparency */

export async function listProjects(): Promise<Project[]> {
  await simulateLatency()
  return clone(PROJECTS)
}

export async function getTransparencySnapshot(): Promise<TransparencySnapshot> {
  await simulateLatency()
  return TRANSPARENCY
}

export async function getPujaPnL(): Promise<PujaPnLRow[]> {
  await simulateLatency()
  return PUJA_CATALOG.map((puja) => {
    const bookings = BOOKINGS.filter((b) => b.pujaCatalogId === puja.id && b.status !== 'cancelled')
    const collected = bookings.reduce((s, b) => s + b.amount, 0)
    // Revenue here is a full year of sponsorship, so cost has to be a full year too.
    // Counting occurrences from the 30-day materialisation window against annual
    // revenue is what made every puja look like it ran at a catastrophic loss.
    const unitCost = PUJA_UNIT_COST[puja.id] ?? Math.round(puja.basePrice * 0.5)
    const cost = bookings.reduce((s, b) => s + OCCURRENCES_PER_YEAR[b.cadence] * unitCost, 0)
    const net = collected - cost
    return {
      puja,
      sponsors: bookings.length,
      collected,
      cost,
      net,
      progressPct: collected === 0 ? 0 : Math.round((net / collected) * 100),
    }
  }).sort((a, b) => b.collected - a.collected)
}

/* ----------------------------------------------------------------- calendar */

export async function listRecurringRules(): Promise<RecurringRule[]> {
  await simulateLatency()
  return [...RECURRING_RULES]
}

export async function saveRecurringRule(rule: RecurringRule): Promise<RecurringRule> {
  await simulateLatency()
  const i = RECURRING_RULES.findIndex((r) => r.id === rule.id)
  if (i >= 0) RECURRING_RULES[i] = rule
  else RECURRING_RULES.push(rule)
  return rule
}

export async function deleteRecurringRule(id: UUID): Promise<void> {
  await simulateLatency()
  const i = RECURRING_RULES.findIndex((r) => r.id === id)
  if (i >= 0) RECURRING_RULES.splice(i, 1)
}

/* -------------------------------------------------------- admin aggregates */

/** A closed date range, inclusive of both ends. `yyyy-mm-dd`, as the date inputs give it. */
export interface DashboardRange {
  from: string
  to: string
}

export interface AdminStats {
  /* --- Scoped to the selected range --------------------------------------- */
  donations: Money
  /** The same measure over the immediately preceding window of equal length. */
  donationsPrev: Money
  sponsorships: number
  sponsorshipsPrev: number
  sponsorshipRevenue: Money
  newDevotees: number
  newDevoteesPrev: number
  trend: Array<{ label: string; amount: Money }>
  byPujaType: Array<{ type: string; bookings: number }>
  /** How the trend was bucketed, so the chart can caption itself honestly. */
  grain: 'day' | 'week' | 'month'
  days: number

  /* --- Point in time. These ignore the range entirely ---------------------- */
  activeBookings: number
  activeMemberships: number
  devoteeCount: number
  todayQueue: number
  overduePrasadam: number
}

const startOfDay = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

const endOfDay = (d: Date) => {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

/**
 * Buckets for the trend chart, chosen from the span rather than fixed at monthly.
 * A seven-day range plotted in months is one point; a two-year range plotted in days
 * is 730 of them. Neither is a chart, so the grain follows the question being asked.
 */
function buildBuckets(from: Date, to: Date, grain: 'day' | 'week' | 'month') {
  const out: { start: Date; end: Date; label: string }[] = []
  const cursor = new Date(from)

  while (cursor.getTime() <= to.getTime()) {
    let end: Date
    let label: string

    if (grain === 'month') {
      end = endOfDay(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0))
      label = cursor.toLocaleString('en-US', { month: 'short' })
    } else if (grain === 'week') {
      end = endOfDay(new Date(cursor.getTime() + 6 * 86400000))
      label = cursor.toLocaleString('en-US', { month: 'short', day: 'numeric' })
    } else {
      end = endOfDay(cursor)
      label = cursor.toLocaleString('en-US', { month: 'short', day: 'numeric' })
    }

    out.push({ start: new Date(cursor), end: end > to ? to : end, label })

    if (grain === 'month') cursor.setMonth(cursor.getMonth() + 1, 1)
    else cursor.setDate(cursor.getDate() + (grain === 'week' ? 7 : 1))
    cursor.setHours(0, 0, 0, 0)
  }

  return out
}

/**
 * Dashboard aggregates for a date range.
 *
 * Only the figures that genuinely have a period are scoped by it. "Active bookings",
 * "today's queue" and "overdue prasadam" are counts of what is true right now — there
 * is no such thing as an overdue shipment "in June" — so they are returned unscoped
 * and the dashboard groups them apart rather than quietly re-labelling a live number
 * as a historical one.
 */
export async function getAdminStats(range?: DashboardRange): Promise<AdminStats> {
  await simulateLatency()
  const now = new Date()

  const to = range ? endOfDay(new Date(`${range.to}T12:00:00`)) : endOfDay(now)
  const from = range
    ? startOfDay(new Date(`${range.from}T12:00:00`))
    : startOfDay(new Date(now.getFullYear(), 0, 1))

  const span = Math.max(0, to.getTime() - from.getTime())
  // `to` is the end of its day, so the span already covers the final day whole — the
  // inclusive count is the rounded span, not the span plus one.
  const days = Math.max(1, Math.round(span / 86400000))

  // The window immediately before this one, same length — what "vs previous" compares to.
  const prevTo = new Date(from.getTime() - 1)
  const prevFrom = new Date(prevTo.getTime() - span)

  const within = (iso: string, a: Date, b: Date) => {
    const t = new Date(iso).getTime()
    return t >= a.getTime() && t <= b.getTime()
  }

  const donationsBetween = (a: Date, b: Date) =>
    DONATIONS.filter((d) => within(d.createdAt, a, b)).reduce((s, d) => s + d.amount, 0)

  const bookingsBetween = (a: Date, b: Date) =>
    BOOKINGS.filter((bk) => bk.status !== 'cancelled' && within(bk.createdAt, a, b))

  const devoteesBetween = (a: Date, b: Date) =>
    USERS.filter((u) => u.role === 'devotee' && within(u.createdAt, a, b)).length

  const rangeBookings = bookingsBetween(from, to)

  const grain: 'day' | 'week' | 'month' = days <= 31 ? 'day' : days <= 130 ? 'week' : 'month'
  const trend = buildBuckets(from, to, grain).map((b) => ({
    label: b.label,
    amount: donationsBetween(b.start, b.end),
  }))

  const typeCounts = new Map<string, number>()
  for (const b of rangeBookings) {
    const puja = PUJA_CATALOG.find((p) => p.id === b.pujaCatalogId)
    if (!puja) continue
    typeCounts.set(puja.type, (typeCounts.get(puja.type) ?? 0) + 1)
  }

  const todayKey = now.toDateString()

  return {
    donations: donationsBetween(from, to),
    donationsPrev: donationsBetween(prevFrom, prevTo),
    sponsorships: rangeBookings.length,
    sponsorshipsPrev: bookingsBetween(prevFrom, prevTo).length,
    sponsorshipRevenue: rangeBookings.reduce((s, b) => s + b.amount, 0),
    newDevotees: devoteesBetween(from, to),
    newDevoteesPrev: devoteesBetween(prevFrom, prevTo),
    trend,
    byPujaType: [...typeCounts.entries()].map(([type, bookings]) => ({ type, bookings })),
    grain,
    days,

    activeBookings: BOOKINGS.filter((b) => b.status === 'active').length,
    activeMemberships: MEMBERSHIPS.filter((m) => m.status === 'active').length,
    devoteeCount: USERS.filter((u) => u.role === 'devotee').length,
    todayQueue: OCCURRENCES.filter(
      (o) => new Date(o.scheduledAt).toDateString() === todayKey && o.status === 'scheduled',
    ).length,
    overduePrasadam: BOOKINGS.filter(
      (b) => b.status === 'active' && b.addOns.includes('prasadam-post'),
    ).length,
  }
}
