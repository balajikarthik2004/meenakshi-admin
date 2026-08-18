import { TEMPLE, TEMPLE_EIN } from '@/lib/data/mock'
import { Logo } from './Logo'
import { cn, fmtDate, money } from '@/lib/utils'

export interface ReceiptLine {
  date: string
  description: string
  amount: number
}

/**
 * A 501(c)(3)-shaped acknowledgement. Deliberately plain and printable — this is the
 * document a devotee hands to their accountant.
 */
export function TaxReceiptPreview({
  donorName,
  donorAddress,
  receiptNo,
  issuedOn,
  lines,
  year,
  className,
}: {
  donorName: string
  donorAddress?: string
  receiptNo: string
  issuedOn?: string
  lines: ReceiptLine[]
  year?: number
  className?: string
}) {
  const total = lines.reduce((s, l) => s + l.amount, 0)

  return (
    <div
      className={cn(
        'print-area rounded-[10px] border border-line bg-card p-6 text-[13px] leading-relaxed text-ink',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-start gap-3">
          <Logo size={40} />
          <div>
            <p className="font-serif text-[18px] leading-tight">{TEMPLE.name}</p>
            <p className="text-[12px] text-muted">
              {TEMPLE.address}, {TEMPLE.city}, {TEMPLE.state} {TEMPLE.zip}
            </p>
            <p className="text-[12px] text-muted">
              {TEMPLE.phone} · {TEMPLE.email}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
            {year ? `${year} Contribution Statement` : 'Donation Receipt'}
          </p>
          <p className="mt-1 font-mono text-[12px]">{receiptNo}</p>
          <p className="text-[12px] text-muted">Issued {fmtDate(issuedOn ?? new Date())}</p>
        </div>
      </header>

      <section className="grid gap-4 border-b border-line py-4 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
            Received from
          </p>
          <p className="mt-1 font-medium">{donorName}</p>
          {donorAddress ? <p className="text-[12.5px] text-muted">{donorAddress}</p> : null}
        </div>
        <div className="sm:text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
            Federal Tax ID (EIN)
          </p>
          <p className="mt-1 font-mono">{TEMPLE_EIN}</p>
          <p className="text-[12px] text-muted">501(c)(3) non-profit organization</p>
        </div>
      </section>

      <table className="w-full border-collapse py-4 text-left">
        <thead>
          <tr className="border-b border-line">
            <th className="py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Date
            </th>
            <th className="py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Description
            </th>
            <th className="py-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {lines.map((l, i) => (
            <tr key={i}>
              <td className="py-2 whitespace-nowrap text-muted">{fmtDate(l.date)}</td>
              <td className="py-2">{l.description}</td>
              <td className="py-2 text-right tabular-nums">{money(l.amount, true)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-ink/20">
            <td colSpan={2} className="py-2.5 font-medium">
              Total deductible contribution
            </td>
            <td className="py-2.5 text-right font-serif text-[18px] tabular-nums">
              {money(total, true)}
            </td>
          </tr>
        </tfoot>
      </table>

      <footer className="mt-2 space-y-2 border-t border-line pt-4 text-[11.5px] text-muted">
        <p>
          {TEMPLE.name} is a tax-exempt organization under section 501(c)(3) of the Internal Revenue
          Code. Contributions are deductible to the extent allowed by law.
        </p>
        <p>
          <strong className="text-ink">No goods or services</strong> were provided by the temple in
          exchange for these contributions, other than intangible religious benefits. Retain this
          statement for your records.
        </p>
        <p className="pt-2 italic">
          Prototype preview — not a valid tax document. No PDF is generated.
        </p>
      </footer>
    </div>
  )
}
