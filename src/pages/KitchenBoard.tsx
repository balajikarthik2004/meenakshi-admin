import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BellRing,
  Check,
  ChefHat,
  MessageSquare,
  Phone,
  TriangleAlert,
  UtensilsCrossed,
  Wallet,
  X,
} from 'lucide-react'
import type { KitchenOrder, OrderStatus } from '@/lib/data/types'
import { PageShell } from '@/components/layout/PageShell'
import { LoadingSkeleton } from '@/components/shared/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Textarea } from '@/components/ui/input'
import { Dialog } from '@/components/ui/overlay'
import { useToast } from '@/components/ui/toast'
import { advanceOrder, getKitchenStats, listOrders } from '@/lib/data/api'
import { useAsync } from '@/lib/hooks'
import {
  DAY_NAMES,
  MEAL_LABEL,
  fmtClock,
  isActive,
  kitchenStatusAt,
  lastOrderMinute,
  minutesWaiting,
  ticketUrgency,
  toMinutes,
} from '@/lib/kitchen'
import { cn, fmtDate, money } from '@/lib/utils'

/**
 * The kitchen display: every live ticket, on one screen.
 *
 * This is a working surface, not a report. It is read across a hot kitchen from a
 * tablet propped by the pass, usually at a glance and often by somebody holding a
 * ladle, so it is built to three rules the rest of the console does not follow.
 *
 * The tokens are enormous, because the token is the only thing anyone reads from
 * three feet away. The buttons are full-width and thumb-sized, because a precise tap
 * is not available to the person using this. And a ticket nobody has accepted is a
 * red sticky note, pinned at the left of the rail and slightly askew — a kitchen
 * loses orders by not noticing them, and a tidy grey row in a tidy grey table is
 * exactly how that happens.
 *
 * It refreshes itself every ten seconds. A kitchen board that needs reloading is a
 * kitchen board that is wrong.
 */

const COLUMNS: {
  status: OrderStatus
  title: string
  blurb: string
  Icon: typeof BellRing
  /** The rule along the top of the column, so the three read apart at a glance. */
  accent: string
}[] = [
  {
    status: 'placed',
    title: 'New',
    blurb: 'Not yet picked up',
    Icon: BellRing,
    accent: 'bg-brand-500',
  },
  {
    status: 'preparing',
    title: 'Cooking',
    blurb: 'On the pass',
    Icon: ChefHat,
    accent: 'bg-saffron-500',
  },
  {
    status: 'ready',
    title: 'Ready',
    blurb: 'Waiting at the counter',
    Icon: UtensilsCrossed,
    accent: 'bg-leaf-500',
  },
]

export default function KitchenBoard() {
  const { toast } = useToast()
  const [now, setNow] = useState(() => new Date())
  const [cancelling, setCancelling] = useState<KitchenOrder | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const { data, loading, refresh } = useAsync(
    async () => Promise.all([listOrders(), getKitchenStats()]),
    [],
  )

  /* Both the clock and the rail. The clock drives lateness, which changes with no
     help from the server, and the rail picks up tickets placed on the devotee site
     while this screen has been sitting open on the counter. */
  useEffect(() => {
    const t = setInterval(() => {
      setNow(new Date())
      refresh()
    }, 10_000)
    return () => clearInterval(t)
  }, [refresh])

  const orders = useMemo(() => data?.[0] ?? [], [data])
  const stats = data?.[1]
  const service = useMemo(() => kitchenStatusAt(now), [now])

  const byStatus = (s: OrderStatus) =>
    orders.filter((o) => o.status === s).sort((a, b) => a.placedAt.localeCompare(b.placedAt))

  const advance = async (o: KitchenOrder, to: OrderStatus) => {
    await advanceOrder(o.id, to)
    const said: Record<string, string> = {
      preparing: `${o.token} started`,
      ready: `${o.token} is ready — call it out`,
      collected: `${o.token} collected`,
    }
    toast(said[to] ?? `${o.token} updated`)
    refresh()
  }

  const confirmCancel = async () => {
    if (!cancelling) return
    setBusy(true)
    await advanceOrder(cancelling.id, 'cancelled', reason)
    setBusy(false)
    toast(`${cancelling.token} cancelled`, {
      detail: 'The devotee sees the reason on their order.',
    })
    setCancelling(null)
    setReason('')
    refresh()
  }

  const newCount = stats?.newTickets ?? 0

  /** The devotee who has been waiting longest on anything not yet handed over. */
  const longestWait = useMemo(() => {
    const live = orders.filter((o) => isActive(o.status))
    if (live.length === 0) return null
    return Math.max(...live.map((o) => minutesWaiting(o.placedAt, now)))
  }, [orders, now])

  return (
    <PageShell
      eyebrow="Cafeteria"
      title="Kitchen board"
      description={
        service.current
          ? `${MEAL_LABEL[service.current.meal]} · serving until ${fmtClock(toMinutes(service.current.closes))} · online orders close ${fmtClock(lastOrderMinute(service.current))}`
          : service.next
            ? `Kitchen closed — next service ${DAY_NAMES[service.next.date.getDay()]} ${fmtClock(toMinutes(service.next.window.opens))}`
            : 'Kitchen closed'
      }
      actions={
        <>
          <span className="flex items-center gap-1.5 text-sm text-muted">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-leaf-500 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-leaf-500" />
            </span>
            Live · refreshed {fmtDate(now, 'h:mm:ss a')}
          </span>
          <Link to="/kitchen/menu" className="text-sm font-medium text-brand-600 hover:underline">
            Menu &amp; availability
          </Link>
        </>
      }
    >
      {/* The alert. Sticky to the top of the scroll area on purpose: a cook who has
          scrolled down the Ready column still has to know a new ticket landed. */}
      {newCount > 0 ? (
        <div className="sticky top-2 z-10 mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-lg)] border-2 border-brand-500 bg-brand-500 px-4 py-3 text-white shadow-[var(--shadow-lg)]">
          <BellRing className="size-5 shrink-0 animate-pulse" />
          <p className="min-w-0 flex-1 font-semibold">
            {newCount} new {newCount === 1 ? 'order' : 'orders'} waiting to be started
          </p>
        </div>
      ) : null}

      {/* What the columns underneath cannot say.
          This was four tiles reading New / Cooking / Ready / Taken — and the three
          column headings two inches below already carry the first three, so "2 new"
          appeared three times on one screen counting the alert bar. A kitchen board
          should spend its vertical space on tickets, so the duplicated counts are
          gone and what is left is the day's takings and the two numbers that need a
          person: anything running over, and the longest a devotee has been waiting. */}
      <div className="mb-4 flex flex-wrap items-stretch gap-3 rounded-[var(--radius-lg)] border border-line bg-card px-4 py-3 shadow-[var(--shadow-sm)]">
        <Metric label="Taken today" value={money(stats?.revenueToday ?? 0, true)} tone="leaf" />
        <Divider />
        <Metric label="Served today" value={String(stats?.collectedToday ?? 0)} />
        <Divider />
        <Metric
          label="Running late"
          value={String(stats?.late ?? 0)}
          tone={stats?.late ? 'brand' : undefined}
        />
        <Divider />
        <Metric
          label="Longest wait"
          value={longestWait === null ? '—' : `${longestWait}m`}
          tone={longestWait !== null && longestWait > 25 ? 'brand' : undefined}
        />
        <span className="ml-auto self-center text-sm text-muted">
          {service.current ? `${MEAL_LABEL[service.current.meal]} service` : 'Kitchen closed'}
        </span>
      </div>

      {loading ? (
        <LoadingSkeleton variant="tiles" rows={3} />
      ) : orders.length === 0 ? (
        <Card className="p-10 text-center">
          <UtensilsCrossed className="mx-auto size-8 text-faint" />
          <p className="mt-3 font-serif text-lg text-ink">Nothing on the rail</p>
          <p className="mt-1 text-base text-muted">
            {service.current
              ? 'No orders yet this service. They appear here the moment a devotee places one.'
              : 'The kitchen is closed, so the site is not taking orders.'}
          </p>
        </Card>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const tickets = byStatus(col.status)
            return (
              <section key={col.status} className="min-w-0">
                {/* The header is sticky so a cook scrolled deep into a busy Ready
                    column still knows which column they are looking at. */}
                <div className="sticky top-2 z-[5] mb-2.5 overflow-hidden rounded-[var(--radius-lg)] border border-line bg-card shadow-[var(--shadow-sm)]">
                  <div className={cn('h-1 w-full', col.accent)} />
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                    <col.Icon
                      className={cn(
                        'size-4 shrink-0',
                        col.status === 'placed'
                          ? 'text-brand-600'
                          : col.status === 'preparing'
                            ? 'text-saffron-600'
                            : 'text-leaf-600',
                      )}
                    />
                    <h2 className="font-serif text-lg leading-none text-ink">{col.title}</h2>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-sm font-bold tabular-nums',
                        col.status === 'placed' && tickets.length > 0
                          ? 'bg-brand-500 text-white'
                          : 'bg-tint text-muted',
                      )}
                    >
                      {tickets.length}
                    </span>
                    <p className="ml-auto hidden text-sm text-muted xl:block">{col.blurb}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {tickets.length === 0 ? (
                    <p className="rounded-[var(--radius-lg)] border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
                      Nothing here
                    </p>
                  ) : (
                    tickets.map((o) => (
                      <Ticket
                        key={o.id}
                        order={o}
                        now={now}
                        onAdvance={advance}
                        onCancel={() => setCancelling(o)}
                      />
                    ))
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <Dialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        title={`Cancel order ${cancelling?.token ?? ''}?`}
        description="The devotee is told immediately, and is shown the reason you give here."
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelling(null)}>
              Keep the order
            </Button>
            <Button onClick={confirmCancel} disabled={busy}>
              {busy ? 'Cancelling…' : 'Cancel order'}
            </Button>
          </>
        }
      >
        <Field label="Reason" hint="shown to the devotee, so make it a real one">
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="We have run out of dosa batter for this service — sorry."
          />
        </Field>
        {cancelling?.paymentMethod === 'card' ? (
          <p className="mt-3 text-base text-muted">
            This order was paid by card. Refund it at the counter — the app does not process
            refunds.
          </p>
        ) : null}
      </Dialog>
    </PageShell>
  )
}

/* ------------------------------------------------------------------ ticket */

/**
 * One order, as a sticky note.
 *
 * Red while nobody has accepted it. That is the whole design: the single failure a
 * kitchen display exists to prevent is a ticket sitting unseen, and every other
 * state on this board is deliberately quieter so that one stays loud.
 */
/**
 * One order on the rail.
 *
 * It used to be rotated a fraction of a degree each, to read as a pinned sticky
 * note. On screen that is not what it read as: half a degree is below the threshold
 * where the eye calls something deliberate, so a column of them looked like six
 * cards whose borders had failed to line up. The red fill already does the work the
 * tilt was there for.
 */
function Ticket({
  order,
  now,
  onAdvance,
  onCancel,
}: {
  order: KitchenOrder
  now: Date
  onAdvance: (o: KitchenOrder, to: OrderStatus) => void
  onCancel: () => void
}) {
  const urgency = ticketUrgency(order.status, order.placedAt, order.promisedMinutes, now)
  const waited = minutesWaiting(order.placedAt, now)
  const isNew = urgency === 'new'
  const late = urgency === 'late'
  const portions = order.lines.reduce((n, l) => n + l.qty, 0)

  /* Order matters here. A ready ticket is green even when it has run over its
     estimate: the food is cooked, and painting it the same amber as a dish still
     on the heat put an alarming card in the middle of a green column and made the
     one colour that should mean "act now" mean two different things. Lateness on a
     ready ticket is still reported — by the clock, which is where it belongs. */
  const skin = isNew
    ? 'border-brand-600 bg-brand-500 text-white shadow-[var(--shadow-lg)]'
    : order.status === 'ready'
      ? 'border-leaf-500/50 bg-leaf-500/[0.09] text-ink shadow-[var(--shadow-sm)]'
      : late
        ? 'border-saffron-500 bg-saffron-100 text-ink shadow-[var(--shadow)]'
        : 'border-line bg-card text-ink shadow-[var(--shadow-sm)]'

  const dim = isNew ? 'text-white/80' : 'text-muted'
  const rule = isNew ? 'border-white/25' : 'border-line'

  return (
    <article
      className={cn(
        'rounded-[var(--radius-lg)] border-2 transition-shadow hover:shadow-[var(--shadow-lg)]',
        skin,
      )}
    >
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-serif text-[36px] leading-none tabular-nums">{order.token}</p>
            <p className={cn('mt-1 truncate text-sm', dim)}>
              {order.contactName} · {portions} item{portions === 1 ? '' : 's'}
            </p>
          </div>
          <TicketClock
            waited={waited}
            promised={order.promisedMinutes}
            tone={isNew ? 'onNew' : late ? 'late' : 'normal'}
          />
        </div>

        {/* The list is the instruction. Quantities are set in a fixed column so a
            cook reads down the numbers rather than hunting for them in prose. */}
        <ul className={cn('mt-3 space-y-1.5 border-t pt-3', rule)}>
          {order.lines.map((l) => (
            <li key={l.itemId} className="flex items-baseline gap-2.5 text-[15px] leading-snug">
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-[6px] text-[13px] font-bold tabular-nums',
                  isNew ? 'bg-white/20' : 'bg-tint text-brand-700',
                )}
              >
                {l.qty}
              </span>
              <span className="min-w-0 flex-1 font-medium">{l.name}</span>
            </li>
          ))}
        </ul>

        {/* A note is an instruction to the cook, so it is boxed rather than appended. */}
        {order.note ? (
          <p
            className={cn(
              'mt-2.5 flex items-start gap-1.5 rounded-[var(--radius)] px-2.5 py-1.5 text-sm font-medium',
              isNew ? 'bg-white/15' : 'bg-saffron-400/25 text-brand-700',
            )}
          >
            <MessageSquare className="mt-0.5 size-3.5 shrink-0" />
            <span>{order.note}</span>
          </p>
        ) : null}

        <div
          className={cn(
            'mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 text-sm',
            rule,
          )}
        >
          <span className={cn('inline-flex items-center gap-1.5', dim)}>
            <Phone className="size-3.5" />
            {order.contactPhone}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-sm font-medium tabular-nums',
              order.paymentMethod === 'cash-at-counter'
                ? isNew
                  ? 'bg-white/20'
                  : 'bg-saffron-400/25 text-brand-700'
                : isNew
                  ? 'bg-white/15 text-white/85'
                  : 'bg-leaf-500/12 text-leaf-600',
            )}
            /* The one thing the counter must not get wrong. An unpaid ticket handed
               over as paid is money gone, so it is a badge and not a footnote. */
            title={order.paymentMethod === 'cash-at-counter' ? 'Collect payment' : 'Already paid'}
          >
            {order.paymentMethod === 'cash-at-counter' ? (
              <>
                <Wallet className="size-3.5" />
                COLLECT {money(order.total, true)}
              </>
            ) : (
              <>
                <Check className="size-3.5" />
                Paid {money(order.total, true)}
              </>
            )}
          </span>
        </div>
      </div>

      <div className={cn('flex gap-2 border-t p-3', rule)}>
        {order.status === 'placed' ? (
          <>
            <button
              type="button"
              onClick={() => onAdvance(order, 'preparing')}
              className="flex-1 rounded-[var(--radius)] bg-white px-3 py-3 text-base font-bold text-brand-700 transition-colors hover:bg-white/90 active:scale-[.99]"
            >
              Start cooking
            </button>
            <button
              type="button"
              onClick={onCancel}
              aria-label={`Cancel order ${order.token}`}
              className="grid size-11 shrink-0 place-items-center rounded-[var(--radius)] border border-white/40 text-white transition-colors hover:bg-white/15"
            >
              <X className="size-4" />
            </button>
          </>
        ) : order.status === 'preparing' ? (
          <>
            <button
              type="button"
              onClick={() => onAdvance(order, 'ready')}
              className="flex-1 rounded-[var(--radius)] bg-leaf-500 px-3 py-3 text-base font-bold text-white transition-colors hover:bg-leaf-600 active:scale-[.99]"
            >
              Mark ready
            </button>
            <button
              type="button"
              onClick={onCancel}
              aria-label={`Cancel order ${order.token}`}
              className="grid size-11 shrink-0 place-items-center rounded-[var(--radius)] border border-line text-muted transition-colors hover:border-brand-300 hover:text-brand-600"
            >
              <X className="size-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onAdvance(order, 'collected')}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius)] border-2 border-leaf-500 px-3 py-3 text-base font-bold text-leaf-600 transition-colors hover:bg-leaf-500 hover:text-white active:scale-[.99]"
          >
            <Check className="size-4" />
            Handed over
          </button>
        )}
      </div>
    </article>
  )
}

/** One figure in the summary strip. */
function Metric({ label, value, tone }: { label: string; value: string; tone?: 'leaf' | 'brand' }) {
  return (
    <div className="min-w-0">
      <p className="eyebrow">{label}</p>
      <p
        className={cn(
          'mt-0.5 text-xl leading-none tabular-nums',
          tone === 'leaf' ? 'text-leaf-600' : tone === 'brand' ? 'text-brand-600' : 'text-ink',
        )}
      >
        {value}
      </p>
    </div>
  )
}

const Divider = () => <span aria-hidden className="w-px self-stretch bg-line" />

/**
 * Minutes waited, against minutes promised.
 *
 * A number alone makes a cook do the comparison; the ring does it for them. It fills
 * as the ticket approaches what the kitchen quoted and turns over when it passes —
 * so "how is this one doing" is answered by a shape from across the kitchen, before
 * anybody is close enough to read the figures.
 */
function TicketClock({
  waited,
  promised,
  tone,
}: {
  waited: number
  promised: number
  tone: 'onNew' | 'late' | 'normal'
}) {
  const pct = promised > 0 ? Math.min(100, (waited / promised) * 100) : 0
  const track =
    tone === 'onNew' ? 'rgba(255,255,255,0.25)' : tone === 'late' ? '#f8c95f' : '#ece2d2'
  const fill = tone === 'onNew' ? '#ffffff' : tone === 'late' ? '#9c1f16' : '#2c6b50'

  return (
    <div className="shrink-0 text-right">
      <div
        className="relative grid size-12 place-items-center rounded-full"
        style={{ background: `conic-gradient(${fill} ${pct * 3.6}deg, ${track} 0deg)` }}
        role="img"
        aria-label={`${waited} minutes waited of ${promised} promised`}
      >
        <span
          className={cn(
            'grid size-9 place-items-center rounded-full text-[13px] font-bold tabular-nums',
            tone === 'onNew' ? 'bg-brand-500 text-white' : 'bg-card text-ink',
          )}
        >
          {waited}m
        </span>
      </div>
      <p
        className={cn(
          'mt-1 inline-flex items-center gap-0.5 text-xs',
          tone === 'late'
            ? 'font-semibold text-brand-600'
            : tone === 'onNew'
              ? 'text-white/75'
              : 'text-muted',
        )}
      >
        {tone === 'late' ? <TriangleAlert className="size-3" /> : null}
        {tone === 'late' ? `+${waited - promised}m over` : `of ${promised}m`}
      </p>
    </div>
  )
}
