import { useMemo, useState } from 'react'
import {
  BadgeDollarSign,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  TriangleAlert,
  Users,
  X,
} from 'lucide-react'
import type { FacilityBooking, FacilityVenue, User } from '@/lib/data/types'
import { PageShell } from '@/components/layout/PageShell'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { StatTile } from '@/components/shared/StatTile'
import { StatusPill } from '@/components/shared/badges'
import { EmptyState, LoadingSkeleton } from '@/components/shared/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Textarea } from '@/components/ui/input'
import { Sheet } from '@/components/ui/overlay'
import { Chips, Tabs } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import {
  FacilityUnavailableError,
  listDevotees,
  listFacilityBookings,
  listVenues,
  recordFacilityDeposit,
  setFacilityBookingStatus,
} from '@/lib/data/api'
import { FACILITY_SLOTS } from '@/lib/data/mock'
import {
  dayKey,
  eventTypeLabel,
  monthAvailability,
  slotHint,
  slotLabel,
  summariseFacility,
} from '@/lib/facility'
import { useAsync } from '@/lib/hooks'
import { cn, fmtDate, money } from '@/lib/utils'

interface Row {
  booking: FacilityBooking
  user?: User
  venue?: FacilityVenue
}

const FILTERS = [
  { key: 'pending', label: 'Awaiting decision' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'declined', label: 'Declined' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
]

const TABS = [
  { key: 'queue', label: 'Requests' },
  { key: 'calendar', label: 'Hall calendar' },
]

export default function FacilityAdmin() {
  const { toast } = useToast()
  const [tab, setTab] = useState('queue')
  const [filter, setFilter] = useState('pending')
  const [detail, setDetail] = useState<Row | null>(null)
  const [reason, setReason] = useState('')

  const { data, loading, refresh } = useAsync(
    async () => Promise.all([listFacilityBookings(), listDevotees(), listVenues(true)]),
    [],
  )

  const [bookings, devotees, venues] = data ?? [[], [], []]
  const now = useMemo(() => new Date(), [])

  const rows = useMemo<Row[]>(() => {
    const byId = new Map(devotees.map((d) => [d.id, d]))
    const byVenue = new Map(venues.map((v) => [v.id, v]))
    return bookings
      .filter((b) => (filter === 'all' ? true : b.status === filter))
      .map((booking) => ({
        booking,
        user: byId.get(booking.userId),
        venue: byVenue.get(booking.venueId),
      }))
  }, [bookings, devotees, venues, filter])

  const stats = useMemo(() => summariseFacility(bookings, now), [bookings, now])

  /**
   * A pending request whose slot is already confirmed for somebody else.
   *
   * Two families can both ask for the same Saturday — nothing stops them, and
   * nothing should. What must not happen is the office confirming the second one
   * without being told, so the clash is surfaced on the row and again in the sheet.
   */
  const clashingIds = useMemo(() => {
    const confirmed = bookings.filter((b) => b.status === 'confirmed')
    const ids = new Set<string>()
    for (const b of bookings) {
      if (b.status !== 'pending') continue
      const clash = confirmed.find(
        (c) =>
          c.venueId === b.venueId &&
          dayKey(c.date) === dayKey(b.date) &&
          (c.slot === b.slot || c.slot === 'full-day' || b.slot === 'full-day'),
      )
      if (clash) ids.add(b.id)
    }
    return ids
  }, [bookings])

  const act = async (
    booking: FacilityBooking,
    status: FacilityBooking['status'],
    label: string,
  ) => {
    try {
      await setFacilityBookingStatus(booking.id, status, {
        declineReason: status === 'declined' ? reason.trim() || undefined : undefined,
      })
      toast(label, { detail: `${booking.reference} · ${fmtDate(booking.date, 'EEE, MMM d')}` })
      setDetail(null)
      setReason('')
      refresh()
    } catch (e) {
      toast(
        e instanceof FacilityUnavailableError ? 'Cannot confirm' : 'Something went wrong',
        { detail: e instanceof Error ? e.message : undefined },
      )
    }
  }

  const takeDeposit = async (booking: FacilityBooking) => {
    await recordFacilityDeposit(booking.id)
    toast('Deposit recorded', { detail: `${money(booking.deposit)} held against ${booking.reference}` })
    setDetail(null)
    refresh()
  }

  const columns: Column<Row>[] = [
    {
      key: 'date',
      header: 'Date & slot',
      sortValue: (r) => r.booking.date,
      cell: (r) => (
        <div className="min-w-0">
          <p className="whitespace-nowrap font-medium">{fmtDate(r.booking.date, 'EEE, MMM d')}</p>
          <p className="whitespace-nowrap text-sm text-muted">{slotHint(r.booking.slot)}</p>
        </div>
      ),
    },
    {
      key: 'venue',
      header: 'Venue',
      sortValue: (r) => r.venue?.name ?? '',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate">{r.venue?.name ?? '—'}</p>
          <p className="truncate text-sm text-muted">{eventTypeLabel(r.booking.eventType)}</p>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Devotee',
      sortValue: (r) => r.user?.name ?? '',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate">{r.user?.name ?? 'Unknown'}</p>
          <p className="truncate text-sm text-muted">{r.booking.contactPhone}</p>
        </div>
      ),
    },
    {
      key: 'guests',
      header: 'Guests',
      align: 'right',
      sortValue: (r) => r.booking.expectedGuests,
      cell: (r) => (
        <span
          className={cn(
            'tabular-nums',
            r.venue && r.booking.expectedGuests > r.venue.capacity && 'font-semibold text-brand-600',
          )}
          title={
            r.venue && r.booking.expectedGuests > r.venue.capacity
              ? `Over the ${r.venue.capacity}-seat capacity`
              : undefined
          }
        >
          {r.booking.expectedGuests}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Hire total',
      sortValue: (r) => r.booking.total,
      align: 'right',
      cell: (r) => <span className="font-medium tabular-nums">{money(r.booking.total)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.booking.status,
      cell: (r) => (
        <div className="flex items-center gap-1.5">
          <StatusPill status={r.booking.status} />
          {clashingIds.has(r.booking.id) ? (
            <span title="Another booking already holds this slot">
              <TriangleAlert className="size-4 text-brand-600" />
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'ref',
      header: 'Reference',
      sortValue: (r) => r.booking.reference,
      cell: (r) => <span className="text-sm tabular-nums text-muted">{r.booking.reference}</span>,
    },
  ]

  return (
    <PageShell
      eyebrow="Programme"
      title="Hall bookings"
      description="Kalyana Mandapam, mini hall, dining hall and the open-air mandapam."
      tabs={<Tabs items={TABS} value={tab} onChange={setTab} />}
      toolbar={tab === 'queue' ? <Chips items={FILTERS} value={filter} onChange={setFilter} /> : undefined}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Awaiting decision"
          value={stats.pending}
          sub={
            stats.oldestPending
              ? `Oldest asked ${fmtDate(stats.oldestPending, 'MMM d')}`
              : 'Queue is clear'
          }
          tone="brand"
        />
        <StatTile label="Confirmed ahead" value={stats.upcoming} sub="Dates still to come" tone="leaf" />
        <StatTile label="Hire booked" value={money(stats.bookedRevenue)} sub="Confirmed, deposits excluded" tone="gold" />
        <StatTile label="Deposits held" value={money(stats.depositsHeld)} sub="Refundable on the day" />
      </div>

      {loading ? (
        <LoadingSkeleton variant="table" rows={6} />
      ) : tab === 'queue' ? (
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.booking.id}
          onRowClick={(r) => {
            setDetail(r)
            setReason('')
          }}
          initialSort={{ key: 'date', dir: 'asc' }}
          empty={{
            title: 'Nothing in this queue',
            detail:
              filter === 'pending'
                ? 'Every request has been decided.'
                : 'Try another status filter.',
          }}
        />
      ) : (
        <VenueCalendar venues={venues} bookings={bookings} now={now} />
      )}

      <Sheet
        open={detail != null}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.venue?.name ?? 'Venue'} · ${fmtDate(detail.booking.date, 'EEE, MMM d')}` : ''}
        description={
          detail
            ? `${detail.booking.reference} · ${eventTypeLabel(detail.booking.eventType)} · ${slotLabel(detail.booking.slot)}`
            : ''
        }
        footer={
          detail ? (
            detail.booking.status === 'pending' ? (
              <>
                <Button variant="outline" onClick={() => act(detail.booking, 'declined', 'Request declined')}>
                  <X />
                  Decline
                </Button>
                <Button onClick={() => act(detail.booking, 'confirmed', 'Booking confirmed')}>
                  <Check />
                  Confirm booking
                </Button>
              </>
            ) : detail.booking.status === 'confirmed' ? (
              <>
                <Button variant="outline" onClick={() => act(detail.booking, 'cancelled', 'Booking cancelled')}>
                  <X />
                  Cancel booking
                </Button>
                {detail.booking.depositPaidAt ? (
                  <Button onClick={() => act(detail.booking, 'completed', 'Marked completed')}>
                    <Check />
                    Mark completed
                  </Button>
                ) : (
                  <Button onClick={() => takeDeposit(detail.booking)}>
                    <BadgeDollarSign />
                    Record deposit
                  </Button>
                )}
              </>
            ) : null
          ) : null
        }
      >
        {detail ? <BookingDetail row={detail} reason={reason} onReason={setReason} clashing={clashingIds.has(detail.booking.id)} /> : null}
      </Sheet>
    </PageShell>
  )
}

/* --------------------------------------------------------------- the sheet */

function BookingDetail({
  row,
  reason,
  onReason,
  clashing,
}: {
  row: Row
  reason: string
  onReason: (v: string) => void
  clashing: boolean
}) {
  const { booking, user, venue } = row
  const overCapacity = venue != null && booking.expectedGuests > venue.capacity

  return (
    <div className="space-y-5">
      {clashing ? (
        <div className="flex items-start gap-2.5 rounded-[var(--radius-lg)] border border-brand-500/30 bg-brand-500/[0.06] p-3">
          <TriangleAlert className="mt-px size-4 shrink-0 text-brand-600" />
          <p className="text-sm text-ink-soft">
            Another booking already holds this slot. Confirming this one will be refused — decline
            it, or cancel the other first.
          </p>
        </div>
      ) : null}

      <dl className="divide-y divide-line text-base">
        {(
          [
            ['Devotee', user?.name ?? '—'],
            ['Phone', booking.contactPhone],
            ['Email', user?.email ?? '—'],
            ['Venue', venue?.name ?? '—'],
            ['Slot', `${slotLabel(booking.slot)} · ${slotHint(booking.slot)}`],
            ['Occasion', eventTypeLabel(booking.eventType)],
            [
              'Expected guests',
              `${booking.expectedGuests}${overCapacity ? ` — over the ${venue?.capacity}-seat capacity` : ''}`,
            ],
            ['Requested', fmtDate(booking.createdAt, 'MMM d, yyyy')],
          ] as [string, string][]
        ).map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="shrink-0 text-muted">{k}</dt>
            <dd className={cn('text-right font-medium', k === 'Expected guests' && overCapacity && 'text-brand-600')}>
              {v}
            </dd>
          </div>
        ))}
      </dl>

      {booking.notes ? (
        <div>
          <p className="eyebrow mb-2">Note from the devotee</p>
          <p className="rounded-[var(--radius-lg)] border border-line bg-tint/50 p-3 text-base leading-relaxed">
            {booking.notes}
          </p>
        </div>
      ) : null}

      <div>
        <p className="eyebrow mb-2">Charges</p>
        <dl className="divide-y divide-line rounded-[var(--radius-lg)] border border-line">
          <Line label={`${slotLabel(booking.slot)} hire`} value={money(booking.hireCharge)} />
          {booking.items.map((it) => (
            <Line key={it.label} label={`${it.label} × ${it.qty}`} value={money(it.qty * it.price)} />
          ))}
          {booking.discountPct > 0 ? (
            <Line
              label={`Member discount (${booking.discountPct}%)`}
              value={`−${money(booking.hireCharge + booking.addOnsTotal - booking.total)}`}
            />
          ) : null}
          <Line label="Total" value={money(booking.total)} strong />
          <Line
            label="Refundable deposit"
            value={
              booking.depositPaidAt
                ? `${money(booking.deposit)} · received ${fmtDate(booking.depositPaidAt, 'MMM d')}`
                : `${money(booking.deposit)} · not yet received`
            }
          />
        </dl>
      </div>

      {booking.status === 'declined' && booking.declineReason ? (
        <div>
          <p className="eyebrow mb-2">Reason given</p>
          <p className="text-base text-muted">{booking.declineReason}</p>
        </div>
      ) : null}

      {booking.status === 'pending' ? (
        <Field
          label="Reason, if declining"
          htmlFor="fac-reason"
          hint="Shown to the devotee with the decision."
        >
          <Textarea
            id="fac-reason"
            rows={2}
            value={reason}
            onChange={(e) => onReason(e.target.value)}
            placeholder="The hall is held for Brahmotsavam that weekend."
          />
        </Field>
      ) : null}
    </div>
  )
}

const Line = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className="flex items-baseline justify-between gap-4 p-3">
    <dt className={cn('min-w-0 text-base', strong ? 'font-medium text-ink' : 'text-muted')}>{label}</dt>
    <dd className={cn('shrink-0 tabular-nums', strong ? 'font-bold text-lg' : 'font-medium')}>{value}</dd>
  </div>
)

/* ----------------------------------------------------------- the calendar */

/**
 * One venue's month, as the office reads it: which days are gone, which have a half
 * left, and who holds them. Drawn from the same `monthAvailability` the devotee's
 * date picker uses, so the two cannot disagree about a Saturday.
 */
function VenueCalendar({
  venues,
  bookings,
  now,
}: {
  venues: FacilityVenue[]
  bookings: FacilityBooking[]
  now: Date
}) {
  const [venueId, setVenueId] = useState(venues[0]?.id ?? '')
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1))

  const venue = venues.find((v) => v.id === venueId) ?? venues[0]
  if (!venue) return <EmptyState Icon={Building2} title="No venues" detail="Nothing is let out yet." />

  // The office can let a hall inside its notice window; only the past is closed to
  // it. The devotee's picker is the surface that enforces notice.
  const days = monthAvailability({
    venue,
    year: cursor.getFullYear(),
    month: cursor.getMonth(),
    bookings,
    now,
    respectNotice: false,
  })
  // Monday-first, as the temple office's wall planner is.
  const lead = (new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay() + 6) % 7

  return (
    <div className="space-y-4">
      <Chips
        items={venues.map((v) => ({ key: v.id, label: v.name }))}
        value={venue.id}
        onChange={setVenueId}
      />

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-lg text-ink">
              {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </h3>
            <p className="mt-0.5 text-sm text-muted">
              Seats {venue.capacity} · {venue.minNoticeDays} days’ notice · deposit{' '}
              {money(venue.deposit)}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="pb-1 text-center text-2xs font-semibold uppercase tracking-[0.07em] text-faint">
              {d}
            </div>
          ))}
          {Array.from({ length: lead }, (_, i) => <div key={`lead-${i}`} />)}
          {days.map((d) => {
            const held = bookings.filter(
              (b) =>
                b.venueId === venue.id &&
                dayKey(b.date) === d.day &&
                (b.status === 'pending' || b.status === 'confirmed' || b.status === 'completed'),
            )
            return (
              <div
                key={d.day}
                className={cn(
                  'min-h-[74px] rounded-[var(--radius)] border p-1.5',
                  d.summary === 'closed' && 'border-dashed border-line bg-bg/60',
                  d.summary === 'open' && 'border-line bg-card',
                  d.summary === 'partial' && 'border-saffron-500/35 bg-saffron-500/[0.07]',
                  d.summary === 'full' && 'border-brand-500/30 bg-brand-500/[0.06]',
                )}
              >
                <div className="flex items-baseline justify-between">
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums',
                      d.summary === 'closed' ? 'text-faint' : 'text-ink',
                    )}
                  >
                    {d.date.getDate()}
                  </span>
                  {held.length > 1 ? (
                    <span className="text-2xs font-semibold text-muted">{held.length}</span>
                  ) : null}
                </div>
                <div className="mt-1 space-y-0.5">
                  {held.slice(0, 2).map((b) => (
                    <p
                      key={b.id}
                      title={`${b.reference} · ${slotLabel(b.slot)} · ${eventTypeLabel(b.eventType)}`}
                      className={cn(
                        'truncate rounded-[3px] px-1 py-px text-2xs font-medium',
                        b.status === 'pending'
                          ? 'bg-saffron-500/20 text-saffron-600'
                          : 'bg-brand-500/15 text-brand-600',
                      )}
                    >
                      {slotLabel(b.slot)} · {eventTypeLabel(b.eventType)}
                    </p>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3">
          {[
            ['bg-card border border-line', 'Free'],
            ['bg-saffron-500/[0.3]', 'One slot left'],
            ['bg-brand-500/25', 'Fully booked'],
            ['bg-bg border border-dashed border-line', 'Past'],
          ].map(([cls, label]) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-muted">
              <span className={cn('size-3 rounded-[3px]', cls)} />
              {label}
            </span>
          ))}
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <p className="eyebrow mb-2">Slot rates — {venue.name}</p>
        <div className="flex flex-wrap gap-2">
          {FACILITY_SLOTS.map((s) => (
            <Badge key={s.key} variant="outline" className="gap-1.5 px-2.5 py-1">
              <Users className="size-3.5" />
              {s.label} · {s.hint} · {money(venue.rates[s.key])}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  )
}
