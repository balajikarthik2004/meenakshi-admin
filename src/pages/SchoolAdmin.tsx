import { useMemo, useState } from 'react'
import { BadgeCheck, Download, ListChecks, Users, Wallet, XCircle } from 'lucide-react'
import type { ClassEnrolment, SchoolClass, SchoolTerm } from '@/lib/data/types'
import { PageShell } from '@/components/layout/PageShell'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { StatTile } from '@/components/shared/StatTile'
import { StatusPill } from '@/components/shared/badges'
import { LoadingSkeleton } from '@/components/shared/states'
import { Toolbar, ToolbarSelect } from '@/components/admin/Toolbar'
import { Badge, Progress } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/overlay'
import { Chips } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import {
  confirmEnrolmentPayment,
  getSchoolStats,
  getSchoolTerm,
  listClasses,
  listEnrolments,
  promoteFromWaitlist,
  setClassActive,
  setEnrolmentStatus,
} from '@/lib/data/api'
import { useAsync } from '@/lib/hooks'
import {
  CATEGORY_LABEL,
  ENROLMENT_LABEL,
  ageRange,
  isFull,
  seatsLeft,
  timeRange,
} from '@/lib/school'
import { cn, downloadCSV, fmtDate, money } from '@/lib/utils'

/**
 * The Vedic Heritage School register.
 *
 * Two jobs, so two tabs. **Enrolments** is the worklist — who has registered, who
 * still owes money, and who is waiting for a place — and it leads because the money
 * the school is chasing is what makes this page urgent. **Classes** is the capacity
 * view, which is read once a week rather than once an hour.
 *
 * Every figure comes from `@/lib/school`, the same file the devotee catalogue reads,
 * so a parent who is told online that a class is full and a coordinator looking at
 * this register cannot disagree about it.
 */

const TABS = [
  { key: 'enrolments', label: 'Enrolments' },
  { key: 'classes', label: 'Classes' },
]

const STATUSES: ClassEnrolment['status'][] = [
  'pending-payment',
  'enrolled',
  'waitlisted',
  'withdrawn',
  'completed',
]

/** Lower sorts first: an unpaid registration is today's work, a withdrawal is not. */
const ACTION_ORDER: Record<ClassEnrolment['status'], number> = {
  'pending-payment': 0,
  waitlisted: 1,
  enrolled: 2,
  completed: 3,
  withdrawn: 4,
}

interface Row {
  enrolment: ClassEnrolment
  cls?: SchoolClass
}

export default function SchoolAdmin() {
  const { toast } = useToast()
  const [tab, setTab] = useState('enrolments')
  const [status, setStatus] = useState('')
  const [classId, setClassId] = useState('')
  const [confirmDrop, setConfirmDrop] = useState<ClassEnrolment | null>(null)
  const [busy, setBusy] = useState(false)

  const { data, loading, refresh } = useAsync(
    async () => Promise.all([listEnrolments(), listClasses(), getSchoolTerm(), getSchoolStats()]),
    [],
  )

  const enrolments = useMemo(() => data?.[0] ?? [], [data])
  const classes = useMemo(() => data?.[1] ?? [], [data])
  const term: SchoolTerm | undefined = data?.[2]
  const stats = data?.[3]

  const byId = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes])

  const rows = useMemo<Row[]>(
    () =>
      enrolments
        .filter((e) => (status ? e.status === status : true))
        .filter((e) => (classId ? e.classId === classId : true))
        .map((e) => ({ enrolment: e, cls: byId.get(e.classId) })),
    [enrolments, status, classId, byId],
  )

  const confirmPaid = async (e: ClassEnrolment) => {
    await confirmEnrolmentPayment(e.id)
    toast(`${e.studentName} confirmed`, {
      detail: `${money(e.fee)} received — the place is now held.`,
    })
    refresh()
  }

  const promote = async (e: ClassEnrolment) => {
    const result = await promoteFromWaitlist(e.id)
    if (!result.ok) {
      toast('Could not offer the place', { detail: result.reason })
      return
    }
    toast(`${e.studentName} offered a place`, {
      detail:
        result.enrolment.status === 'pending-payment'
          ? 'Awaiting their fee before it is confirmed.'
          : 'Enrolled.',
    })
    refresh()
  }

  const withdraw = async () => {
    if (!confirmDrop) return
    setBusy(true)
    await setEnrolmentStatus(confirmDrop.id, 'withdrawn')
    setBusy(false)
    toast(`${confirmDrop.studentName} withdrawn`, {
      detail: 'The place is free for the waiting list.',
    })
    setConfirmDrop(null)
    refresh()
  }

  const toggleClass = async (c: SchoolClass) => {
    await setClassActive(c.id, !c.active)
    toast(c.active ? `${c.name} taken off the catalogue` : `${c.name} back on the catalogue`)
    refresh()
  }

  const columns: Column<Row>[] = [
    {
      key: 'student',
      header: 'Student',
      sortValue: (r) => r.enrolment.studentName,
      cell: (r) => (
        <div className="min-w-0">
          <p className="font-medium text-ink">{r.enrolment.studentName}</p>
          <p className="text-sm text-muted">
            Age {r.enrolment.studentAge} · {r.enrolment.guardianName}
          </p>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class',
      sortValue: (r) => r.cls?.code ?? '',
      cell: (r) => (
        <div className="min-w-0">
          <p>
            <span className="font-mono text-sm text-muted">{r.cls?.code}</span> {r.cls?.name ?? '—'}
          </p>
          {r.cls ? (
            <p className="text-sm text-muted">
              {timeRange(r.cls.startTime, r.cls.endTime)} · {r.cls.room}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      /* Ranked by what needs doing, not alphabetically. Sorted by name the register
         opened on a screen of settled enrolments while the two unpaid ones — the
         page's own headline figure — sat below the fold. */
      sortValue: (r) => ACTION_ORDER[r.enrolment.status],
      cell: (r) => (
        <span className="flex flex-wrap items-center gap-1.5">
          <StatusPill status={r.enrolment.status} label={ENROLMENT_LABEL[r.enrolment.status]} />
          {r.enrolment.waitlistPosition ? (
            <span className="text-sm text-muted">#{r.enrolment.waitlistPosition}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'fee',
      header: 'Fee',
      sortValue: (r) => r.enrolment.fee,
      align: 'right',
      cell: (r) => (
        <div className="text-right">
          <p className="font-medium tabular-nums">
            {r.enrolment.fee === 0 ? 'Free' : money(r.enrolment.fee)}
          </p>
          <p className="text-sm text-muted">
            {r.enrolment.status === 'pending-payment'
              ? `by ${r.enrolment.paymentMethod}`
              : r.enrolment.paidAt
                ? fmtDate(r.enrolment.paidAt, 'd MMM')
                : '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'action',
      header: '',
      cell: (r) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* The one action this desk performs most: matching a cheque to a name. */}
          {r.enrolment.status === 'pending-payment' ? (
            <Button size="sm" onClick={() => confirmPaid(r.enrolment)}>
              <BadgeCheck />
              Mark paid
            </Button>
          ) : null}
          {r.enrolment.status === 'waitlisted' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => promote(r.enrolment)}
              disabled={!!r.cls && isFull(r.cls)}
              title={r.cls && isFull(r.cls) ? 'No place has freed up yet' : undefined}
            >
              Offer a place
            </Button>
          ) : null}
          {r.enrolment.status !== 'withdrawn' ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-brand-600"
              onClick={() => setConfirmDrop(r.enrolment)}
            >
              <XCircle />
            </Button>
          ) : null}
        </div>
      ),
    },
  ]

  const exportCSV = () =>
    downloadCSV(
      'meenakshi-school-enrolments.csv',
      rows.map((r) => ({
        Id: r.enrolment.id,
        Student: r.enrolment.studentName,
        Age: r.enrolment.studentAge,
        Class: r.cls?.name ?? '',
        Code: r.cls?.code ?? '',
        Guardian: r.enrolment.guardianName,
        Phone: r.enrolment.guardianPhone,
        Email: r.enrolment.guardianEmail,
        Status: r.enrolment.status,
        Fee: r.enrolment.fee,
        Method: r.enrolment.paymentMethod,
        Paid: r.enrolment.paidAt ? fmtDate(r.enrolment.paidAt, 'yyyy-MM-dd') : '',
        Registered: fmtDate(r.enrolment.createdAt, 'yyyy-MM-dd'),
        Notes: r.enrolment.notes ?? '',
      })),
    )

  const toolbar =
    tab === 'enrolments' ? (
      <Toolbar
        activeCount={[status, classId].filter(Boolean).length}
        onClear={() => {
          setStatus('')
          setClassId('')
        }}
      >
        <ToolbarSelect
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">Any status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ENROLMENT_LABEL[s]}
            </option>
          ))}
        </ToolbarSelect>
        <ToolbarSelect
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          aria-label="Filter by class"
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} · {c.name}
            </option>
          ))}
        </ToolbarSelect>
      </Toolbar>
    ) : undefined

  return (
    <PageShell
      eyebrow="School"
      title="Vedic Heritage School"
      description={
        term
          ? `${term.name} · ${term.cadence} · registration closes ${fmtDate(term.registrationCloses, 'd MMM yyyy')}`
          : 'Hindu WISDOM Program'
      }
      tabs={<Chips items={TABS} value={tab} onChange={setTab} />}
      toolbar={toolbar}
      actions={
        tab === 'enrolments' ? (
          <Button variant="ghost" size="sm" onClick={exportCSV} disabled={rows.length === 0}>
            <Download />
            Export CSV
          </Button>
        ) : undefined
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Fees outstanding leads: it is the only number here that is somebody's
            job today. The rest describe the shape of the year. */}
        <StatTile
          label="Fees outstanding"
          value={money(stats?.feesOutstanding ?? 0)}
          sub={`${stats?.awaitingPayment ?? 0} registrations unpaid`}
          Icon={Wallet}
          tone={stats?.awaitingPayment ? 'brand' : 'default'}
        />
        <StatTile
          label="Fees collected"
          value={money(stats?.feesCollected ?? 0)}
          sub="Against confirmed places"
          Icon={BadgeCheck}
          tone="leaf"
        />
        <StatTile
          label="Seats taken"
          value={`${stats?.seatsTaken ?? 0} / ${stats?.seats ?? 0}`}
          sub={`${stats?.full ?? 0} of ${stats?.classes ?? 0} classes full`}
          Icon={Users}
        />
        <StatTile
          label="On waiting lists"
          value={stats?.waitlisted ?? 0}
          sub="Awaiting a free place"
          Icon={ListChecks}
          tone={stats?.waitlisted ? 'gold' : 'default'}
        />
      </div>

      {loading ? (
        <LoadingSkeleton variant="table" rows={8} />
      ) : tab === 'enrolments' ? (
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.enrolment.id}
          initialSort={{ key: 'status', dir: 'asc' }}
          empty={{
            title: 'No registrations match',
            detail: 'Clear a filter to see the whole register.',
          }}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {classes.map((c) => (
            <ClassCard key={c.id} cls={c} onToggle={() => toggleClass(c)} />
          ))}
        </div>
      )}

      <Dialog
        open={!!confirmDrop}
        onClose={() => setConfirmDrop(null)}
        title={`Withdraw ${confirmDrop?.studentName ?? ''}?`}
        description="The place is released immediately and can be offered to the waiting list."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDrop(null)}>
              Keep the place
            </Button>
            <Button onClick={withdraw} disabled={busy}>
              {busy ? 'Withdrawing…' : 'Withdraw'}
            </Button>
          </>
        }
      >
        {confirmDrop ? (
          <p className="text-base text-ink">
            {confirmDrop.studentName} will be withdrawn from{' '}
            {byId.get(confirmDrop.classId)?.name ?? 'this class'}.
            {confirmDrop.status === 'enrolled' && confirmDrop.fee > 0
              ? ` A refund of ${money(confirmDrop.fee)} is handled outside the app.`
              : ''}
          </p>
        ) : null}
      </Dialog>
    </PageShell>
  )
}

/** One class, as the coordinators read it: how full, and whether it is running. */
function ClassCard({ cls, onToggle }: { cls: SchoolClass; onToggle: () => void }) {
  const full = isFull(cls)
  const pct = cls.capacity > 0 ? (cls.enrolled / cls.capacity) * 100 : 0

  return (
    <Card className={cn('p-5', !cls.active && 'opacity-60')}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-muted">{cls.code}</span>
            <h2 className="font-serif text-lg text-ink">{cls.name}</h2>
            {full ? <Badge variant="brand">Full</Badge> : null}
            {!cls.active ? <Badge variant="neutral">Not running</Badge> : null}
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {CATEGORY_LABEL[cls.category]} · {ageRange(cls)} ·{' '}
            {timeRange(cls.startTime, cls.endTime)} · {cls.room}
          </p>
          <p className="text-sm text-muted">{cls.teacher}</p>
        </div>
        <span className="shrink-0 text-right">
          <span className="block text-lg font-medium tabular-nums text-ink">
            {cls.fee === 0 ? 'Free' : money(cls.fee)}
          </span>
          <span className="block text-sm text-muted">for the year</span>
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
          <span className="font-medium text-ink">
            {cls.enrolled} of {cls.capacity} seats
          </span>
          <span className={cn('tabular-nums', full ? 'text-brand-600' : 'text-muted')}>
            {full ? 'Full' : `${seatsLeft(cls)} left`}
          </span>
        </div>
        <Progress
          value={pct}
          tone={full ? 'brand' : pct > 75 ? 'gold' : 'leaf'}
          label={`${cls.name} — ${cls.enrolled} of ${cls.capacity} seats taken`}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
        <span className="text-sm text-muted">
          {cls.active ? 'On the devotee catalogue' : 'Hidden from the catalogue'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={cls.active}
          aria-label={`${cls.name} running this year`}
          onClick={onToggle}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
            cls.active ? 'bg-leaf-500' : 'bg-line',
          )}
        >
          <span
            className={cn(
              'inline-block size-5 rounded-full bg-white shadow transition-transform',
              cls.active ? 'translate-x-[22px]' : 'translate-x-0.5',
            )}
          />
        </button>
      </div>
    </Card>
  )
}
