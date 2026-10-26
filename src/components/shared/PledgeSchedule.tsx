import type { PledgeInstallment } from '@/lib/data/types'
import { Badge } from '@/components/ui/badge'
import { isOverdue } from '@/lib/pledge'
import { cn, fmtDate, money } from '@/lib/utils'

/**
 * The dates a pledge comes down to, as a list.
 *
 * A pledge is only ever as clear as its schedule, so the same rows are shown at the
 * moment it is made, on the devotee's own page afterwards, and in the office — there
 * is no second rendering of the same promise to drift out of agreement with this one.
 *
 * Lateness is stated on the row rather than only in a colour: "Overdue" beside the
 * date is the fact, and the tint is a way of finding it quickly, not the way of
 * knowing it.
 */
export function PledgeSchedule({
  installments,
  onPay,
  payingId,
  className,
}: {
  installments: PledgeInstallment[]
  /** Offered only on the earliest unpaid instalment — see `nextDue`. */
  onPay?: (installment: PledgeInstallment) => void
  payingId?: string | null
  className?: string
}) {
  const payable = onPay
    ? [...installments]
        .filter((i) => i.status === 'due')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
    : undefined

  return (
    <ol className={cn('divide-y divide-line', className)}>
      {installments.map((i, n) => {
        const late = isOverdue(i)
        return (
          <li
            key={i.id}
            className={cn(
              'flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5',
              late && 'bg-brand-500/[0.03]',
            )}
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-tint text-[11px] font-semibold tabular-nums text-muted">
              {n + 1}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-medium text-ink">
                {fmtDate(i.dueDate, 'MMMM d, yyyy')}
              </span>
              <span className="block text-[12px] text-muted">
                {i.status === 'paid' ? (
                  <>Paid {i.paidAt ? fmtDate(i.paidAt) : ''}</>
                ) : i.status === 'skipped' ? (
                  'Skipped by the temple office'
                ) : late ? (
                  'Overdue'
                ) : (
                  'Due'
                )}
              </span>
            </span>

            <span className="shrink-0 text-[13.5px] font-medium tabular-nums text-ink">
              {money(i.amount)}
            </span>

            {i.status === 'paid' ? (
              <Badge variant="leaf">Paid</Badge>
            ) : i.status === 'skipped' ? (
              <Badge variant="neutral">Skipped</Badge>
            ) : late ? (
              <Badge variant="brand">Overdue</Badge>
            ) : (
              <Badge variant="gold">Due</Badge>
            )}

            {onPay && payable?.id === i.id ? (
              <button
                type="button"
                onClick={() => onPay(i)}
                disabled={payingId === i.id}
                className="shrink-0 rounded-full border border-brand-500 px-3 py-1 text-[12.5px] font-medium text-brand-600 transition-colors hover:bg-brand-500/[0.06] disabled:opacity-60"
              >
                {payingId === i.id ? 'Processing…' : 'Pay now'}
              </button>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
