import { Crown, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { MembershipTier, Role } from '@/lib/data/types'
import { titleCase } from '@/lib/utils'

const ROLE_VARIANT: Record<Role, 'brand' | 'gold' | 'leaf' | 'neutral'> = {
  admin: 'brand',
  board: 'gold',
  priest: 'leaf',
  devotee: 'neutral',
  // The two approval desks. Accounts wears the money colour the ledger already uses;
  // the committee wears the priests' green, since what it decides is who officiates.
  finance: 'gold',
  committee: 'leaf',
  // The kitchen wears the saffron the cafeteria board already uses.
  kitchen: 'gold',
  // The school coordinators wear the tulsi green the classes use.
  school: 'leaf',
}

export const RoleBadge = ({ role }: { role: Role }) => (
  <Badge variant={ROLE_VARIANT[role]}>{titleCase(role)}</Badge>
)

/**
 * The two memberships wear different marks but not a hierarchy of them — the senior
 * rate is a concession, not a lesser membership, so neither badge is the dull one.
 */
const TIER_META: Record<
  MembershipTier,
  { variant: 'neutral' | 'gold' | 'brand'; Icon: typeof Crown; label: string }
> = {
  normal: { variant: 'gold', Icon: ShieldCheck, label: 'Member' },
  senior: { variant: 'brand', Icon: Crown, label: 'Senior Citizen' },
}

export const TierBadge = ({ tier }: { tier: MembershipTier }) => {
  const meta = TIER_META[tier]
  if (!meta) return <Badge variant="neutral">{titleCase(tier)}</Badge>
  return (
    <Badge variant={meta.variant}>
      <meta.Icon className="size-3" />
      {meta.label}
    </Badge>
  )
}

type AnyStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'scheduled'
  | 'skipped'
  | 'expired'
  | 'pending'
  | 'confirmed'
  | 'upcoming'
  | 'ongoing'
  | 'planned'
  | 'in-progress'
  // A pledge: a promise the temple is holding, and how much of it has arrived.
  | 'partially-fulfilled'
  | 'fulfilled'
  | 'lapsed'
  // A cafeteria ticket, from the rail to the counter.
  | 'placed'
  | 'preparing'
  | 'ready'
  | 'collected'
  // Volunteer campaigns, and the two axes underneath them: what was asked (an invite)
  // and what the temple got (a roster place).
  | 'draft'
  | 'recruiting'
  | 'staffed'
  | 'sent'
  | 'accepted'
  | 'declined'
  | 'no-response'
  | 'checked-in'
  | 'no-show'
  | 'withdrawn'

const STATUS_VARIANT: Record<AnyStatus, 'leaf' | 'gold' | 'brand' | 'neutral' | 'default'> = {
  active: 'leaf',
  confirmed: 'leaf',
  completed: 'neutral',
  scheduled: 'default',
  upcoming: 'default',
  ongoing: 'leaf',
  'in-progress': 'gold',
  // A pledge not yet due is simply waiting, like a scheduled puja; part-paid wears the
  // same amber as anything still owing; lapsed wears the warning colour because an
  // unkept promise is the one row on the register that needs somebody to act.
  'partially-fulfilled': 'gold',
  fulfilled: 'leaf',
  lapsed: 'brand',
  // An unaccepted ticket is the loud one — it is work nobody has looked at yet.
  placed: 'brand',
  preparing: 'gold',
  ready: 'leaf',
  collected: 'neutral',
  planned: 'neutral',
  pending: 'gold',
  paused: 'gold',
  expired: 'brand',
  cancelled: 'brand',
  skipped: 'brand',
  // A campaign nobody has broadcast yet is neutral, not a warning — drafting is a
  // normal place to be sitting.
  draft: 'neutral',
  recruiting: 'gold',
  staffed: 'leaf',
  // An invite that has gone out but drawn no reply is the same "waiting on someone
  // else" as a pending payment, and wears the same colour.
  sent: 'gold',
  accepted: 'leaf',
  declined: 'brand',
  'no-response': 'neutral',
  'checked-in': 'leaf',
  'no-show': 'brand',
  withdrawn: 'brand',
}

/**
 * The tint that separates one status from another is deliberately quiet — in a
 * forty-row table a badge is a label, not a highlight — but held that quiet, "Completed"
 * and "Scheduled" became the same pale pill two rows apart, and the roster's whole job
 * is telling those two apart at a glance.
 *
 * A solid dot restores that at no extra volume: it is small enough to stay out of the
 * way when you are reading a name, and saturated enough to scan straight down the
 * column when you are counting what is left to do. Colour is never the only carrier —
 * the word is right beside it.
 */
const STATUS_DOT: Record<AnyStatus, string> = {
  active: 'bg-leaf-500',
  confirmed: 'bg-leaf-500',
  completed: 'bg-leaf-400',
  scheduled: 'bg-saffron-500',
  upcoming: 'bg-saffron-500',
  ongoing: 'bg-leaf-500',
  'in-progress': 'bg-saffron-500',
  'partially-fulfilled': 'bg-saffron-500',
  fulfilled: 'bg-leaf-500',
  lapsed: 'bg-brand-500',
  placed: 'bg-brand-500',
  preparing: 'bg-saffron-500',
  ready: 'bg-leaf-500',
  collected: 'bg-leaf-400',
  planned: 'bg-faint',
  pending: 'bg-saffron-500',
  paused: 'bg-saffron-500',
  expired: 'bg-brand-500',
  cancelled: 'bg-brand-500',
  skipped: 'bg-brand-500',
  draft: 'bg-faint',
  recruiting: 'bg-saffron-500',
  staffed: 'bg-leaf-500',
  sent: 'bg-saffron-500',
  accepted: 'bg-leaf-500',
  declined: 'bg-brand-500',
  'no-response': 'bg-faint',
  // Deliberately the deeper green: on the day, "checked in" and "confirmed" sit in the
  // same column and the coordinator is counting only the first.
  'checked-in': 'bg-leaf-600',
  'no-show': 'bg-brand-500',
  withdrawn: 'bg-brand-500',
}

/**
 * @param label overrides the humanised status.
 *
 * `titleCase` turns most statuses into the words people actually use, but not all:
 * it renders `pending-payment` as "Pending Payment" while every other surface in
 * the school module calls that state "Awaiting payment". A coordinator filtering
 * for one and reading the other has to work out they are the same thing.
 */
export const StatusPill = ({ status, label }: { status: string; label?: string }) => (
  <Badge variant={STATUS_VARIANT[status as AnyStatus] ?? 'neutral'}>
    <span
      className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT[status as AnyStatus] ?? 'bg-faint'}`}
      aria-hidden="true"
    />
    {label ?? titleCase(status)}
  </Badge>
)
