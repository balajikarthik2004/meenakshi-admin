import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarCheck2,
  FileDown,
  Printer,
  Scale,
  Target,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import { PageShell } from '@/components/layout/PageShell'
import { PnLTable } from '@/components/admin/PnLTable'
import { TargetBreakdown } from '@/components/admin/TargetBreakdown'
import { PrintableAgmReport } from '@/components/admin/PrintableAgmReport'
import { BreakEvenMeter } from '@/components/shared/BreakEvenMeter'
import { ProjectMoneyFlow } from '@/components/shared/ProjectMoneyFlow'
import { StatTile } from '@/components/shared/StatTile'
import { LoadingSkeleton } from '@/components/shared/states'
import { StatusPill } from '@/components/shared/badges'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/overlay'
import {
  getPledgeStats,
  getPujaPnL,
  getTransparencySnapshot,
  listEvents,
  listProjects,
} from '@/lib/data/api'
import { useAsync } from '@/lib/hooks'
import { summariseProjects } from '@/lib/project'
import { fmtDate, money, pct } from '@/lib/utils'

/**
 * Shared by `/transparency` (operational) and `/board` (read-only). `readOnly` hides
 * the buttons a board member should never press, per Section 11.13.
 */
export default function Transparency({ readOnly = false }: { readOnly?: boolean }) {
  const [printing, setPrinting] = useState(false)

  const { data, loading } = useAsync(
    async () =>
      Promise.all([
        getTransparencySnapshot(),
        getPujaPnL(),
        listEvents(),
        listProjects(),
        getPledgeStats(),
      ]),
    [],
  )

  if (loading || !data) {
    return (
      <PageShell title="Transparency" description="Loading the ledger…">
        <LoadingSkeleton variant="tiles" rows={4} />
      </PageShell>
    )
  }

  const [snapshot, pnl, events, projects, pledges] = data
  const projectTotals = summariseProjects(projects)
  const now = Date.now()
  const meterEvents = events
    .filter((e) => new Date(e.date).getTime() > now - 90 * 86400000)
    .slice(0, 10)

  return (
    <PageShell
      eyebrow="Money"
      title={readOnly ? 'Board strategic view' : 'Transparency dashboard'}
      description={
        readOnly
          ? 'Read-only. Figures match the operational dashboard exactly — no separate books.'
          : `Every dollar in and out. Updated ${fmtDate(snapshot.updatedAt, "MMM d 'at' h:mm a")}.`
      }
      actions={
        <Button onClick={() => setPrinting(true)}>
          {readOnly ? <Printer /> : <FileDown />}
          {readOnly ? 'Print for AGM' : 'Export PDF'}
        </Button>
      }
    >
      {/* Row 1 — the four numbers that carry the story */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Collected YTD"
          value={money(snapshot.ytdCollected)}
          sub="Donations and sponsorships"
          Icon={Wallet}
          tone="leaf"
        />
        <StatTile
          label="Annual target"
          value={money(snapshot.annualTarget)}
          sub="Board-approved operating budget"
          Icon={Target}
          tone="gold"
        />
        <StatTile
          label="Balance to break-even"
          value={money(snapshot.balanceToBreakeven)}
          sub="Still to raise this year"
          Icon={Scale}
          tone="brand"
        />
        <StatTile
          label="Achieved"
          value={pct(snapshot.achievedPct)}
          sub="Of the annual target"
          Icon={TrendingUp}
          tone="leaf"
        />
      </div>

      <Card className="mt-4 p-5">
        <BreakEvenMeter
          target={snapshot.annualTarget}
          collected={snapshot.ytdCollected}
          label="Annual operating position"
        />
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The same three figures are published on the devotee homepage. There is one ledger and one
          set of numbers — what the board sees here is what a devotee sees there.
        </p>
      </Card>

      {/* The pledge book, reported beside the position above and never inside it.
          Money the temple has been promised is genuinely useful next to the break-even
          figure — it is most of what next quarter looks like — and genuinely dangerous
          added to it, because none of it has arrived and some of it never will. The
          meter above therefore moves only when an instalment is actually recorded. */}
      {pledges.outstanding > 0 ? (
        <Card className="mt-4 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="font-serif text-lg text-ink">Pledged, not yet received</h2>
            <Link
              to="/donations/pledges"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Open the pledge register →
            </Link>
          </div>
          <p className="mt-0.5 text-sm text-muted">
            Commitments on the books. Deliberately excluded from collected YTD and from the
            break-even meter above — a pledge counts the day its money arrives, not the day it is
            promised.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <StatTile
              label="Outstanding"
              value={money(pledges.outstanding)}
              sub={`${pledges.active} live pledges from ${pledges.donors} donors`}
              Icon={CalendarCheck2}
              tone="gold"
            />
            <StatTile
              label="Due in the next 30 days"
              value={money(pledges.dueSoon)}
              sub="Expected in next month's post"
            />
            <StatTile
              label="Overdue"
              value={money(pledges.overdue)}
              sub={`${pledges.overdueCount} payment${pledges.overdueCount === 1 ? '' : 's'} past its date`}
              Icon={TriangleAlert}
              tone={pledges.overdue > 0 ? 'brand' : 'default'}
            />
          </div>
        </Card>
      ) : null}

      {/* Where the target goes. The meter above says how much is left to raise; the first
          question anyone asks next is what the money is for, so it is answered immediately
          under it rather than at the bottom of the page. */}
      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-lg text-ink">Where the annual target goes</h2>
          <p className="text-sm text-muted">
            Board-approved budget heads, largest first — target, raised and disbursed.
          </p>
        </div>
        <TargetBreakdown
          allocations={snapshot.allocations}
          annualTarget={snapshot.annualTarget}
          ytdCollected={snapshot.ytdCollected}
        />
      </section>

      {/* Puja P&L */}
      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-lg text-ink">Puja profit &amp; loss</h2>
          <p className="text-sm text-muted">
            Direct cost only — flowers, dravyam, priest honorarium and prasadam.
          </p>
        </div>
        <PnLTable rows={pnl} />
      </section>

      {/* Event break-even */}
      <section className="mt-6">
        <h2 className="mb-3 font-serif text-lg text-ink">Festival break-even</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {meterEvents.map((e) => (
            <Card key={e.id} className="p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-base font-medium text-ink">{e.title}</p>
                  <p className="text-sm text-muted">{fmtDate(e.date, 'MMM d, yyyy')}</p>
                </div>
                <StatusPill status={e.status} />
              </div>
              <BreakEvenMeter
                target={e.targetAmount}
                collected={e.collectedAmount}
                label=""
                compact
              />
            </Card>
          ))}
        </div>
      </section>

      {/* Capital projects.
          The cards render through `ProjectMoneyFlow`, the same component the devotee
          project page uses, so the board and the public are reading one computation
          rather than two that happen to agree today. The funding and work bars are
          kept apart for the same reason they are kept apart there: a project can be
          fully funded and barely begun, and one averaged bar would hide it. */}
      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-lg text-ink">Capital projects</h2>
          <div className="flex flex-wrap items-baseline gap-x-4 text-sm text-muted">
            <span>
              {money(projectTotals.raised)} raised · {money(projectTotals.spent)} spent ·{' '}
              <span className="font-medium text-ink">{money(projectTotals.balance)}</span> in hand
            </span>
            {readOnly ? null : (
              <Link to="/projects" className="font-medium text-brand-600 hover:underline">
                Manage projects →
              </Link>
            )}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex-row items-start justify-between">
                <div className="min-w-0">
                  <CardTitle>{p.title}</CardTitle>
                  <p className="mt-0.5 text-sm text-muted">{p.summary}</p>
                </div>
                <StatusPill status={p.status} />
              </CardHeader>
              <div className="px-5 pb-5">
                <ProjectMoneyFlow project={p} />
                <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                  {p.notes.map((n, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand-300" />
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Dialog
        open={printing}
        onClose={() => setPrinting(false)}
        title="Annual General Meeting summary"
        description="Print-styled report. Use Print to save as PDF — no generator library needed."
        className="max-w-4xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setPrinting(false)}>
              Close
            </Button>
            <Button onClick={() => window.print()}>
              <Printer />
              Print / save as PDF
            </Button>
          </>
        }
      >
        <PrintableAgmReport
          snapshot={snapshot}
          pnl={pnl}
          events={meterEvents}
          projects={projects}
        />
      </Dialog>
    </PageShell>
  )
}
