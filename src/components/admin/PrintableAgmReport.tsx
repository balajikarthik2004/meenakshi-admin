import type { Project, PujaPnLRow, TempleEvent, TransparencySnapshot } from '@/lib/data/types'
import { Logo } from '@/components/shared/Logo'
import { TEMPLE, TEMPLE_EIN } from '@/lib/data/mock'
import { fmtDate, money, pct } from '@/lib/utils'

/**
 * The document Perumal prints for the Annual General Meeting. Deliberately plain —
 * no colour fills, no charts, nothing that fails on an office laser printer.
 */
export function PrintableAgmReport({
  snapshot,
  pnl,
  events,
  projects,
}: {
  snapshot: TransparencySnapshot
  pnl: PujaPnLRow[]
  events: TempleEvent[]
  projects: Project[]
}) {
  const pujaTotals = pnl.reduce(
    (a, r) => ({ collected: a.collected + r.collected, cost: a.cost + r.cost, net: a.net + r.net }),
    { collected: 0, cost: 0, net: 0 },
  )

  return (
    <div className="print-area space-y-6 text-sm leading-relaxed text-ink">
      <header className="flex items-start justify-between gap-4 border-b-2 border-ink/20 pb-4">
        <div className="flex items-start gap-3">
          <Logo size={44} />
          <div>
            <p className="font-bold text-xl leading-tight">{TEMPLE.name}</p>
            <p className="text-sm text-muted">
              {TEMPLE.address}, {TEMPLE.city}, {TEMPLE.state} {TEMPLE.zip} · EIN {TEMPLE_EIN}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.09em] text-muted">
            Annual General Meeting
          </p>
          <p className="font-bold text-md">Financial Summary</p>
          <p className="text-sm text-muted">Prepared {fmtDate(snapshot.updatedAt)}</p>
        </div>
      </header>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.09em] text-muted">
          1 · Operating position
        </h2>
        <table className="w-full border-collapse">
          <tbody className="divide-y divide-line">
            {[
              ['Collected year to date', money(snapshot.ytdCollected)],
              ['Annual operating target', money(snapshot.annualTarget)],
              ['Balance to break-even', money(snapshot.balanceToBreakeven)],
              ['Achieved', pct(snapshot.achievedPct)],
            ].map(([k, v]) => (
              <tr key={k}>
                <td className="py-1.5">{k}</td>
                <td className="py-1.5 text-right font-medium tabular-nums">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.09em] text-muted">
          2 · Puja sponsorship profit &amp; loss
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line">
              {['Puja', 'Sponsors', 'Collected', 'Direct cost', 'Net'].map((h, i) => (
                <th
                  key={h}
                  className={`py-1.5 text-2xs font-semibold uppercase tracking-[0.07em] text-muted ${i === 0 ? 'text-left' : 'text-right'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {pnl.map((r) => (
              <tr key={r.puja.id}>
                <td className="py-1.5">{r.puja.name}</td>
                <td className="py-1.5 text-right tabular-nums">{r.sponsors}</td>
                <td className="py-1.5 text-right tabular-nums">{money(r.collected)}</td>
                <td className="py-1.5 text-right tabular-nums">{money(r.cost)}</td>
                <td className="py-1.5 text-right font-medium tabular-nums">{money(r.net)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink/20">
              <td className="py-2 font-medium">Total</td>
              <td />
              <td className="py-2 text-right font-medium tabular-nums">
                {money(pujaTotals.collected)}
              </td>
              <td className="py-2 text-right font-medium tabular-nums">{money(pujaTotals.cost)}</td>
              <td className="py-2 text-right font-medium tabular-nums">{money(pujaTotals.net)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.09em] text-muted">
          3 · Festival break-even
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line">
              {['Festival', 'Date', 'Target', 'Raised', 'Variance'].map((h, i) => (
                <th
                  key={h}
                  className={`py-1.5 text-2xs font-semibold uppercase tracking-[0.07em] text-muted ${i < 2 ? 'text-left' : 'text-right'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {events.map((e) => (
              <tr key={e.id}>
                <td className="py-1.5">{e.title}</td>
                <td className="py-1.5 whitespace-nowrap text-muted">
                  {fmtDate(e.date, 'MMM d, yyyy')}
                </td>
                <td className="py-1.5 text-right tabular-nums">{money(e.targetAmount)}</td>
                <td className="py-1.5 text-right tabular-nums">{money(e.collectedAmount)}</td>
                <td className="py-1.5 text-right font-medium tabular-nums">
                  {money(e.collectedAmount - e.targetAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.09em] text-muted">
          4 · Capital projects
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line">
              {['Project', 'Status', 'Target', 'Raised', 'Spent', 'Progress'].map((h, i) => (
                <th
                  key={h}
                  className={`py-1.5 text-2xs font-semibold uppercase tracking-[0.07em] text-muted ${i < 2 ? 'text-left' : 'text-right'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {projects.map((p) => (
              <tr key={p.id}>
                <td className="py-1.5">{p.title}</td>
                <td className="py-1.5 capitalize text-muted">{p.status.replace('-', ' ')}</td>
                <td className="py-1.5 text-right tabular-nums">{money(p.targetAmount)}</td>
                <td className="py-1.5 text-right tabular-nums">{money(p.raisedAmount)}</td>
                <td className="py-1.5 text-right tabular-nums">{money(p.spentAmount)}</td>
                <td className="py-1.5 text-right font-medium tabular-nums">{pct(p.progressPct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="border-t border-line pt-4 text-xs text-muted">
        <p>
          {TEMPLE.name} is a 501(c)(3) non-profit organization. This summary is prepared from the
          temple’s operating ledger and is presented to members at the Annual General Meeting.
          Audited statements are available on request from the temple office.
        </p>
        <p className="mt-2 italic">
          Prototype output — figures are generated mock data, not a real financial record.
        </p>
      </footer>
    </div>
  )
}
