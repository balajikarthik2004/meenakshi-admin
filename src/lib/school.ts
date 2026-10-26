/**
 * Who may join which class, and whether there is room.
 *
 * Three rules decide every enrolment — the registration window, the age range, and
 * the seat count — and a parent on the public site and a coordinator in the console
 * have to get the same answer from all three. A family told online that a place
 * exists and then turned away at the desk is the failure this file prevents, so the
 * rules live here and both apps read them.
 *
 * Pure functions only, with no import from the data layer. Kept byte-identical in
 * `meenakshi-admin/src/lib/school.ts`.
 */
import type {
  ClassCategory,
  ClassEnrolment,
  EnrolmentStatus,
  SchoolClass,
  SchoolTerm,
} from '@/lib/data/types'

export const CATEGORY_LABEL: Record<ClassCategory, string> = {
  'purna-vidya': 'Purna Vidya',
  language: 'Languages',
  music: 'Music',
  wellbeing: 'Yoga & wellbeing',
  enrichment: 'Enrichment',
  parents: 'Parents’ Corner',
}

export const CATEGORY_BLURB: Record<ClassCategory, string> = {
  'purna-vidya': 'The nine-level core curriculum, ages 5 to 16',
  language: 'Tamil and Sanskrit, from the alphabet upward',
  music: 'Carnatic vocal and the temple instruments',
  wellbeing: 'Yoga for students and for parents',
  enrichment: 'Shloka assembly, chess and seva',
  parents: 'While your children are in class',
}

/** The order the catalogue lists its groups in. */
export const CATEGORY_ORDER: ClassCategory[] = [
  'purna-vidya',
  'language',
  'music',
  'wellbeing',
  'enrichment',
  'parents',
]

export const ENROLMENT_LABEL: Record<EnrolmentStatus, string> = {
  'pending-payment': 'Awaiting payment',
  enrolled: 'Enrolled',
  waitlisted: 'On the waiting list',
  withdrawn: 'Withdrawn',
  completed: 'Completed',
}

/** Seats left. Never negative — an over-subscribed register still reads zero. */
export const seatsLeft = (c: SchoolClass): number => Math.max(0, c.capacity - c.enrolled)

export const isFull = (c: SchoolClass): boolean => seatsLeft(c) === 0

/**
 * Nearly full, and worth saying so.
 *
 * A bare seat count on every card is noise; it only earns its place once it changes
 * what a parent does, which is when there are a handful left.
 */
export const isNearlyFull = (c: SchoolClass): boolean => !isFull(c) && seatsLeft(c) <= 4

/** How the age range reads on a card. */
export function ageRange(c: SchoolClass): string {
  if (c.audience === 'adult') return 'Adults'
  if (c.maxAge === undefined) return `Ages ${c.minAge} and up`
  return `Ages ${c.minAge}–${c.maxAge}`
}

export type AgeVerdict = 'ok' | 'too-young' | 'too-old'

/**
 * Whether a student's age admits them.
 *
 * Judged on their age at the first teaching day rather than today, because a child
 * who turns five in September is five for the year the school is enrolling them
 * into — and refusing them in March for being four would be refusing the wrong
 * question.
 */
export function ageVerdict(c: SchoolClass, age: number): AgeVerdict {
  if (age < c.minAge) return 'too-young'
  if (c.maxAge !== undefined && age > c.maxAge) return 'too-old'
  return 'ok'
}

/** Completed years on a given day. Month and day compared, not a subtraction. */
export function ageOnDate(dob: string, on: Date): number | null {
  const born = new Date(dob)
  if (Number.isNaN(born.getTime())) return null
  let years = on.getFullYear() - born.getFullYear()
  const m = on.getMonth() - born.getMonth()
  if (m < 0 || (m === 0 && on.getDate() < born.getDate())) years -= 1
  return years
}

export type TermWindow = 'before' | 'open' | 'closed-started' | 'ended'

/**
 * Where today sits against the term's registration window.
 *
 * Separate from `SchoolTerm.status`, which is what the office has published. This is
 * what the clock says, and the booking button reads this one.
 */
export function termWindow(term: SchoolTerm, now: Date = new Date()): TermWindow {
  const t = now.getTime()
  if (t < new Date(term.registrationOpens).getTime()) return 'before'
  if (t > new Date(term.endDate).getTime()) return 'ended'
  if (t > new Date(term.registrationCloses).getTime()) return 'closed-started'
  return 'open'
}

export const registrationOpen = (term: SchoolTerm, now: Date = new Date()): boolean =>
  termWindow(term, now) === 'open'

export interface EnrolVerdict {
  /** Whether a booking can be taken at all. */
  canBook: boolean
  /** What it would be taken as — a place, or a spot on the list. */
  outcome: 'enrol' | 'waitlist' | 'refuse'
  /** One sentence a page can print without rewording it. */
  reason: string
}

/**
 * Whether this student can be booked into this class, and as what.
 *
 * A full class produces a waiting place rather than a refusal: the school would
 * take the name at the desk, so the app does too. Only the registration window and
 * the age range actually refuse, and each says which it was — "come back in March"
 * and "she is too young for Level 4" need different answers from the family.
 */
export function enrolVerdict(
  cls: SchoolClass,
  term: SchoolTerm,
  studentAge: number | null,
  now: Date = new Date(),
): EnrolVerdict {
  if (!cls.active) {
    return { canBook: false, outcome: 'refuse', reason: 'This class is not running this year.' }
  }

  const window = termWindow(term, now)
  if (window === 'before') {
    return {
      canBook: false,
      outcome: 'refuse',
      reason: `Registration for ${term.name} has not opened yet.`,
    }
  }
  if (window === 'closed-started' || window === 'ended') {
    return {
      canBook: false,
      outcome: 'refuse',
      reason: `Registration for ${term.name} has closed. Please contact the coordinators.`,
    }
  }

  if (studentAge === null) {
    return { canBook: false, outcome: 'refuse', reason: 'Tell us the student’s age to continue.' }
  }

  const verdict = ageVerdict(cls, studentAge)
  if (verdict === 'too-young') {
    return {
      canBook: false,
      outcome: 'refuse',
      reason: `${cls.name} starts at age ${cls.minAge}. This student is ${studentAge}.`,
    }
  }
  if (verdict === 'too-old') {
    return {
      canBook: false,
      outcome: 'refuse',
      reason: `${cls.name} runs to age ${cls.maxAge}. This student is ${studentAge}.`,
    }
  }

  if (isFull(cls)) {
    return {
      canBook: true,
      outcome: 'waitlist',
      reason: 'This class is full. We will take the name and offer the first place that frees.',
    }
  }

  return {
    canBook: true,
    outcome: 'enrol',
    reason: `${seatsLeft(cls)} place${seatsLeft(cls) === 1 ? '' : 's'} left.`,
  }
}

/**
 * The status a new booking starts in.
 *
 * The school's own instruction is to pay first and register second, so an unpaid
 * registration is a normal state and not a failure. A free class skips it — there is
 * nothing to wait for.
 */
export function initialStatus(
  outcome: EnrolVerdict['outcome'],
  fee: number,
  method: ClassEnrolment['paymentMethod'],
): EnrolmentStatus {
  if (outcome === 'waitlist') return 'waitlisted'
  if (fee === 0) return 'enrolled'
  // A card is settled there and then; a cheque or a transfer is confirmed by the
  // office when it arrives, which is the whole reason this state exists.
  return method === 'card' ? 'enrolled' : 'pending-payment'
}

/** Enrolments that occupy a seat. A withdrawal frees one; a waiting place never held one. */
export const holdsSeat = (s: EnrolmentStatus): boolean =>
  s === 'enrolled' || s === 'pending-payment' || s === 'completed'

export interface SchoolSummary {
  classes: number
  /** Classes with at least one place left. */
  open: number
  full: number
  seats: number
  seatsTaken: number
  /** Enrolments the office still has to chase money for. */
  awaitingPayment: number
  waitlisted: number
  /** Fees banked against confirmed places. */
  feesCollected: number
  feesOutstanding: number
}

export function summariseSchool(
  classes: SchoolClass[],
  enrolments: ClassEnrolment[],
): SchoolSummary {
  const live = classes.filter((c) => c.active)
  return {
    classes: live.length,
    open: live.filter((c) => !isFull(c)).length,
    full: live.filter(isFull).length,
    seats: live.reduce((s, c) => s + c.capacity, 0),
    seatsTaken: live.reduce((s, c) => s + c.enrolled, 0),
    awaitingPayment: enrolments.filter((e) => e.status === 'pending-payment').length,
    waitlisted: enrolments.filter((e) => e.status === 'waitlisted').length,
    feesCollected: enrolments
      .filter((e) => e.status === 'enrolled' || e.status === 'completed')
      .reduce((s, e) => s + e.fee, 0),
    feesOutstanding: enrolments
      .filter((e) => e.status === 'pending-payment')
      .reduce((s, e) => s + e.fee, 0),
  }
}

/** `"8:45 AM – 12:30 PM"` from the two 24-hour strings a class stores. */
export function timeRange(start: string, end: string): string {
  const fmt = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number)
    const hour = h ?? 0
    const suffix = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour % 12 === 0 ? 12 : hour % 12
    return `${h12}:${String(m ?? 0).padStart(2, '0')} ${suffix}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}
