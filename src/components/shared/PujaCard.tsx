import { Clock, Repeat } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PujaCatalogItem } from '@/lib/data/types'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { DeityArt } from './DeityArt'
import { cn, money, titleCase } from '@/lib/utils'

export function PujaCard({
  puja,
  to,
  onSponsor,
  className,
}: {
  puja: PujaCatalogItem
  to?: string
  onSponsor?: () => void
  className?: string
}) {
  const href = to ?? `/puja/book/${puja.id}`

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-[10px] border border-line bg-card shadow-[var(--shadow)] transition-shadow hover:shadow-[var(--shadow-lg)]',
        className,
      )}
    >
      <DeityArt deity={puja.deity} className="h-28 w-full" />

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-[17px] leading-snug text-ink">{puja.name}</h3>
          <Badge variant="gold">{titleCase(puja.type)}</Badge>
        </div>

        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">{puja.description}</p>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[12px] text-muted">
          <span className="inline-flex items-center gap-1">
            <Repeat className="size-3.5" />
            {puja.recurringRule ?? titleCase(puja.defaultCadence)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {puja.durationMin} min
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-3">
          <p className="font-serif text-[20px] leading-none text-ink">
            {money(puja.basePrice)}
            <span className="ml-1 text-[12px] font-sans text-muted">
              {puja.defaultCadence === 'one-time' ? 'one-time' : '/ year'}
            </span>
          </p>
          {onSponsor ? (
            <Button size="sm" onClick={onSponsor}>
              Sponsor
            </Button>
          ) : (
            <Link to={href} className={buttonVariants({ size: 'sm' })}>
              Sponsor
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
