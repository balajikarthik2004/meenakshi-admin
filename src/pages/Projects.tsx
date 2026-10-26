import { useMemo, useState } from 'react'
import {
  Banknote,
  Download,
  HardHat,
  MessageSquarePlus,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import type { Donation, Project, User } from '@/lib/data/types'
import { PageShell } from '@/components/layout/PageShell'
import { ProjectCover } from '@/components/shared/ProjectCover'
import { ProjectMoneyFlow } from '@/components/shared/ProjectMoneyFlow'
import { StatTile } from '@/components/shared/StatTile'
import { StatusPill } from '@/components/shared/badges'
import { LoadingSkeleton } from '@/components/shared/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { Dialog, Sheet } from '@/components/ui/overlay'
import { Chips } from '@/components/ui/tabs'
import { Table, TBody, TD, TH, THead, TR, TableWrap } from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import {
  addProjectNote,
  listDevotees,
  listProjectDonations,
  listProjects,
  recordProjectExpense,
  updateProjectProgress,
} from '@/lib/data/api'
import { useAsync } from '@/lib/hooks'
import {
  PROJECT_FILTERS,
  expensesTotal,
  projectBalance,
  stillToRaise,
  summariseProjects,
} from '@/lib/project'
import { downloadCSV, fmtDate, money, titleCase } from '@/lib/utils'

/**
 * The capital programme, from the office side.
 *
 * The devotee page and this one are the same figures rendered twice, on purpose —
 * `ProjectMoneyFlow` and `@/lib/project` are shared with the devotee app, so the board
 * cannot be reading one set of numbers while the public reads another. What this page
 * adds is the three things only the office can do: book a payment out of a project's
 * fund, move the work-completed figure, and post an update devotees will read.
 *
 * Booking an expense recomputes `spentAmount` from the lines rather than incrementing
 * it, which is the same rule the seed asserts at import. A headline that can drift
 * from the statement under it is worse than no headline.
 */

const STATUSES: Project['status'][] = ['planned', 'in-progress', 'completed']

interface Drawer {
  project: Project
  gifts: Donation[]
}

export default function Projects() {
  const { toast } = useToast()
  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [expenseFor, setExpenseFor] = useState<Project | null>(null)
  const [vendor, setVendor] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState(0)
  const [reference, setReference] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

  const [noteFor, setNoteFor] = useState<Project | null>(null)
  const [note, setNote] = useState('')

  const { data, loading, refresh } = useAsync(
    async () => Promise.all([listProjects(), listDevotees()]),
    [],
  )

  const projects = useMemo(() => data?.[0] ?? [], [data])
  const devotees = useMemo(() => data?.[1] ?? [], [data])
  const summary = useMemo(() => summariseProjects(projects), [projects])

  const shown = projects.filter((p) => (filter === 'all' ? true : p.status === filter))

  const { data: drawer } = useAsync<Drawer | null>(async () => {
    const project = projects.find((p) => p.id === openId)
    if (!project) return null
    return { project, gifts: await listProjectDonations(project.id, 40) }
  }, [openId, projects])

  const resetExpense = () => {
    setVendor('')
    setDescription('')
    setAmount(0)
    setReference('')
    setDate(new Date().toISOString().slice(0, 10))
  }

  const saveExpense = async () => {
    if (!expenseFor || !vendor.trim() || amount <= 0) return
    setBusy(true)
    await recordProjectExpense(expenseFor.id, {
      date: new Date(`${date}T12:00:00`).toISOString(),
      vendor: vendor.trim(),
      description: description.trim() || 'Project expenditure',
      amount,
      reference: reference.trim() || undefined,
    })
    setBusy(false)
    setExpenseFor(null)
    resetExpense()
    toast(`${money(amount)} booked against ${expenseFor.title}`, {
      detail: 'It is published on the devotee project page immediately.',
    })
    refresh()
  }

  const saveNote = async () => {
    if (!noteFor || !note.trim()) return
    setBusy(true)
    await addProjectNote(noteFor.id, note)
    setBusy(false)
    setNoteFor(null)
    setNote('')
    toast('Update posted', { detail: 'Devotees see it on the project page.' })
    refresh()
  }

  const setProgress = async (p: Project, pct: number) => {
    await updateProjectProgress(p.id, { progressPct: pct })
    refresh()
  }

  const setStatus = async (p: Project, status: Project['status']) => {
    await updateProjectProgress(p.id, {
      status,
      // Finishing a project closes it: money given to completed work is money the
      // devotee meant for something else.
      openForDonations: status === 'completed' ? false : p.openForDonations,
    })
    toast(`${p.title} marked ${titleCase(status)}`)
    refresh()
  }

  const exportCSV = () =>
    downloadCSV(
      'meenakshi-projects.csv',
      projects.map((p) => ({
        Id: p.id,
        Project: p.title,
        Status: p.status,
        Target: p.targetAmount,
        Raised: p.raisedAmount,
        Spent: p.spentAmount,
        InHand: projectBalance(p),
        StillToRaise: stillToRaise(p),
        WorkPct: p.progressPct,
        OpenForDonations: p.openForDonations ? 'Yes' : 'No',
        Expenses: p.expenses.length,
        TargetCompletion: p.targetCompletion ? fmtDate(p.targetCompletion, 'yyyy-MM-dd') : '',
      })),
    )

  return (
    <PageShell
      eyebrow="Money"
      title="Capital projects"
      description={`${projects.length} projects · ${money(summary.raised)} raised · ${money(summary.balance)} in hand`}
      tabs={<Chips items={[...PROJECT_FILTERS]} value={filter} onChange={setFilter} />}
      actions={
        <Button variant="ghost" size="sm" onClick={exportCSV} disabled={projects.length === 0}>
          <Download />
          Export CSV
        </Button>
      }
    >
      {/* Raised and spent are reported apart, and the difference between them is given
          its own tile. "In hand" is the figure the board asks for first and the one a
          single progress bar can never show. */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Raised"
          value={money(summary.raised)}
          sub={`Against ${money(summary.target)} of targets`}
          Icon={HardHat}
          tone="leaf"
        />
        <StatTile
          label="Spent"
          value={money(summary.spent)}
          sub="Itemised on every project page"
          Icon={Receipt}
        />
        <StatTile
          label="In hand"
          value={money(summary.balance)}
          sub="Raised, not yet disbursed"
          Icon={Wallet}
          tone="brand"
        />
        <StatTile
          label="Still to raise"
          value={money(summary.stillToRaise)}
          sub={`${summary.open} open for giving`}
          Icon={TrendingUp}
          tone="gold"
        />
      </div>

      {loading ? (
        <LoadingSkeleton variant="tiles" rows={4} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {shown.map((p) => (
            <Card key={p.id} className="flex min-w-0 flex-col overflow-hidden">
              {/* The same elevation the devotee page carries, so the console and the
                  public site are recognisably describing one project. */}
              <div className="relative h-28 shrink-0 border-b border-line">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ProjectCover cover={p.cover} />
                )}
                <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 bg-gradient-to-t from-ink/80 to-transparent p-3.5">
                  <h2 className="font-serif text-lg leading-tight text-white">{p.title}</h2>
                  <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-0.5 text-sm font-medium tabular-nums text-white backdrop-blur-sm">
                    {money(p.targetAmount)} target
                  </span>
                </div>
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  <StatusPill status={p.status} />
                  {!p.openForDonations ? (
                    <span className="rounded-full bg-ink/70 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                      Closed to gifts
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex min-w-0 flex-1 flex-col p-5">
                <p className="max-w-[46ch] text-sm text-muted">{p.summary}</p>

                <ProjectMoneyFlow project={p} className="mt-4" />

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3.5">
                  <Button size="sm" variant="ghost" onClick={() => setOpenId(p.id)}>
                    <Receipt />
                    Money flow
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      resetExpense()
                      setExpenseFor(p)
                    }}
                  >
                    <Banknote />
                    Record expense
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setNoteFor(p)}>
                    <MessageSquarePlus />
                    Post update
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* The drawer is the project's full statement: what came in, what went out, and
          the two controls that are genuinely the office's to move. */}
      <Sheet
        open={!!drawer}
        onClose={() => setOpenId(null)}
        title={drawer?.project.title ?? ''}
        description={
          drawer
            ? `${money(drawer.project.raisedAmount)} raised · ${money(drawer.project.spentAmount)} spent · ${money(projectBalance(drawer.project))} in hand`
            : ''
        }
        className="max-w-2xl"
        footer={
          <Button variant="outline" onClick={() => setOpenId(null)}>
            Close
          </Button>
        }
      >
        {drawer ? (
          <div className="space-y-5">
            <ProjectMoneyFlow project={drawer.project} />

            <div className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
              <Field label="Work completed" htmlFor="pj-progress" hint="per cent">
                <Input
                  id="pj-progress"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={drawer.project.progressPct}
                  onBlur={(e) => setProgress(drawer.project, Number(e.target.value) || 0)}
                />
              </Field>
              <Field label="Status" htmlFor="pj-status">
                <Select
                  id="pj-status"
                  value={drawer.project.status}
                  onChange={(e) => setStatus(drawer.project, e.target.value as Project['status'])}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {titleCase(s)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="border-t border-line pt-4">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <p className="eyebrow">Expenditure</p>
                <p className="text-sm text-muted">
                  {drawer.project.expenses.length} payments · {money(expensesTotal(drawer.project))}
                </p>
              </div>
              {drawer.project.expenses.length === 0 ? (
                <p className="text-base italic text-muted">
                  Nothing has been paid out of this fund yet.
                </p>
              ) : (
                <TableWrap>
                  <Table>
                    <THead>
                      <TR>
                        <TH>Date</TH>
                        <TH>Paid to</TH>
                        <TH>For</TH>
                        <TH className="text-right">Amount</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {drawer.project.expenses.map((e) => (
                        <TR key={e.id}>
                          <TD className="whitespace-nowrap text-muted">{fmtDate(e.date)}</TD>
                          <TD className="font-medium">{e.vendor}</TD>
                          <TD className="text-muted">
                            {e.description}
                            {e.reference ? (
                              <span className="ml-1.5 font-mono text-xs text-faint">
                                {e.reference}
                              </span>
                            ) : null}
                          </TD>
                          <TD className="text-right tabular-nums">{money(e.amount)}</TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </TableWrap>
              )}
            </div>

            <div className="border-t border-line pt-4">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <p className="eyebrow">Recent gifts to this project</p>
                {/* Never captioned as the total: `raisedAmount` is the audited figure
                    and predates this ledger. */}
                <p className="text-sm text-muted">{drawer.gifts.length} shown</p>
              </div>
              {drawer.gifts.length === 0 ? (
                <p className="text-base italic text-muted">No gifts earmarked yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {drawer.gifts.map((d) => {
                    const donor = d.userId ? devotees.find((u) => u.id === d.userId) : undefined
                    return (
                      <li
                        key={d.id}
                        className="flex items-center justify-between gap-3 py-2 text-base"
                      >
                        <span className="min-w-0">
                          <span className="block font-medium text-ink">{donorName(donor, d)}</span>
                          <span className="block text-sm text-muted">
                            {fmtDate(d.createdAt)} · {titleCase(d.paymentMethod)}
                            {d.pledgeId ? ' · pledge payment' : ''}
                          </span>
                        </span>
                        <span className="shrink-0 tabular-nums">{money(d.amount)}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </Sheet>

      <Dialog
        open={!!expenseFor}
        onClose={() => setExpenseFor(null)}
        title={`Record an expense — ${expenseFor?.title ?? ''}`}
        description="This is published on the devotee project page as soon as it is saved, with the vendor named."
        footer={
          <>
            <Button variant="outline" onClick={() => setExpenseFor(null)}>
              Cancel
            </Button>
            <Button onClick={saveExpense} disabled={busy || !vendor.trim() || amount <= 0}>
              {busy ? 'Saving…' : `Book ${money(amount)}`}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date" htmlFor="ex-date">
            <Input
              id="ex-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Amount" htmlFor="ex-amount">
            <Input
              id="ex-amount"
              type="number"
              min={1}
              value={amount || ''}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
            />
          </Field>
          <Field label="Paid to" htmlFor="ex-vendor" className="sm:col-span-2">
            <Input
              id="ex-vendor"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="Kumbakonam Silpa Kalai"
            />
          </Field>
          <Field label="For" htmlFor="ex-desc" className="sm:col-span-2">
            <Input
              id="ex-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sthapathi retainer, phase two"
            />
          </Field>
          <Field
            label="Invoice or minute reference"
            hint="optional"
            htmlFor="ex-ref"
            className="sm:col-span-2"
          >
            <Input
              id="ex-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="INV-7790"
            />
          </Field>
        </div>

        {expenseFor && amount > projectBalance(expenseFor) ? (
          <p className="mt-3 text-base text-brand-600">
            This is more than the {money(projectBalance(expenseFor))} currently in hand for this
            project. It will be booked, and the project will show as overspent.
          </p>
        ) : null}
      </Dialog>

      <Dialog
        open={!!noteFor}
        onClose={() => setNoteFor(null)}
        title={`Post an update — ${noteFor?.title ?? ''}`}
        description="Devotees read these on the project page, newest first."
        footer={
          <>
            <Button variant="outline" onClick={() => setNoteFor(null)}>
              Cancel
            </Button>
            <Button onClick={saveNote} disabled={busy || !note.trim()}>
              {busy ? 'Posting…' : 'Post update'}
            </Button>
          </>
        }
      >
        <Textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Scaffolding comes down on the 14th; the north face is complete."
        />
      </Dialog>
    </PageShell>
  )
}

/** A named devotee where there is one, their own details where there is not. */
function donorName(donor: User | undefined, d: Donation) {
  if (donor) return donor.name
  if (d.donor) return `${d.donor.firstName} ${d.donor.lastName}`
  return 'Anonymous'
}
