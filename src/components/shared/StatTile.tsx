import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StatTileProps {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  Icon?: LucideIcon
  trend?: { value: string; direction: 'up' | 'down' }
  tone?: 'default' | 'brand' | 'gold' | 'leaf'
  className?: string
}

const TONE_RING: Record<NonNullable<StatTileProps['tone']>, string> = {
  default: 'border-line bg-card',
  brand: 'border-brand-500/25 bg-brand-500/[0.06]',
  gold: 'border-gold-500/30 bg-gold-500/[0.08]',
  leaf: 'border-leaf-500/25 bg-leaf-500/[0.07]',
}

const TONE_ICON: Record<NonNullable<StatTileProps['tone']>, string> = {
  default: 'bg-tint text-brand-500',
  brand: 'bg-brand-500/12 text-brand-600',
  gold: 'bg-gold-500/15 text-gold-600',
  leaf: 'bg-leaf-500/12 text-leaf-600',
}

export function StatTile({
  label,
  value,
  sub,
  Icon,
  trend,
  tone = 'default',
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        'rounded-[10px] border p-4 shadow-[var(--shadow-sm)]',
        TONE_RING[tone],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">
          {label}
        </p>
        {Icon ? (
          <span className={cn('grid size-7 place-items-center rounded-md', TONE_ICON[tone])}>
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 font-serif text-[26px] leading-none text-ink">{value}</p>
      <div className="mt-1.5 flex items-center gap-2">
        {sub ? <p className="text-[12.5px] text-muted">{sub}</p> : null}
        {trend ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[12px] font-medium',
              trend.direction === 'up' ? 'text-leaf-500' : 'text-brand-500',
            )}
          >
            {trend.direction === 'up' ? (
              <TrendingUp className="size-3.5" />
            ) : (
              <TrendingDown className="size-3.5" />
            )}
            {trend.value}
          </span>
        ) : null}
      </div>
    </div>
  )
}
