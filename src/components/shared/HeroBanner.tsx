import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import type { TempleEvent } from '@/lib/data/types'
import { Button, buttonVariants } from '@/components/ui/button'
import { DeityArt } from './DeityArt'
import { cn, fmtDate } from '@/lib/utils'

/** Auto-advancing hero. Pauses on hover so a reader is never rushed off a slide. */
export function HeroBanner({ events, className }: { events: TempleEvent[]; className?: string }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = events.length

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count])

  useEffect(() => {
    if (paused || count < 2) return
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 6000)
    return () => clearInterval(t)
  }, [paused, count])

  if (count === 0) return null
  const event = events[Math.min(index, count - 1)]!

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[14px] border border-line shadow-[var(--shadow-lg)]',
        className,
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Upcoming festivals"
    >
      <DeityArt
        key={event.id}
        deity={event.title.includes('Navaratri') ? 'Durga' : 'Meenakshi'}
        className="absolute inset-0 h-full w-full"
        label={`${event.title} banner`}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/45 to-transparent" />

      <div className="relative flex min-h-[300px] flex-col justify-end gap-3 p-6 sm:min-h-[360px] sm:p-9">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium text-white backdrop-blur">
          <CalendarDays className="size-3.5" />
          {fmtDate(event.date, 'EEEE, MMMM d, yyyy')}
        </span>

        <h1 className="max-w-2xl font-serif text-[32px] leading-[1.1] text-white sm:text-[40px]">
          {event.title}
        </h1>
        <p className="max-w-xl text-[14.5px] leading-relaxed text-white/85 line-clamp-2">
          {event.description}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2.5">
          <Link to={`/events/${event.slug}`} className={buttonVariants({ size: 'lg' })}>
            Sponsor now
          </Link>
          <Link
            to="/calendar"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'lg' }),
              'border-white/50 bg-white/10 text-white hover:bg-white/20',
            )}
          >
            See the full calendar
          </Link>
        </div>
      </div>

      {count > 1 ? (
        <>
          <div className="absolute bottom-5 right-5 hidden gap-1.5 sm:flex">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous festival"
              onClick={() => go(-1)}
              className="border-white/40 bg-white/10 text-white hover:bg-white/25"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next festival"
              onClick={() => go(1)}
              className="border-white/40 bg-white/10 text-white hover:bg-white/25"
            >
              <ChevronRight />
            </Button>
          </div>
          <div className="absolute bottom-4 left-4 flex items-center sm:left-7">
            {events.map((e, i) => (
              <button
                key={e.id}
                type="button"
                aria-label={`Show ${e.title}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                // The dot stays 6px; the button carries a 28px square tap target around it.
                className="grid size-7 place-items-center"
              >
                <span
                  className={cn(
                    'block h-1.5 rounded-full transition-all',
                    i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80',
                  )}
                />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}
