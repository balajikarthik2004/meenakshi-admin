import type { Project } from '@/lib/data/types'
import { Progress } from '@/components/ui/badge'
import { expensesTotal, fundingPct, fundingTone, projectBalance, stillToRaise } from '@/lib/project'
import { cn, money } from '@/lib/utils'

/**
 * A project's money, in the three facts a reader actually asks for: what came in,
 * what went out, and what is left.
 *
 * Two bars rather than one, because funding and building are different questions with
 * different answers. The accessibility lift is seventy per cent built on sixty per
 * cent of its target; a single averaged bar would say sixty-five and answer neither.
 *
 * The same component renders on the public project page and in the admin register, so
 * a devotee and the board are looking at one computation rather than two that agree
 * today. Figures come from `@/lib/project`, which both apps share.
 */
export function ProjectMoneyFlow({
  project,
  compact = false,
  className,
}: {
  project: Project
  /** Bars only — for a card in a grid, where the three figures would not fit. */
  compact?: boolean
  className?: string
}) {
  const pctFunded = fundingPct(project)
  const pctBuilt = project.progressPct
  const balance = projectBalance(project)
  const remaining = stillToRaise(project)

  return (
    <div className={cn('min-w-0', className)}>
      <div className="space-y-3">
        <Bar
          label="Funding"
          pct={pctFunded}
          tone={fundingTone(project)}
          left={`${money(project.raisedAmount)} raised`}
          right={
            remaining > 0 ? `${money(remaining)} to go` : `of ${money(project.targetAmount)} — met`
          }
          a11y={`Funding — ${money(project.raisedAmount)} of ${money(project.targetAmount)} raised`}
        />
        <Bar
          label="Work completed"
          pct={pctBuilt}
          tone={pctBuilt >= 100 ? 'leaf' : 'gold'}
          left={`${Math.round(pctBuilt)}% built`}
          right={project.status === 'completed' ? 'Finished' : 'Under way'}
          a11y={`Work completed — ${Math.round(pctBuilt)} per cent`}
        />
      </div>

      {compact ? null : (
        /* Three figures that have to reconcile in the reader's head: in, out, left.
           Printed side by side so the subtraction is visible rather than implied. */
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3.5">
          <Figure label="Raised" value={money(project.raisedAmount)} />
          <Figure label="Spent" value={money(expensesTotal(project))} />
          <Figure
            label="In hand"
            value={money(balance)}
            tone={balance < 0 ? 'text-brand-600' : 'text-leaf-600'}
          />
        </dl>
      )}
    </div>
  )
}

function Bar({
  label,
  pct,
  tone,
  left,
  right,
  a11y,
}: {
  label: string
  pct: number
  tone: 'brand' | 'gold' | 'leaf'
  left: string
  right: string
  a11y: string
}) {
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="text-[12.5px] font-medium text-ink">{label}</span>
        {/* The percentage is not clamped the way the bar is: a project that raised
            104% of its target did, and rounding that down hides the overfunding. */}
        <span className="text-[12.5px] font-semibold tabular-nums text-muted">
          {Math.round(pct)}%
        </span>
      </div>
      <Progress value={pct} tone={tone} label={a11y} />
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[12px] text-muted">
        <span className="font-medium text-ink">{left}</span>
        <span>{right}</span>
      </div>
    </div>
  )
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className={cn('mt-0.5 truncate text-[16px] tabular-nums text-ink', tone)}>{value}</dd>
    </div>
  )
}
