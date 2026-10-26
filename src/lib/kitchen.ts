/**
 * When the temple kitchen is open, and what that means for ordering.
 *
 * This is the one rule the whole module turns on: the cafeteria takes orders only
 * while it is actually cooking. Everything else — the menu filter, the disabled
 * checkout button, the "opens again at" line, the kitchen board's own clock — reads
 * from `kitchenStatusAt` rather than deciding for itself, because a page that thinks
 * the kitchen is open while the counter thinks it is shut produces an order nobody
 * cooks and a devotee standing at a closed hatch.
 *
 * Pure functions only, with no import from the data layer. Kept byte-identical in
 * `meenakshi-admin/src/lib/kitchen.ts`.
 */
import type { KitchenWindow, MealWindow, MenuItem, OrderLine, OrderStatus } from '@/lib/data/types'

export const MEAL_LABEL: Record<MealWindow, string> = {
  breakfast: 'Breakfast tiffin',
  lunch: 'Lunch',
  evening: 'Evening tiffin',
}

/**
 * The published service times.
 *
 * Monday is dark — the kitchen deep-cleans and the cooks have a day. Weekdays run
 * lunch only; the weekend carries all three services, which is when the temple is
 * actually full. Online ordering shuts half an hour before the hatch on the short
 * services and a full hour before the long weekend lunch, because that is the point
 * past which the pass cannot absorb another ticket.
 */
/**
 * TEMPORARY — Monday opened for testing.
 *
 * Monday is the kitchen's dark day: it deep-cleans and the cooks have a day off. It
 * is switched on here only so the ordering flow can be exercised on a Monday without
 * waiting for Tuesday lunch.
 *
 * To put it back: set this to `[]`, or delete the constant and the one spread of it
 * in `KITCHEN_WINDOWS` below. Nothing else in the app refers to it, and no seeded
 * data depends on Monday being open — the rail builds itself from whatever service
 * happens to be running.
 */
const MONDAY_TESTING_WINDOWS: KitchenWindow[] = [
  { day: 1, meal: 'breakfast', opens: '08:00', closes: '11:00', lastOrderMinutesBefore: 30 },
  { day: 1, meal: 'lunch', opens: '11:30', closes: '15:00', lastOrderMinutesBefore: 60 },
  { day: 1, meal: 'evening', opens: '17:00', closes: '20:30', lastOrderMinutesBefore: 30 },
]

export const KITCHEN_WINDOWS: KitchenWindow[] = [
  // Sunday
  { day: 0, meal: 'breakfast', opens: '08:00', closes: '11:00', lastOrderMinutesBefore: 30 },
  { day: 0, meal: 'lunch', opens: '11:30', closes: '15:00', lastOrderMinutesBefore: 60 },
  { day: 0, meal: 'evening', opens: '17:00', closes: '20:30', lastOrderMinutesBefore: 30 },
  // Monday — normally closed; open while testing. See above.
  ...MONDAY_TESTING_WINDOWS,
  // Tuesday – Thursday
  { day: 2, meal: 'lunch', opens: '11:30', closes: '14:30', lastOrderMinutesBefore: 30 },
  { day: 3, meal: 'lunch', opens: '11:30', closes: '14:30', lastOrderMinutesBefore: 30 },
  { day: 4, meal: 'lunch', opens: '11:30', closes: '14:30', lastOrderMinutesBefore: 30 },
  // Friday — the abhishekam evening draws a crowd, so the kitchen runs twice.
  { day: 5, meal: 'lunch', opens: '11:30', closes: '14:30', lastOrderMinutesBefore: 30 },
  { day: 5, meal: 'evening', opens: '17:30', closes: '20:30', lastOrderMinutesBefore: 30 },
  // Saturday
  { day: 6, meal: 'breakfast', opens: '08:00', closes: '11:00', lastOrderMinutesBefore: 30 },
  { day: 6, meal: 'lunch', opens: '11:30', closes: '15:00', lastOrderMinutesBefore: 60 },
  { day: 6, meal: 'evening', opens: '17:00', closes: '20:30', lastOrderMinutesBefore: 30 },
]

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

/** `"14:30"` → minutes since midnight. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** Minutes since midnight → `"2:30 PM"`. */
export function fmtClock(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes()

/** A date on the same clock, `n` days later. */
function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export const windowsFor = (day: number): KitchenWindow[] =>
  KITCHEN_WINDOWS.filter((w) => w.day === day).sort(
    (a, b) => toMinutes(a.opens) - toMinutes(b.opens),
  )

/** The last minute of a window at which the site will still take an order. */
export const lastOrderMinute = (w: KitchenWindow) => toMinutes(w.closes) - w.lastOrderMinutesBefore

export interface KitchenStatus {
  /** Serving right now — the hatch is open, whether or not the site will take an order. */
  serving: boolean
  /** The site will accept an order right now. This is what gates checkout. */
  ordering: boolean
  /** The service currently running, if any. */
  current?: KitchenWindow
  /** Why ordering is off, in a form a page can print without rewording it. */
  reason: 'open' | 'closed-today' | 'between-services' | 'last-orders-passed'
  /** The next service that will open, and the day it falls on. */
  next?: { window: KitchenWindow; date: Date }
  /** Minutes left before online ordering shuts for the current service. */
  minutesToLastOrder?: number
}

/**
 * Whether the kitchen is open, whether it will take an order, and what to say if not.
 *
 * `serving` and `ordering` are deliberately separate. In the last half-hour the hatch
 * is still open — a devotee already on site can queue and be served — but the site
 * stops taking new tickets, and telling them "closed" when they can see people eating
 * is the sort of thing that gets a volunteer shouted at.
 */
export function kitchenStatusAt(now: Date = new Date()): KitchenStatus {
  const nowMins = minutesOfDay(now)
  const today = windowsFor(now.getDay())

  const current = today.find((w) => nowMins >= toMinutes(w.opens) && nowMins < toMinutes(w.closes))

  if (current) {
    const cutoff = lastOrderMinute(current)
    if (nowMins < cutoff) {
      return {
        serving: true,
        ordering: true,
        current,
        reason: 'open',
        minutesToLastOrder: cutoff - nowMins,
        next: findNext(now),
      }
    }
    return {
      serving: true,
      ordering: false,
      current,
      reason: 'last-orders-passed',
      minutesToLastOrder: 0,
      next: findNext(now),
    }
  }

  const laterToday = today.some((w) => toMinutes(w.opens) > nowMins)
  return {
    serving: false,
    ordering: false,
    reason: laterToday ? 'between-services' : 'closed-today',
    next: findNext(now),
  }
}

/** The next service that opens strictly after `now`, searching up to a week out. */
function findNext(now: Date): { window: KitchenWindow; date: Date } | undefined {
  const nowMins = minutesOfDay(now)
  for (let offset = 0; offset < 8; offset++) {
    const date = addDays(now, offset)
    for (const w of windowsFor(date.getDay())) {
      if (offset === 0 && toMinutes(w.opens) <= nowMins) continue
      return { window: w, date }
    }
  }
  return undefined
}

/** Whether a dish is cooked at this service, on this day. */
export function isItemServed(item: MenuItem, meal: MealWindow, day: number): boolean {
  if (!item.available) return false
  if (!item.servedAt.includes(meal)) return false
  return item.servedOn ? item.servedOn.includes(day) : true
}

export const linesSubtotal = (lines: OrderLine[]): number =>
  lines.reduce((s, l) => s + l.unitPrice * l.qty, 0)

/**
 * How long the kitchen will take.
 *
 * The slowest dish sets the floor, because everything goes out on one tray — eight
 * idlis do not take eight times as long, but a dosa cooked to order holds the whole
 * ticket. A small amount is then added per extra portion for the pass, and the result
 * is rounded up to five minutes, since a board reading "17 minutes" claims a
 * precision no kitchen has.
 */
export function estimateMinutes(lines: OrderLine[], menu: MenuItem[], queueAhead = 0): number {
  if (lines.length === 0) return 0
  const slowest = lines.reduce((max, l) => {
    const item = menu.find((m) => m.id === l.itemId)
    return Math.max(max, item?.prepMinutes ?? 5)
  }, 0)
  const portions = lines.reduce((s, l) => s + l.qty, 0)
  const raw = slowest + Math.max(0, portions - 1) * 1.5 + queueAhead * 2
  return Math.max(5, Math.ceil(raw / 5) * 5)
}

/** Orders still in front of this one at the pass. */
export const isActive = (status: OrderStatus) => status === 'placed' || status === 'preparing'

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  placed: 'Sent to the kitchen',
  preparing: 'Being cooked',
  ready: 'Ready to collect',
  collected: 'Collected',
  cancelled: 'Cancelled',
}

/** The three steps a devotee is shown, in order. Cancelled is not a step. */
export const ORDER_STEPS: { status: OrderStatus; label: string; blurb: string }[] = [
  { status: 'placed', label: 'Order received', blurb: 'Your ticket is on the kitchen rail.' },
  { status: 'preparing', label: 'Being cooked', blurb: 'The kitchen has started your order.' },
  {
    status: 'ready',
    label: 'Ready to collect',
    blurb: 'Show your token at the cafeteria counter.',
  },
]

/** How far along the three steps an order is: 0, 1, 2, or 3 when collected. */
export function stepIndex(status: OrderStatus): number {
  if (status === 'collected') return 3
  const i = ORDER_STEPS.findIndex((s) => s.status === status)
  return i < 0 ? 0 : i
}

/** Minutes a ticket has been waiting — what turns a board ticket red. */
export const minutesWaiting = (placedAt: string, now: Date = new Date()) =>
  Math.max(0, Math.floor((now.getTime() - new Date(placedAt).getTime()) / 60000))

/**
 * How loud a ticket should be on the kitchen board.
 *
 * An unaccepted ticket is always urgent — that is the state the board exists to make
 * impossible to miss. Beyond that, lateness is measured against what the kitchen
 * itself promised, not against a fixed number, so a thali and a filter coffee are not
 * held to the same clock.
 */
export function ticketUrgency(
  status: OrderStatus,
  placedAt: string,
  promisedMinutes: number,
  now: Date = new Date(),
): 'new' | 'ontime' | 'late' {
  if (status === 'placed') return 'new'
  // A ticket that has been handed over or called off cannot run late. Without this
  // every collected order turns red the moment its promised time passes, which is
  // always, and the board's one alarming colour stops meaning anything.
  if (status === 'collected' || status === 'cancelled') return 'ontime'
  const waited = minutesWaiting(placedAt, now)
  return waited > promisedMinutes ? 'late' : 'ontime'
}
