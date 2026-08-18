import { useEffect, useState } from 'react'
import { Scale, Target, Wallet } from 'lucide-react'
import { getTransparencySnapshot } from '@/lib/data/api'
import type { TransparencySnapshot } from '@/lib/data/types'
import { Progress, Skeleton } from '@/components/ui/badge'
import { cn, money } from '@/lib/utils'

const TILES = [
  { key: 'ytdCollected', label: 'YTD Collected', Icon: Wallet, tone: 'leaf' },
  { key: 'annualTarget', label: 'Annual Target', Icon: Target, tone: 'gold' },
  { key: 'balanceToBreakeven', label: 'Balance to Break-even', Icon: Scale, tone: 'brand' },
] as const

/** The public promise on the homepage: three numbers, no interpretation needed. */
export function TransparencyStrip({ className }: { className?: string }) {
  const [snap, setSnap] = useState<TransparencySnapshot | null>(null)

  useEffect(() => {
    getTransparencySnapshot().then(setSnap)
  }, [])

  return (
    <section
      className={cn(
        'rounded-[14px] border border-line bg-card p-5 shadow-[var(--shadow)]',
        className,
      )}
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-[20px]">Where your offering goes</h2>
        <p className="text-[12px] uppercase tracking-[0.08em] text-muted">
          Updated nightly · full transparency
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {TILES.map(({ key, label, Icon, tone }) => (
          <div
            key={key}
            className={cn(
              'rounded-[10px] border p-4',
              tone === 'leaf' && 'border-leaf-500/25 bg-leaf-500/[0.07]',
              tone === 'gold' && 'border-gold-500/30 bg-gold-500/[0.08]',
              tone === 'brand' && 'border-brand-500/25 bg-brand-500/[0.06]',
            )}
          >
            <div className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">
              <Icon
                className={cn(
                  'size-4',
                  tone === 'leaf' && 'text-leaf-500',
                  tone === 'gold' && 'text-gold-600',
                  tone === 'brand' && 'text-brand-500',
                )}
              />
              {label}
            </div>
            {snap ? (
              <p className="mt-2 font-serif text-[28px] leading-none text-ink">
                {money(snap[key])}
              </p>
            ) : (
              <Skeleton className="mt-2 h-7 w-28" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-4">
        <Progress
          value={snap?.achievedPct ?? 0}
          tone="leaf"
          label={`${snap?.achievedPct ?? 0}% of the annual operating target raised`}
        />
        <p className="mt-1.5 text-[12.5px] text-muted">
          {snap ? `${snap.achievedPct}% of this year’s operating target raised.` : 'Loading…'} Every
          dollar is reported to the board monthly and published in the annual report.
        </p>
      </div>
    </section>
  )
}
