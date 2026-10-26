import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BanknoteArrowDown,
  CalendarCheck2,
  Download,
  Send,
  SkipForward,
  TriangleAlert,
  XCircle,
} from 'lucide-react'
import type { Donation, Pledge, PledgeInstallment, User } from '@/lib/data/types'
import { PageShell } from '@/components/layout/PageShell'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { PledgeSchedule } from '@/components/shared/PledgeSchedule'
import { StatTile } from '@/components/shared/StatTile'
import { StatusPill } from '@/components/shared/badges'
import { LoadingSkeleton } from '@/components/shared/states'
import { Toolbar, ToolbarSelect } from '@/components/admin/Toolbar'
import { Badge, Progress } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Select, Textarea } from '@/components/ui/input'
import { Dialog, Sheet } from '@/components/ui/overlay'
import { useToast } from '@/components/ui/toast'
import {
  listDevotees,
  listPledges,
  settlePledgeInstallment,
  skipPledgeInstallment,
  writeOffPledge,
} from '@/lib/data/api'
import { DONATION_CATEGORIES } from '@/lib/data/mock'
import { useAsync } from '@/lib/hooks'
import { describePlan, nextDue, pledgeTotals } from '@/lib/pledge'
import { downloadCSV, fmtDate, money, titleCase } from '@/lib/utils'

/**
 * The pledge register — money the temple has been promised and has not yet received.
 *
 * It lives under Money rather than beside the devotee records because the question it
 * answers is a finance question: what is still owed, what is late, and what should the
 * office expect in next month's post. The ledger next door answers the opposite one —
 * what actually arrived — and the two are deliberately never summed. A pledge is not
 * income, carries no tax receipt, and does not appear in the collected figure the
 * transparency screen publishes; it becomes all three the moment an instalment is
 * recorded here, which mints a real donation and routes it into that ledger.
 *
 * The one consequential action on the page is therefore "Record payment". Most pledges
 * arrive as a cheque in the post or a transfer spotted on a statement, so if the
 * console cannot book one the register goes stale within a fortnight and stops being
 * worth opening.
 */

interface Row {
  pledge: Pledge
  donor?: User
  donorName: string
  totals: ReturnType<typeof pledgeTotals>
  next?: PledgeInstallment
}

const STATUSES: Pledge['status'][] = [
  'scheduled',
  'partially-fulfilled',
  'fulfilled',
  'lapsed',
  'cancelled',
]

const METHODS: Donation['paymentMethod'][] = ['card', 'ach', 'zelle', 'check', 'cash']

export default function Pledges() {
  const { toast } = useToast()
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [due, setDue] = useState('')
  const [open, setOpen] = useState<Row | null>(null)
  const [settling, setSettling] = useState<PledgeInstallment | null>(null)
  const [method, setMethod] = useState<Donation['paymentMethod']>('check')
  const [writeOff, setWriteOff] = useState<Row | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const { data, loading, refresh } = useAsync(
    async () => Promise.all([listPledges(), listDevotees()]),
    [],
  )

  const allRows = useMemo<Row[]>(() => {
    if (!data) return []
    const [pledges, devotees] = data
    const byId = new Map(devotees.map((d) => [d.id, d]))
    return pledges.map((pledge) => {
      const donor = pledge.userId ? byId.get(pledge.userId) : undefined
      return {
        pledge,
        donor,
        // A guest who pledged gave their name at the gate. Printing "Anonymous" over
        // somebody who told the temple exactly who they are makes the register harder
        // to chase from, not more discreet.
        donorName:
          donor?.name ??
          (pledge.donor ? `${pledge.donor.firstName} ${pledge.donor.lastName}` : 'Anonymous'),
        totals: pledgeTotals(pledge),
        next: nextDue(pledge),
      }
    })
  }, [data])

  const rows = useMemo(() => {
    const horizon = Date.now() + 30 * 86400000
    return allRows
      .filter((r) => (status ? r.pledge.status === status : true))
      .filter((r) => (category ? r.pledge.category === category : true))
      .filter((r) => {
        if (due === 'overdue') return r.totals.overdueCount > 0
        if (due === 'soon')
          return (
            !!r.next && new Date(r.next.dueDate).getTime() <= horizon && r.totals.outstanding > 0
          )
        if (due === 'outstanding') return r.totals.outstanding > 0
        return true
      })
  }, [allRows, status, category, due])

  /* Totals follow the filters, so the tiles always describe the list underneath them
     rather than a wider set the reader cannot see. */
  const visible = rows.filter((r) => r.pledge.status !== 'cancelled')
  const outstanding = visible.reduce((s, r) => s + r.totals.outstanding, 0)
  const overdue = visible.reduce((s, r) => s + r.totals.overdueAmount, 0)
  const overdueCount = visible.reduce((s, r) => s + r.totals.overdueCount, 0)
  // Over every filtered row, cancelled included: money that arrived before a pledge
  // was written off is still money the temple received.
  const received = rows.reduce((s, r) => s + r.totals.received, 0)

  const recordPayment = async () => {
    if (!open || !settling) return
    setBusy(true)
    const result = await settlePledgeInstallment(open.pledge.id, settling.id, { method })
    setBusy(false)
    setSettling(null)
    if (!result) return
    toast(`${money(result.donation.amount)} recorded against ${open.pledge.id}`, {
      detail: `Booked to the ledger as ${result.donation.id} — a tax receipt can now be issued.`,
    })
    setOpen(null)
    refresh()
  }

  const skip = async (installment: PledgeInstallment) => {
    if (!open) return
    await skipPledgeInstallment(open.pledge.id, installment.id)
    toast('Instalment marked as skipped', {
      detail: 'It drops out of the overdue count; the rest of the pledge stands.',
    })
    setOpen(null)
    refresh()
  }

  const confirmWriteOff = async () => {
    if (!writeOff) return
    setBusy(true)
    await writeOffPledge(writeOff.pledge.id, reason)
    setBusy(false)
    setWriteOff(null)
    setReason('')
    toast('Pledge written off', {
      detail: 'Payments already received stay in the ledger as gifts.',
    })
    refresh()
  }

  const columns: Column<Row>[] = [
    {
      key: 'donor',
      header: 'Donor',
      sortValue: (r) => r.donorName,
      cell: (r) =>
        r.donor ? (
          <Link
            to={`/devotees/${r.donor.id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-ink hover:text-brand-600 hover:underline"
          >
            {r.donorName}
          </Link>
        ) : (
          <span className="font-medium text-ink">{r.donorName}</span>
        ),
    },
    {
      key: 'fund',
      header: 'Fund',
      sortValue: (r) => r.pledge.category,
      cell: (r) => (
        <div className="min-w-0">
          <span>{titleCase(r.pledge.category)}</span>
          <p className="max-w-[30ch] truncate text-sm text-muted">
            {describePlan(
              {
                amount: r.pledge.amount,
                cadence: r.pledge.cadence,
                count: r.pledge.installments.length,
              },
              money,
            )}
          </p>
        </div>
      ),
    },
    {
      key: 'next',
      header: 'Next due',
      sortValue: (r) => r.next?.dueDate ?? '9999',
      cell: (r) =>
        r.next ? (
          <span className="whitespace-nowrap">
            <span className={r.totals.overdueCount > 0 ? 'font-medium text-brand-600' : ''}>
              {fmtDate(r.next.dueDate)}
            </span>
            {r.totals.overdueCount > 0 ? (
              <Badge variant="brand" className="ml-2">
                {r.totals.overdueCount} overdue
              </Badge>
            ) : null}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: 'progress',
      header: 'Received',
      sortValue: (r) => (r.totals.pledged > 0 ? r.totals.received / r.totals.pledged : 0),
      cell: (r) => (
        <div className="min-w-[140px]">
          <Progress
            value={r.totals.pledged > 0 ? (r.totals.received / r.totals.pledged) * 100 : 0}
            tone={r.pledge.status === 'fulfilled' ? 'leaf' : 'brand'}
            label={`${money(r.totals.received)} of ${money(r.totals.pledged)} received`}
          />
          <p className="mt-1 text-sm tabular-nums text-muted">
            {money(r.totals.received)} of {money(r.totals.pledged)}
          </p>
        </div>
      ),
    },
    {
      key: 'outstanding',
      header: 'Outstanding',
      sortValue: (r) => r.totals.outstanding,
      align: 'right',
      cell: (r) => <span className="font-medium tabular-nums">{money(r.totals.outstanding)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.pledge.status,
      align: 'center',
      cell: (r) => <StatusPill status={r.pledge.status} />,
    },
  ]

  const exportCSV = () =>
    downloadCSV(
      'meenakshi-pledges.csv',
      rows.map((r) => ({
        Id: r.pledge.id,
        Donor: r.donorName,
        Fund: titleCase(r.pledge.category),
        Cadence: r.pledge.cadence,
        PerPayment: r.pledge.amount,
        Payments: r.pledge.installments.length,
        Pledged: r.totals.pledged,
        Received: r.totals.received,
        Outstanding: r.totals.outstanding,
        Overdue: r.totals.overdueAmount,
        NextDue: r.next ? fmtDate(r.next.dueDate, 'yyyy-MM-dd') : '',
        IntendedMethod: r.pledge.intendedMethod,
        Status: r.pledge.status,
        PledgedOn: fmtDate(r.pledge.createdAt, 'yyyy-MM-dd'),
        Note: r.pledge.note ?? '',
      })),
    )

  const toolbar = (
    <Toolbar
      activeCount={[status, category, due].filter(Boolean).length}
      onClear={() => {
        setStatus('')
        setCategory('')
        setDue('')
      }}
    >
      <ToolbarSelect
        value={due}
        onChange={(e) => setDue(e.target.value)}
        aria-label="Filter by what is due"
      >
        <option value="">Everything</option>
        <option value="overdue">Overdue</option>
        <option value="soon">Due in 30 days</option>
        <option value="outstanding">Anything outstanding</option>
      </ToolbarSelect>
      <ToolbarSelect
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        aria-label="Filter by status"
      >
        <option value="">Any status</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {titleCase(s)}
          </option>
        ))}
      </ToolbarSelect>
      <ToolbarSelect
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        aria-label="Filter by fund"
      >
        <option value="">All funds</option>
        {DONATION_CATEGORIES.map((c) => (
          <option key={c.key} value={c.key}>
            {c.label}
          </option>
        ))}
      </ToolbarSelect>
    </Toolbar>
  )

  return (
    <PageShell
      toolbar={toolbar}
      eyebrow="Money"
      title="Pledge register"
      description={`${rows.length} pledges · ${money(outstanding)} promised and not yet received`}
      actions={
        <Button variant="ghost" size="sm" onClick={exportCSV} disabled={rows.length === 0}>
          <Download />
          Export CSV
        </Button>
      }
    >
      {/* "Outstanding" is the headline and is never added to a donation total anywhere
          in the console. Committed money that has not arrived is useful to see beside
          income and dangerous to count as income. */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Outstanding"
          value={money(outstanding)}
          sub="Promised, not yet received"
          Icon={CalendarCheck2}
          tone="gold"
        />
        <StatTile
          label="Overdue"
          value={money(overdue)}
          sub={`${overdueCount} payment${overdueCount === 1 ? '' : 's'} past its date`}
          Icon={TriangleAlert}
          tone={overdue > 0 ? 'brand' : 'default'}
        />
        <StatTile
          label="Received against pledges"
          value={money(received)}
          sub="Already in the donation ledger"
          tone="leaf"
        />
        <StatTile
          label="Live pledges"
          value={visible.length}
          sub={`${new Set(visible.map((r) => r.donorName)).size} donors`}
        />
      </div>

      {loading ? (
        <LoadingSkeleton variant="table" rows={10} />
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.pledge.id}
          onRowClick={(r) => setOpen(r)}
          initialSort={{ key: 'next', dir: 'asc' }}
          empty={{
            title: 'No pledges match',
            detail: 'Clear a filter to widen the register.',
          }}
        />
      )}

      {/* The drawer is where the work happens: the schedule, and a way to book a
          payment against one dated row of it rather than against the pledge as a whole. */}
      <Sheet
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? `${open.donorName} — ${titleCase(open.pledge.category)}` : ''}
        description={open ? `${open.pledge.id} · pledged ${fmtDate(open.pledge.createdAt)}` : ''}
        className="max-w-xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(null)}>
              Close
            </Button>
            {open && open.pledge.status !== 'cancelled' && open.totals.outstanding > 0 ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() =>
                    toast('Reminder queued', {
                      detail: `${open.donorName} would be emailed about ${money(open.totals.outstanding)} outstanding. No mail is actually sent.`,
                    })
                  }
                >
                  <Send />
                  Send reminder
                </Button>
                <Button
                  onClick={() => {
                    setMethod(open.pledge.intendedMethod)
                    setSettling(open.next ?? null)
                  }}
                  disabled={!open.next}
                >
                  <BanknoteArrowDown />
                  Record payment
                </Button>
              </>
            ) : null}
          </>
        }
      >
        {open ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-base">
              <div>
                <dt className="eyebrow">Pledged</dt>
                <dd className="font-medium tabular-nums">{money(open.totals.pledged)}</dd>
              </div>
              <div>
                <dt className="eyebrow">Outstanding</dt>
                <dd className="font-medium tabular-nums">{money(open.totals.outstanding)}</dd>
              </div>
              <div>
                <dt className="eyebrow">Plan</dt>
                <dd>
                  {describePlan(
                    {
                      amount: open.pledge.amount,
                      cadence: open.pledge.cadence,
                      count: open.pledge.installments.length,
                    },
                    money,
                  )}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Paying by</dt>
                <dd>{titleCase(open.pledge.intendedMethod)}</dd>
              </div>
              {open.donor ? (
                <div className="col-span-2">
                  <dt className="eyebrow">Contact</dt>
                  <dd className="text-muted">
                    {open.donor.email} · {open.donor.phone}
                  </dd>
                </div>
              ) : open.pledge.donor ? (
                <div className="col-span-2">
                  <dt className="eyebrow">Contact (no account)</dt>
                  <dd className="text-muted">
                    {open.pledge.donor.email} · {open.pledge.donor.phone}
                  </dd>
                </div>
              ) : null}
              {open.pledge.dedicatedTo ? (
                <div className="col-span-2">
                  <dt className="eyebrow">Dedicated to</dt>
                  <dd className="italic">{open.pledge.dedicatedTo}</dd>
                </div>
              ) : null}
              {open.pledge.note ? (
                <div className="col-span-2">
                  <dt className="eyebrow">Note from the donor</dt>
                  <dd className="text-muted">{open.pledge.note}</dd>
                </div>
              ) : null}
            </dl>

            <div className="border-t border-line pt-3">
              <p className="eyebrow mb-1">Schedule</p>
              <PledgeSchedule installments={open.pledge.installments} />
            </div>

            {open.pledge.status !== 'cancelled' && open.totals.outstanding > 0 ? (
              <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
                {open.next ? (
                  <Button variant="ghost" size="sm" onClick={() => skip(open.next!)}>
                    <SkipForward />
                    Skip {fmtDate(open.next.dueDate, 'MMM d')}
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-brand-600"
                  onClick={() => setWriteOff(open)}
                >
                  <XCircle />
                  Write off the rest
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Sheet>

      <Dialog
        open={!!settling}
        onClose={() => setSettling(null)}
        title="Record a pledge payment"
        description="This books a real donation against the pledge — it enters the ledger, counts toward the year, and becomes receiptable."
        footer={
          <>
            <Button variant="outline" onClick={() => setSettling(null)}>
              Cancel
            </Button>
            <Button onClick={recordPayment} disabled={busy}>
              {busy ? 'Recording…' : `Record ${money(settling?.amount ?? 0)}`}
            </Button>
          </>
        }
      >
        {settling && open ? (
          <div className="space-y-3">
            <p className="text-base">
              Instalment due <span className="font-medium">{fmtDate(settling.dueDate)}</span> —{' '}
              <span className="font-medium tabular-nums">{money(settling.amount)}</span> from{' '}
              {open.donorName}.
            </p>
            <Field label="How it arrived" htmlFor="pl-method">
              <Select
                id="pl-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as Donation['paymentMethod'])}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {titleCase(m)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={!!writeOff}
        onClose={() => setWriteOff(null)}
        title="Write off the rest of this pledge?"
        description="The register keeps the record that the temple was promised the money and did not receive it. Payments already made stay in the ledger as gifts."
        footer={
          <>
            <Button variant="outline" onClick={() => setWriteOff(null)}>
              Keep chasing
            </Button>
            <Button onClick={confirmWriteOff} disabled={busy}>
              {busy ? 'Writing off…' : `Write off ${money(writeOff?.totals.outstanding ?? 0)}`}
            </Button>
          </>
        }
      >
        <Field label="Reason" hint="optional — replaces the donor's note on the record">
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Family moved out of state; confirmed by phone on the 14th."
          />
        </Field>
      </Dialog>
    </PageShell>
  )
}
