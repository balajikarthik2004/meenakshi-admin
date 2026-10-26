import type { ProjectCoverKey } from '@/components/shared/ProjectCover'

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

export type Role =
  | 'devotee'
  | 'admin'
  | 'board'
  | 'priest'
  | 'finance'
  | 'committee'
  // The cafeteria staff. Narrow on purpose: the kitchen board is a working surface
  // by the pass, and this role reaches it and nothing else in the console.
  | 'kitchen'
  // The Vedic Heritage School coordinators, who run enrolment and the registers.
  | 'school'

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

/**
 * Where a booking has reached in the temple's approval chain.
 *
 * Deliberately a *different axis* from `Booking.status`. That field is the sponsorship's
 * lifecycle — running, paused, finished — and half the console's money figures are derived
 * from it. Approval is the question of whether the sponsorship should be running at all,
 * so it lives here and leaves those figures alone. A booking is `status: 'pending'` for
 * every stage below except `scheduled` (which makes it `'active'`) and `declined`
 * (which makes it `'cancelled'`).
 */
export type ApprovalStage =
  /** With the accounts desk, awaiting verification that the money actually arrived. */
  | 'finance-review'
  /** Accounts sent it back — the payment did not come through and can still be settled. */
  | 'payment-pending'
  /** Payment verified; waiting on the puja committee to put a priest on it. */
  | 'committee-review'
  /** A priest is assigned and the sponsorship is live. */
  | 'scheduled'
  /** Refused outright, with a reason. */
  | 'declined'

/** One hand-off in the chain. Together these are the booking's audit trail. */
export interface ApprovalEvent {
  at: ISODate
  actorId: UUID
  actorName: string
  actorRole: Role
  action:
    | 'submitted'
    | 'payment-verified'
    | 'sent-back'
    | 'resubmitted'
    | 'declined'
    | 'priest-assigned'
    | 'priest-reassigned'
  /** The typed reason. Required by the UI for `sent-back` and `declined`. */
  note?: string
}

/**
 * What the accounts desk checks against.
 *
 * `method` is what the devotee said they would use; `reference` is the transaction id or
 * cheque number the desk actually matched against the bank statement. Verifying without a
 * reference would record that someone looked, but not what they looked at.
 */
export interface PaymentRecord {
  method: 'card' | 'ach' | 'zelle' | 'check' | 'cash'
  reference?: string
  receivedAt?: ISODate
  verifiedBy?: UUID
  verifiedAt?: ISODate
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
  /** `'pending'` means it has not cleared approval — it is not yet real money. */
  status: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled'
  /** Absent on the historic seed; every booking created from now on carries one. */
  approval?: { stage: ApprovalStage; history: ApprovalEvent[] }
  payment?: PaymentRecord
  /** The committee's default priest, copied onto every occurrence it generates. */
  assignedPriestId?: UUID
  createdAt: ISODate
}

export interface PujaOccurrence {
  id: UUID
  bookingId: UUID
  scheduledAt: ISODate
  fulfilledAt?: ISODate
  /** Display name of the priest. Kept as the denormalised label the roster prints. */
  officiant?: string
  /** `Staff.id` of the assigned priest — what a reassignment actually writes. */
  officiantId?: UUID
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
  | 'project'
  | 'other'

/**
 * Who a gift came from, captured directly rather than through an account.
 *
 * A signed-in devotee is identified by `Donation.userId`. A visitor who gives or
 * pledges from the public site has no account to point at, so their own details ride
 * along on the record — which is what lets this console name them instead of printing
 * "Anonymous" over somebody who told the temple exactly who they were. Mirrors the
 * same interface in `meenakshi-devotee`.
 */
export interface DonorContact {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface Donation {
  id: UUID
  userId: UUID | null // null for anonymous
  /** Set when `userId` is null and the giver identified themselves at the gate. */
  donor?: DonorContact
  category: DonationCategory
  amount: Money
  isRecurring: boolean
  recurringCadence?: Cadence
  paymentMethod: 'card' | 'ach' | 'zelle' | 'check' | 'cash'
  dedicatedTo?: string
  /** Set when `category` is `event` — the festival this gift sponsors. */
  eventId?: UUID
  /** Set when `category` is `project` — the capital project this gift builds. */
  projectId?: UUID
  /** Labels of the sponsorship items chosen, in the order they are offered. */
  eventItems?: string[]
  /** Set when this gift settled a pledge instalment — see `Pledge`. */
  pledgeId?: UUID
  taxReceiptId?: UUID
  createdAt: ISODate
}

/* ------------------------------------------------------------------ pledges */

/** The intervals a pledge may repeat on. Daily and weekly are deliberately absent —
 *  a promise the temple has to chase 52 times a year is an invoice, not a pledge. */
export type PledgeCadence = Extract<Cadence, 'one-time' | 'monthly' | 'quarterly' | 'yearly'>

/**
 * Where a promise has got to.
 *
 * `lapsed` is reserved for a pledge whose every due date has gone by with nothing
 * paid. A pledge that is part-paid stays `partially-fulfilled` however late the rest
 * runs — writing it off is a decision somebody makes, not one a date makes for them.
 */
export type PledgeStatus =
  'scheduled' | 'partially-fulfilled' | 'fulfilled' | 'lapsed' | 'cancelled'

/** One dated promise inside a pledge. A monthly pledge over a year holds twelve. */
export interface PledgeInstallment {
  /** `pld_0007-3` — stable across reloads, which a chase list needs it to be. */
  id: UUID
  dueDate: ISODate
  amount: Money
  status: 'due' | 'paid' | 'skipped'
  /** The `Donation.id` that settled it. Present only when `status` is `paid`. */
  donationId?: UUID
  paidAt?: ISODate
}

/**
 * A promise to give, on a date that has not arrived yet.
 *
 * Deliberately its own record rather than a flag on `Donation`, for the same reason
 * `ApprovalStage` is kept apart from `Booking.status`: a pledge is *intent*, and a
 * `Donation` is what actually happened. Keeping them apart is what protects every
 * money figure in both apps — a pledge is not income, is not in the YTD total the
 * transparency strip publishes, does not move a festival's break-even meter, and
 * carries no tax receipt, because under 501(c)(3) rules a promise is deductible only
 * once it is paid.
 *
 * Money enters the ledger at exactly one point: `settlePledgeInstallment`, which
 * creates a real `Donation` carrying `pledgeId` back to the promise it settled.
 */
export interface Pledge {
  id: UUID
  userId: UUID | null // null when pledged by a guest — see `donor`
  /** Set when `userId` is null: the guest's details, taken at the donation gate. */
  donor?: DonorContact
  category: DonationCategory
  /** Set when `category` is `project` — the capital project being promised to. */
  projectId?: UUID
  /** Per instalment, not the total. The total is `amount × installments.length`. */
  amount: Money
  cadence: PledgeCadence
  /** When the first instalment falls due. Always in the future at creation. */
  startDate: ISODate
  installments: PledgeInstallment[]
  dedicatedTo?: string
  /** How the devotee *intends* to pay. Nothing is charged until an instalment settles. */
  intendedMethod: Donation['paymentMethod']
  /** A line the devotee left for the office — "after the house sale closes". */
  note?: string
  status: PledgeStatus
  createdAt: ISODate
  cancelledAt?: ISODate
}

/**
 * Two memberships: the standard one, and the concessional rate for devotees aged 65
 * and over. Not a ladder — the benefits are the same and only the price differs, so
 * these are two prices for one membership rather than three tiers of access.
 * Eligibility for `senior` is decided in `@/lib/membership`, never inline.
 */
/* ------------------------------------------------------------------ kitchen */

/** The three services the temple kitchen runs. An item belongs to one or more. */
export type MealWindow = 'breakfast' | 'lunch' | 'evening'

/** The groupings the Devasthanam publishes its menu under. */
export type MenuCategory =
  | 'breakfast'
  | 'dosa'
  | 'snacks'
  | 'rice'
  | 'beverages'
  /** Weekend-only cooking, and the savouries sold off the shelf. */
  | 'weekend'

/**
 * One dish on the cafeteria board.
 *
 * Everything the temple kitchen cooks is vegetarian, so there is no flag for it —
 * a tick against every single row tells a devotee nothing. What does vary, and
 * therefore is recorded: whether a dish is cooked without onion and garlic, whether
 * it carries nuts, and which services it is actually cooked for. Idli at eight in the
 * evening is not something this kitchen makes, and offering it would produce an order
 * the counter has to ring back and cancel.
 */
export interface MenuItem {
  id: UUID
  name: string
  /** The name called out at the counter, where it differs. */
  tamilName?: string
  description: string
  category: MenuCategory
  price: Money
  /**
   * A photograph of the dish. Absent where no honest one exists — the card falls
   * back to a typographic tile rather than borrowing a picture of something else.
   */
  image?: string
  /** Minutes at the pass for one portion — what the ready-by estimate is built from. */
  prepMinutes: number
  /** Which services it is cooked for. */
  servedAt: MealWindow[]
  /** Weekday numbers it is cooked on, 0 = Sunday. Absent means every open day. */
  servedOn?: number[]
  /** Off the board today — sold out, or the cook is away. */
  available: boolean
  /** No onion, no garlic. */
  noOnionGarlic?: boolean
  containsNuts?: boolean
  spicy?: boolean
  popular?: boolean
}

/**
 * One service on one weekday.
 *
 * Online ordering closes `lastOrderMinutesBefore` ahead of the shutters, because an
 * order placed four minutes before the kitchen closes is an order nobody cooks. The
 * cut-off is data rather than a constant so the long weekend lunch and the short
 * weekday one can differ.
 */
export interface KitchenWindow {
  /** 0 = Sunday. */
  day: number
  meal: MealWindow
  /** `HH:mm`, local temple time. */
  opens: string
  closes: string
  lastOrderMinutesBefore: number
}

/**
 * Where an order has got to.
 *
 * `placed` is the state that matters: it means the ticket is on the rail and nobody
 * in the kitchen has picked it up yet. The board makes that one loud on purpose.
 */
export type OrderStatus = 'placed' | 'preparing' | 'ready' | 'collected' | 'cancelled'

/**
 * A line on a ticket.
 *
 * `name` and `unitPrice` are copied rather than looked up, because the menu is edited
 * and a dish that is renamed or repriced next month must not silently rewrite what
 * somebody ordered and paid for last week.
 */
export interface OrderLine {
  itemId: UUID
  name: string
  qty: number
  unitPrice: Money
}

export interface KitchenOrder {
  id: UUID
  /**
   * The short token called out at the counter — "B-14".
   * Deliberately not the id: nobody reads `ord_0007` across a serving hatch.
   */
  token: string
  userId: UUID | null
  /** Set when `userId` is null — a guest ordering from the public site. */
  donor?: DonorContact
  /** Who to call out for, and the number the counter rings if something is wrong. */
  contactName: string
  contactPhone: string
  meal: MealWindow
  lines: OrderLine[]
  subtotal: Money
  /** Optional top-up to the annadanam fund, taken with the order. */
  donationAmount: Money
  total: Money
  status: OrderStatus
  paymentMethod: 'card' | 'cash-at-counter'
  /** Minutes the kitchen quoted at the moment it accepted the ticket. */
  promisedMinutes: number
  /** "Less spicy", "no coriander" — read at the pass. */
  note?: string
  placedAt: ISODate
  acceptedAt?: ISODate
  readyAt?: ISODate
  collectedAt?: ISODate
  cancelledAt?: ISODate
  /** Why the kitchen could not cook it. Shown to the devotee, so it must be a reason. */
  cancelReason?: string
}

/* ------------------------------------------------------------------- school */

/**
 * The Vedic Heritage School's class groupings.
 *
 * `purna-vidya` is the spine of the Hindu WISDOM Program — nine progressive levels
 * for ages five to sixteen — and the rest are the classes that run alongside it on
 * the same Sunday morning.
 */
export type ClassCategory =
  | 'purna-vidya'
  | 'language'
  | 'music'
  | 'wellbeing'
  | 'enrichment'
  | 'parents'

/** Who a class is for. `family` means a parent and child attend together. */
export type ClassAudience = 'child' | 'youth' | 'adult' | 'family'

/**
 * An academic year.
 *
 * Enrolment is gated on the registration window rather than on the teaching dates:
 * the school takes bookings for months before the first Sunday, and stops taking
 * them once the year is under way and the books have been ordered.
 */
export interface SchoolTerm {
  id: UUID
  name: string
  /** First and last teaching day. */
  startDate: ISODate
  endDate: ISODate
  registrationOpens: ISODate
  registrationCloses: ISODate
  /** How often classes meet, as the school publishes it. */
  cadence: string
  status: 'upcoming' | 'open' | 'in-progress' | 'closed'
}

/**
 * One class a devotee can enrol a student in.
 *
 * `enrolled` is a count held on the class rather than derived from the enrolment
 * list, for the same reason a festival carries `collectedAmount`: the seats taken
 * include years of paper registrations that predate this app, and a number derived
 * only from rows in here would tell a parent a full class had places.
 */
export interface SchoolClass {
  id: UUID
  slug: string
  /** Short code the school uses on its own registers — "PV-3", "TAM-1". */
  code: string
  name: string
  category: ClassCategory
  summary: string
  description: string
  /** Youngest age admitted, in years on the first teaching day. */
  minAge: number
  /** Oldest age admitted. Absent means no upper limit. */
  maxAge?: number
  audience: ClassAudience
  /** 0 = Sunday. The whole school runs on Sunday mornings. */
  day: number
  /** `HH:mm`, local temple time. */
  startTime: string
  endTime: string
  room: string
  teacher: string
  /** For the whole academic year, not per session. */
  fee: Money
  capacity: number
  /** Seats already taken, including registrations made off this app. */
  enrolled: number
  /**
   * The class a student is normally expected to have finished first.
   *
   * Advisory, not enforced. The Purna Vidya levels are progressive, but a family
   * joining midway is placed by the coordinator after an assessment — so the app
   * says what the expectation is and lets the coordinator decide, rather than
   * refusing a booking it is not qualified to refuse.
   */
  prerequisiteClassId?: UUID
  notes: string[]
  image?: string
  active: boolean
}

/**
 * Where an enrolment has got to.
 *
 * `pending-payment` is the state the school actually operates: its own instructions
 * are to pay first and register second, so a registration that has not been paid for
 * is a real and common thing rather than an error. `waitlisted` exists because a full
 * class should take a name, not turn a family away.
 */
export type EnrolmentStatus =
  | 'pending-payment'
  | 'enrolled'
  | 'waitlisted'
  | 'withdrawn'
  | 'completed'

export interface ClassEnrolment {
  id: UUID
  termId: UUID
  classId: UUID
  /** The account that booked — the parent, where the student is a child. */
  userId: UUID | null
  /** Set when `userId` is null: a guest who booked from the public site. */
  donor?: DonorContact
  /** Who actually attends. Deliberately not the account holder's name. */
  studentName: string
  /** Age on the first teaching day, which is what admission is judged on. */
  studentAge: number
  guardianName: string
  guardianPhone: string
  guardianEmail: string
  status: EnrolmentStatus
  /** What was quoted at the time. Copied, so a later fee change cannot rewrite it. */
  fee: Money
  paymentMethod: 'card' | 'check' | 'zelle' | 'cash'
  paidAt?: ISODate
  /** Where they sit on the waiting list. Set only while `waitlisted`. */
  waitlistPosition?: number
  /** Anything the family told the school — an allergy, a sibling to seat with. */
  notes?: string
  createdAt: ISODate
  withdrawnAt?: ISODate
}

export type MembershipTier = 'normal' | 'senior'
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

/**
 * One payment made out of a project's fund.
 *
 * `Project.spentAmount` used to be a bare number with nothing behind it, which made
 * "where did the money go" a question the app could state but not answer. Expenses are
 * stored as the lines that add up to it — the same shape the store keeps for stock,
 * where movements and the balance they arrive at are held together so a reload cannot
 * leave the ledger and the count disagreeing. The seed asserts the two still agree.
 */
export interface ProjectExpense {
  id: UUID
  date: ISODate
  /** Who was paid. Named, because an unattributed outflow is not transparency. */
  vendor: string
  description: string
  amount: Money
  /** Invoice number or board minute the payment was authorised against. */
  reference?: string
}

/**
 * A capital project: something the temple is building, and the money for it.
 *
 * Two different percentages live on this record and they are deliberately not the same
 * number. `progressPct` is how much of the *work* is done; funding progress is derived
 * from `raisedAmount` against `targetAmount`. A project can be fully funded and barely
 * started, or half-funded and nearly finished because the board bridged it — and a
 * single bar that quietly averaged the two would hide exactly the situation a devotee
 * deciding where to give most needs to see.
 */
export interface Project {
  id: UUID
  /** URL-safe name — `/projects/:slug` on the devotee site. */
  slug: string
  title: string
  /** One line on a card: what this actually buys. */
  summary: string
  /** The paragraph on the detail page. */
  description: string
  targetAmount: Money
  raisedAmount: Money
  /** Always equal to the sum of `expenses`; the seed asserts it. */
  spentAmount: Money
  /** Physical work completed, 0–100. Not the funding figure — see the doc above. */
  progressPct: number
  status: 'planned' | 'in-progress' | 'completed'
  /** Whether the project is currently accepting gifts. */
  openForDonations: boolean
  startedAt?: ISODate
  targetCompletion?: ISODate
  /**
   * Which drawn elevation heads the page. Not a deity key: three of these projects
   * have nothing to photograph yet and a deity portrait over a solar array is the
   * wrong picture, however pretty. See `ProjectCover`.
   */
  cover: ProjectCoverKey
  /** A photograph of the finished work, once there is one. Wins over `cover`. */
  imageUrl?: string
  notes: string[]
  expenses: ProjectExpense[]
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

/* ---------------------------------------------------------------- volunteers */

/**
 * The volunteer side of a festival, in five entities.
 *
 * The shape here follows the same two-axis reasoning as `ApprovalStage` versus
 * `Booking.status`: what the temple *asked* and what the temple *got* are different
 * questions, so they are different records. A `VolunteerInvite` is the audit trail of
 * outreach — who was written to, on which channel, and what came back. A
 * `VolunteerAssignment` is current state — who is actually standing at the parking gate
 * on the day. Collapsing them would make "we asked forty people and eleven turned up"
 * unanswerable, and that ratio is the only number a coordinator plans next year from.
 *
 * It also lets a coordinator put somebody on the roster who was never invited — the
 * cousin who walked in on the morning — without inventing a fake invitation for them.
 */

/** The ten jobs a festival actually needs bodies for. Doubles as a volunteer's skills. */
export type VolunteerSkill =
  | 'kitchen'
  | 'decoration'
  | 'parking'
  | 'registration'
  | 'prasadam'
  | 'crowd'
  | 'cleanup'
  | 'av'
  | 'youth'
  | 'security'

export type VolunteerChannel = 'email' | 'sms' | 'both'

export interface Volunteer {
  id: UUID
  name: string
  email: string
  phone: string
  city: string
  skills: VolunteerSkill[]
  /** Set when this volunteer is also a registered devotee, so the two records agree. */
  userId?: UUID
  /** Free text the coordinator reads, never filtered on — "leaves by 8pm", "no lifting". */
  notes?: string
  /** `paused` keeps the history but drops them out of every outreach audience. */
  status: 'active' | 'paused'
  joinedAt: ISODate
  avatarInitials: string
}

/** One line of the campaign's ask: this job, this many people. */
export interface VolunteerNeed {
  roleKey: VolunteerSkill
  label: string
  blurb: string
  needed: number
}

export interface VolunteerCampaign {
  id: UUID
  /** The festival this staffs. A campaign never exists without an event behind it. */
  eventId: UUID
  title: string
  description: string
  /** The briefing, which is deliberately earlier than the festival itself. */
  briefingAt: ISODate
  coordinatorId: UUID
  needs: VolunteerNeed[]
  /**
   * `draft` has never been broadcast; the first send moves it to `recruiting`. `staffed`
   * is the coordinator's own judgement that every role is covered, not a computed state —
   * a role can be one short and still be fine, and only they know that.
   */
  status: 'draft' | 'recruiting' | 'staffed' | 'completed' | 'cancelled'
  createdAt: ISODate
}

/** The filter that resolved into a recipient list, kept so a send can be explained later. */
export interface VolunteerAudience {
  /** Empty means every skill — "anyone who can help". */
  skills: VolunteerSkill[]
  city?: string
  excludeInvited: boolean
  excludeRostered: boolean
}

/** One broadcast. Recipients are resolved at send time and frozen here. */
export interface VolunteerMessage {
  id: UUID
  campaignId: UUID
  channel: VolunteerChannel
  subject: string
  body: string
  recipientIds: UUID[]
  sentAt: ISODate
  sentByName: string
  audience: VolunteerAudience
}

export interface VolunteerInvite {
  id: UUID
  campaignId: UUID
  volunteerId: UUID
  messageId: UUID
  channel: VolunteerChannel
  /** `no-response` is set by the coordinator closing the loop, never by the passage of time. */
  status: 'sent' | 'accepted' | 'declined' | 'no-response'
  sentAt: ISODate
  respondedAt?: ISODate
  /** Why they declined — the coordinator's only record of it. */
  note?: string
}

export interface VolunteerAssignment {
  id: UUID
  campaignId: UUID
  volunteerId: UUID
  roleKey: VolunteerSkill
  shift: string
  status: 'pending' | 'confirmed' | 'checked-in' | 'no-show' | 'withdrawn'
  /** `invited` traces to an accepted invite; `direct` was placed by the coordinator. */
  source: 'invited' | 'direct'
  inviteId?: UUID
  addedAt: ISODate
  note?: string
}

/** Per-role staffing, computed from needs against the roster. */
export interface StaffingRow {
  roleKey: VolunteerSkill
  label: string
  needed: number
  confirmed: number
  pending: number
  short: number
}

/* ------------------------------------------------- stores, requirements, readiness */

/**
 * What a puja needs, what it costs, and whether the temple actually has it.
 *
 * Three records, split along the same seam as `ApprovalStage` versus `Booking.status`:
 * what the temple *intends* to use, what it *holds*, and what it *did* with it.
 *
 * `PujaRequirementSheet` is intent — the priest's standing list for a puja, agreed
 * once and reused for every performance of it. `StockItem.onHand` is holdings.
 * `StockMovement` is the history of every change to those holdings. Collapsing the
 * last two would make "we bought 5kg of ghee on Monday and have 800g on Friday"
 * unanswerable, and that gap is the only thing that tells a store keeper whether
 * consumption is normal or something walked off.
 *
 * Coverage — "is there enough for Thursday's abhishekam?" — is deliberately *not* a
 * record. It is the sheet read against `onHand` at the moment somebody asks, computed
 * into `ReadinessRow`. Storing it would let a cached "ready" outlive the stock it was
 * asserted about, which is precisely the failure this feature exists to prevent.
 */

/** Units a temple store actually counts in. Deliberately short — no unit conversion. */
export type StockUnit = 'pc' | 'kg' | 'g' | 'l' | 'ml' | 'bunch' | 'packet' | 'metre'

export type StockCategory =
  'flowers' | 'fruits' | 'dairy' | 'grains' | 'dravyam' | 'cloth' | 'lamp' | 'other'

export interface StockItem {
  id: UUID
  name: string
  category: StockCategory
  unit: StockUnit
  /** Quantity held right now. Every change to it also writes a `StockMovement`. */
  onHand: number
  /** At or below this the item reads as low and joins the reorder list. */
  reorderLevel: number
  /** Cost of one `unit` — the basis every requirement estimate is costed against. */
  unitCost: Money
  /** Where it is kept. Free text the store keeper reads, never filtered on. */
  storage?: string
  /** Perishables cannot be stocked ahead, so a shortfall in one is more urgent. */
  perishable: boolean
  active: boolean
  updatedAt: ISODate
}

/**
 * One change to a holding, signed.
 *
 * `balance` is the resulting on-hand figure, stored rather than re-summed. The ledger
 * is read far more often than it is written, and a running balance that has to be
 * recomputed from the head of the list every render is both slow and — the moment one
 * movement is ever back-dated — quietly wrong.
 */
export interface StockMovement {
  id: UUID
  itemId: UUID
  /** `received` and a positive `adjusted` add; `issued` and `wastage` subtract. */
  kind: 'received' | 'issued' | 'adjusted' | 'wastage'
  /** Signed, in the item's own unit. */
  qty: number
  balance: number
  /** Set on `issued` — which puja consumed it, so per-puja usage is answerable. */
  pujaCatalogId?: UUID
  occurrenceId?: UUID
  note?: string
  actorName: string
  at: ISODate
}

/** One line of a requirement sheet: this item, this much, for one performance. */
export interface RequirementLine {
  itemId: UUID
  /** Denormalised. A sheet approved last year must still read correctly after the
   *  item was renamed, and the figure finance signed off cannot move under it. */
  label: string
  unit: StockUnit
  qty: number
  /** Unit cost at the moment the sheet was costed — what the allocation was based on. */
  unitCost: Money
  /** Nice to have rather than required. Never counts towards a blocking shortfall. */
  optional?: boolean
  note?: string
}

/**
 * Where a requirement sheet has reached.
 *
 * `rejected` is not terminal — the priest revises and it returns to `draft`. It is a
 * distinct stage rather than a flag so a rejected sheet does not sit in the drafts list
 * looking like something nobody has got to yet.
 */
export type RequirementStage =
  /** The priest is still writing it. Not visible to any desk. */
  | 'draft'
  /** Submitted — accounts must put a per-performance figure against it. */
  | 'finance-review'
  /** Costed and allocated; waiting on the administrator's sign-off. */
  | 'admin-review'
  /** Live. Every occurrence of this puja checks stock against it. */
  | 'approved'
  /** Refused, with a reason. Revisable. */
  | 'rejected'
  /** Replaced by a later approved version, kept for the audit trail. */
  | 'superseded'

/** One hand-off in the requirement chain. Same shape as `ApprovalEvent`, on purpose. */
export interface RequirementEvent {
  at: ISODate
  actorId: UUID
  actorName: string
  actorRole: Role
  action:
    | 'drafted'
    | 'submitted'
    | 'allocated'
    | 'sent-back'
    | 'resubmitted'
    | 'approved'
    | 'rejected'
    | 'superseded'
  /** The typed reason. Required by the UI for `sent-back` and `rejected`. */
  note?: string
}

export interface PujaRequirementSheet {
  id: UUID
  pujaCatalogId: UUID
  /** Bumped when an approved sheet is replaced, so history reads as v1, v2, v3. */
  version: number
  lines: RequirementLine[]
  /** `lines` costed at the unit costs frozen on them — what finance was asked for. */
  estimatedCost: Money
  /** What finance actually granted per performance. May differ from the estimate. */
  allocatedAmount?: Money
  allocationNote?: string
  stage: RequirementStage
  history: RequirementEvent[]
  preparedById: UUID
  preparedByName: string
  createdAt: ISODate
  updatedAt: ISODate
}

/** The priest's sign-off on one upcoming occurrence. Coverage itself is computed. */
export interface PujaReadiness {
  id: UUID
  occurrenceId: UUID
  /** `flagged` means he looked and it is short — an answer, not an absence of one. */
  status: 'confirmed' | 'flagged'
  note?: string
  byId: UUID
  byName: string
  at: ISODate
  /** Movements the confirmation posted, so an issue can be traced back to its cause. */
  movementIds: UUID[]
}

/* ---- Computed, never persisted ---- */

/** Per-item coverage for one occurrence: what it needs against what the store holds. */
export interface ReadinessLine {
  itemId: UUID
  label: string
  unit: StockUnit
  required: number
  onHand: number
  /** How many units are missing. Zero when covered. */
  short: number
  optional: boolean
  perishable: boolean
}

/**
 * One row of the priest's pre-puja worklist.
 *
 * `state` folds the two questions the screen answers into one value: has anybody looked
 * at this yet, and is there enough. `no-sheet` is called out separately from `short`
 * because they need opposite responses — one is a shopping trip, the other is a
 * conversation with whoever never wrote the requirements down.
 */
export interface ReadinessRow {
  occurrence: PujaOccurrence
  puja: PujaCatalogItem
  sheet?: PujaRequirementSheet
  lines: ReadinessLine[]
  state: 'no-sheet' | 'ready' | 'short' | 'confirmed' | 'flagged'
  shortCount: number
  /** Cost of the units missing — what a store run would have to spend. */
  shortfallCost: Money
  readiness?: PujaReadiness
  /** Days until it is performed. Negative never appears; the window starts at today. */
  daysAway: number
}
