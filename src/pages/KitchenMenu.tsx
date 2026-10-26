import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Flame, Leaf, Nut, UtensilsCrossed } from 'lucide-react'
import type { MenuItem } from '@/lib/data/types'
import { PageShell } from '@/components/layout/PageShell'
import { StatTile } from '@/components/shared/StatTile'
import { LoadingSkeleton } from '@/components/shared/states'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Chips } from '@/components/ui/tabs'
import { Table, TBody, TD, TH, THead, TR, TableWrap } from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { listMenu, setMenuItemAvailability } from '@/lib/data/api'
import { MENU_CATEGORIES } from '@/lib/data/mock'
import { useAsync } from '@/lib/hooks'
import {
  DAY_NAMES,
  KITCHEN_WINDOWS,
  MEAL_LABEL,
  fmtClock,
  kitchenStatusAt,
  lastOrderMinute,
  toMinutes,
  windowsFor,
} from '@/lib/kitchen'
import { cn, money, titleCase } from '@/lib/utils'

/**
 * The board, and the hours it is cooked in.
 *
 * One switch per dish, and it does the one thing a kitchen needs mid-service: takes
 * something off the board when it runs out. That change reaches the devotee site
 * immediately, which is the point — a devotee ordering the last dosa twenty minutes
 * after the batter ran out is a phone call and an apology, and this is how it is
 * avoided.
 *
 * Service times are shown but not editable here. They are a published commitment the
 * temple office makes, changed deliberately in `@/lib/kitchen` rather than by anyone
 * who happens to have this page open during a rush.
 */
export default function KitchenMenu() {
  const { toast } = useToast()
  const [category, setCategory] = useState('all')
  const { data, loading, refresh } = useAsync(() => listMenu(), [])

  const menu = useMemo(() => data ?? [], [data])
  const shown = menu.filter((m) => (category === 'all' ? true : m.category === category))
  const status = kitchenStatusAt()

  const offBoard = menu.filter((m) => !m.available).length

  const toggle = async (item: MenuItem) => {
    await setMenuItemAvailability(item.id, !item.available)
    toast(item.available ? `${item.name} taken off the board` : `${item.name} back on the board`, {
      detail: item.available
        ? 'Devotees can no longer order it.'
        : 'It is orderable again at the services it is cooked for.',
    })
    refresh()
  }

  return (
    <PageShell
      eyebrow="Cafeteria"
      title="Menu &amp; availability"
      description={`${menu.length} dishes · ${offBoard} currently off the board`}
      tabs={
        <Chips
          items={[
            { key: 'all', label: 'All' },
            ...MENU_CATEGORIES.map((c) => ({ key: c.key, label: c.label })),
          ]}
          value={category}
          onChange={setCategory}
        />
      }
      actions={
        <Link to="/kitchen" className="text-sm font-medium text-brand-600 hover:underline">
          Back to the kitchen board
        </Link>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Kitchen right now"
          value={status.serving ? 'Open' : 'Closed'}
          sub={
            status.current
              ? `${MEAL_LABEL[status.current.meal]} until ${fmtClock(toMinutes(status.current.closes))}`
              : status.next
                ? `Next: ${DAY_NAMES[status.next.date.getDay()]} ${fmtClock(toMinutes(status.next.window.opens))}`
                : 'No further services'
          }
          Icon={UtensilsCrossed}
          tone={status.serving ? 'leaf' : 'default'}
        />
        <StatTile
          label="Online orders"
          value={status.ordering ? 'Accepting' : 'Closed'}
          sub={
            status.ordering && status.current
              ? `Until ${fmtClock(lastOrderMinute(status.current))}`
              : 'The site is not taking tickets'
          }
          tone={status.ordering ? 'leaf' : 'gold'}
        />
        <StatTile
          label="Off the board"
          value={offBoard}
          sub="Sold out or not cooked today"
          tone={offBoard > 0 ? 'brand' : 'default'}
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className="min-w-0">
          {loading ? (
            <LoadingSkeleton variant="table" rows={8} />
          ) : (
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>Dish</TH>
                    <TH>Served at</TH>
                    <TH>Prep</TH>
                    <TH className="text-right">Price</TH>
                    <TH className="text-center">On the board</TH>
                  </TR>
                </THead>
                <TBody>
                  {shown.map((item) => (
                    <TR key={item.id} className={cn(!item.available && 'opacity-60')}>
                      <TD>
                        <div className="min-w-0">
                          <p className="font-medium text-ink">
                            {item.name}
                            {item.tamilName ? (
                              <span className="ml-1.5 text-sm font-normal text-muted">
                                {item.tamilName}
                              </span>
                            ) : null}
                          </p>
                          <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
                            {titleCase(item.category)}
                            {item.noOnionGarlic ? <Leaf className="size-3 text-leaf-600" /> : null}
                            {item.spicy ? <Flame className="size-3 text-brand-500" /> : null}
                            {item.containsNuts ? <Nut className="size-3 text-faint" /> : null}
                            {item.servedOn ? (
                              <span className="text-faint">
                                · {item.servedOn.map((d) => DAY_NAMES[d]?.slice(0, 3)).join(', ')}{' '}
                                only
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </TD>
                      <TD>
                        <span className="flex flex-wrap gap-1">
                          {item.servedAt.map((m) => (
                            <Badge key={m} variant="neutral">
                              {MEAL_LABEL[m].replace(' tiffin', '')}
                            </Badge>
                          ))}
                        </span>
                      </TD>
                      <TD className="whitespace-nowrap text-muted">{item.prepMinutes} min</TD>
                      <TD className="text-right font-medium tabular-nums">
                        {money(item.price, true)}
                      </TD>
                      <TD align="center">
                        {/* A switch rather than a row of buttons: this gets tapped
                            mid-service with one hand, and it is reversible. */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={item.available}
                          aria-label={`${item.name} on the board`}
                          onClick={() => toggle(item)}
                          className={cn(
                            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                            item.available ? 'bg-leaf-500' : 'bg-line',
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block size-5 rounded-full bg-white shadow transition-transform',
                              item.available ? 'translate-x-[22px]' : 'translate-x-0.5',
                            )}
                          />
                        </button>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          )}
        </div>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-line bg-tint/50 px-5 py-3.5">
            <CalendarClock className="size-4 text-brand-500" />
            <h2 className="font-serif text-lg">Published service times</h2>
          </div>
          <ul className="divide-y divide-line">
            {DAY_NAMES.map((day, i) => {
              const windows = windowsFor(i)
              const isToday = i === new Date().getDay()
              return (
                <li
                  key={day}
                  className={cn(
                    'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-2.5 text-base',
                    isToday && 'bg-saffron-400/[0.08]',
                  )}
                >
                  <span className={cn('font-medium', isToday ? 'text-ink' : 'text-muted')}>
                    {day}
                    {isToday ? (
                      <span className="ml-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">
                        Today
                      </span>
                    ) : null}
                  </span>
                  {windows.length === 0 ? (
                    <span className="text-muted">Closed</span>
                  ) : (
                    <span className="text-right text-muted">
                      {windows.map((w) => (
                        <span key={w.meal} className="block tabular-nums">
                          {fmtClock(toMinutes(w.opens))} – {fmtClock(toMinutes(w.closes))}
                          <span className="ml-1.5 text-sm">
                            {MEAL_LABEL[w.meal].toLowerCase()}, last order{' '}
                            {fmtClock(lastOrderMinute(w))}
                          </span>
                        </span>
                      ))}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="border-t border-line px-5 py-3 text-sm leading-relaxed text-muted">
            Online ordering opens and closes with these times — outside them the devotee site shows
            the next service instead of a basket. There are {KITCHEN_WINDOWS.length} services in the
            week. Changing them is a published commitment, so it is done in the code rather than
            from this screen.
          </p>
        </Card>
      </div>
    </PageShell>
  )
}
