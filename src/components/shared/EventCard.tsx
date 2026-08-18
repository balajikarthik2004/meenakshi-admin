import { Link } from 'react-router-dom'
import { Ticket, Users } from 'lucide-react'
import type { TempleEvent } from '@/lib/data/types'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { BreakEvenMeter } from './BreakEvenMeter'
import { DeityArt } from './DeityArt'
import { cn, fmtDate, money } from '@/lib/utils'

export function EventCard({
  event,
  showMeter = false,
  to,
  className,
}: {
  event: TempleEvent
  showMeter?: boolean
  /** Override the destination — the admin event editor previews the card off-route. */
  to?: string
  className?: string
}) {
  const date = new Date(event.date)

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-[10px] border border-line bg-card shadow-[var(--shadow)] transition-shadow hover:shadow-[var(--shadow-lg)]',
        className,
      )}
    >
      <div className="relative">
        <DeityArt
          deity={event.title.includes('Navaratri') ? 'Durga' : 'Meenakshi'}
          className="h-24 w-full"
          label={`${event.title} flyer`}
        />
        <div className="absolute right-3 top-3 rounded-[8px] border border-line bg-card px-2.5 py-1 text-center shadow-[var(--shadow-sm)]">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-500">
            {fmtDate(date, 'MMM')}
          </span>
          <span className="block font-serif text-[18px] leading-none text-ink">
            {fmtDate(date, 'd')}
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-[17px] leading-snug">{event.title}</h3>
          {event.ticketPrice ? (
            <Badge variant="brand">
              <Ticket className="size-3" />
              {money(event.ticketPrice)}
            </Badge>
          ) : (
            <Badge variant="leaf">Free</Badge>
          )}
        </div>

        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">{event.description}</p>

        {showMeter ? (
          <BreakEvenMeter
            target={event.targetAmount}
            collected={event.collectedAmount}
            label="Festival budget"
            compact
            className="mt-1"
          />
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
            <Users className="size-3.5" />
            {event.rsvpCount} attending
          </span>
          <Link
            to={to ?? `/events/${event.slug}`}
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  )
}
