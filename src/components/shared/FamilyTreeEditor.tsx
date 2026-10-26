import { useState, type ReactNode } from 'react'
import { Plus, Trash2, UserRound } from 'lucide-react'
import type { FamilyMember } from '@/lib/data/types'
import { GOTHRAS, NAKSHATRAS } from '@/lib/data/mock'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/input'
import { Dialog } from '@/components/ui/overlay'
import { Avatar, Badge } from '@/components/ui/badge'
import { EmptyState } from './states'
import { cn, titleCase } from '@/lib/utils'

const RELATIONS: FamilyMember['relation'][] = ['spouse', 'son', 'daughter', 'parent', 'other']

const blank = (): FamilyMember => ({ name: '', relation: 'spouse', nakshatra: '', gothra: '' })

/**
 * The chart is drawn at fixed widths rather than letting the cards size to their
 * contents. A generational tree only reads as one if the tiers line up, and a row of
 * cards that each took their own width would put the descent line somewhere different
 * on every tier. `SPOUSE_SPAN` is what the devotee has to be offset by to stay on the
 * spine once a spouse is sitting beside them — see the couple row below.
 */
const CARD_W = 208
const LINK_W = 32
const SPOUSE_SPAN = CARD_W + LINK_W

type Seat = { m: FamilyMember; i: number }

/** Avatar hue and badge weight per generation, so a tier reads before it is read. */
const TONE: Record<FamilyMember['relation'], 'brand' | 'gold' | 'leaf'> = {
  parent: 'brand',
  spouse: 'gold',
  son: 'leaf',
  daughter: 'leaf',
  other: 'brand',
}
const BADGE: Record<FamilyMember['relation'], 'brand' | 'gold' | 'leaf' | 'neutral'> = {
  parent: 'brand',
  spouse: 'gold',
  son: 'leaf',
  daughter: 'leaf',
  other: 'neutral',
}

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase() || '?'

export function FamilyTreeEditor({
  members,
  onChange,
  readOnly = false,
  self,
}: {
  members: FamilyMember[]
  onChange: (members: FamilyMember[]) => void
  readOnly?: boolean
  /** The devotee the tree hangs from. Drawn as the root card. */
  self?: { name: string; nakshatra?: string; gothra?: string }
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<FamilyMember>(blank())

  const save = () => {
    if (!draft.name.trim()) return
    onChange([...members, { ...draft, name: draft.name.trim() }])
    setDraft(blank())
    setOpen(false)
  }

  // Indices are carried through the grouping because removal still addresses the
  // original flat array — the tree is a view of it, not a second copy.
  const seats: Seat[] = members.map((m, i) => ({ m, i }))
  const parents = seats.filter((s) => s.m.relation === 'parent')
  const spouses = seats.filter((s) => s.m.relation === 'spouse')
  const children = seats.filter((s) => s.m.relation === 'son' || s.m.relation === 'daughter')
  const others = seats.filter((s) => s.m.relation === 'other')

  const remove = (i: number) => onChange(members.filter((_, j) => j !== i))
  const rootName = self?.name?.trim() || 'This devotee'

  return (
    <div className="space-y-3">
      {members.length === 0 ? (
        <EmptyState
          Icon={UserRound}
          title="No family members yet"
          detail="Add the spouse, children and parents so their names can be included in every sankalpam."
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-line bg-gradient-to-b from-tint/55 to-card p-4 sm:p-6">
          {/* `w-max` over the whole chart rather than per tier: scrolling each tier
              separately let them slide out of line with one another, and a descent
              line that lands beside the card it belongs to is worse than a scrollbar. */}
          <div className="mx-auto w-max min-w-full px-1 py-0.5">
            {parents.length > 0 ? (
              <>
                <Rail label="Parents">
                  <Tier seats={parents} arms="below" readOnly={readOnly} onRemove={remove} />
                </Rail>
                <Rail>
                  <Spine />
                </Rail>
              </>
            ) : null}

            <Rail label="Devotee">
              <div className="flex min-w-max items-center justify-center">
                {/* Offsets the root back onto the spine so the descent from the parents
                  and the descent to the children land on the devotee, not in the gap
                  between the couple. */}
                {spouses.length > 0 ? (
                  <div
                    aria-hidden
                    className="shrink-0"
                    style={{ width: spouses.length * SPOUSE_SPAN }}
                  />
                ) : null}
                <PersonCard
                  name={rootName}
                  detail={detailOf(self)}
                  badge="Devotee"
                  badgeVariant="solid"
                  tone="brand"
                  root
                />
                {spouses.map(({ m, i }) => (
                  <div key={`${m.name}-${i}`} className="flex shrink-0 items-center">
                    <Knot />
                    <PersonCard
                      name={m.name}
                      detail={detailOf(m)}
                      badge={titleCase(m.relation)}
                      badgeVariant={BADGE[m.relation]}
                      tone={TONE[m.relation]}
                      onRemove={readOnly ? undefined : () => remove(i)}
                    />
                  </div>
                ))}
              </div>
            </Rail>

            {children.length > 0 ? (
              <>
                <Rail>
                  <Spine />
                </Rail>
                <Rail label="Children">
                  <Tier seats={children} arms="above" readOnly={readOnly} onRemove={remove} />
                </Rail>
              </>
            ) : null}

            {others.length > 0 ? (
              <div className="mt-6 border-t border-dashed border-hairline pt-5">
                <p className="mb-3 text-center text-2xs font-semibold uppercase tracking-[0.08em] text-faint">
                  Extended family
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {others.map(({ m, i }) => (
                    <PersonCard
                      key={`${m.name}-${i}`}
                      name={m.name}
                      detail={detailOf(m)}
                      badge={titleCase(m.relation)}
                      badgeVariant={BADGE[m.relation]}
                      tone={TONE[m.relation]}
                      onRemove={readOnly ? undefined : () => remove(i)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {!readOnly ? (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          <Plus />
          Add family member
        </Button>
      ) : null}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add a family member"
        description="They'll be offered as a one-tap name in every sankalpam you sponsor."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!draft.name.trim()}>
              Add to family tree
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" htmlFor="fm-name" className="sm:col-span-2">
            <Input
              id="fm-name"
              value={draft.name}
              autoFocus
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. Aditya Krishnan"
            />
          </Field>
          <Field label="Relation" htmlFor="fm-rel">
            <Select
              id="fm-rel"
              value={draft.relation}
              onChange={(e) =>
                setDraft({ ...draft, relation: e.target.value as FamilyMember['relation'] })
              }
            >
              {RELATIONS.map((r) => (
                <option key={r} value={r}>
                  {titleCase(r)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nakshatra" htmlFor="fm-nak">
            <Select
              id="fm-nak"
              value={draft.nakshatra}
              onChange={(e) => setDraft({ ...draft, nakshatra: e.target.value })}
            >
              <option value="">Not known</option>
              {NAKSHATRAS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Gothra" htmlFor="fm-got" className="sm:col-span-2">
            <Select
              id="fm-got"
              value={draft.gothra}
              onChange={(e) => setDraft({ ...draft, gothra: e.target.value })}
            >
              <option value="">Not known</option>
              {GOTHRAS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Dialog>
    </div>
  )
}

/* ------------------------------------------------------------------ chart */

const detailOf = (p?: { nakshatra?: string; gothra?: string }) =>
  [p?.nakshatra, p?.gothra && `${p.gothra} gothra`].filter(Boolean).join(' · ')

/**
 * One tier of the chart, with the generation label in a gutter beside it.
 *
 * The same gutter is reserved on both sides at every tier, so the tree stays centred
 * in the panel and the descent lines stack into one straight spine. Below `lg` the
 * labels go and the gutters collapse — the badge on each card already says what the
 * person is, and on a narrow screen the width is worth more.
 */
function Rail({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="flex items-center">
      <div className="hidden w-20 shrink-0 pr-4 text-right lg:block">
        {label ? (
          <span className="text-2xs font-semibold uppercase tracking-[0.08em] text-faint">
            {label}
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
      <div className="hidden w-20 shrink-0 lg:block" />
    </div>
  )
}

/** The vertical run between two tiers. */
const Spine = () => (
  <div className="flex justify-center">
    <span aria-hidden className="h-6 w-px bg-hairline" />
  </div>
)

/** The marriage link: a hairline with a small gold knot on it. */
const Knot = () => (
  <div aria-hidden className="relative flex h-px shrink-0 items-center" style={{ width: LINK_W }}>
    <span className="h-px w-full bg-hairline" />
    <span className="absolute left-1/2 size-[7px] -translate-x-1/2 rotate-45 rounded-[1px] border border-gold-500/60 bg-gold-500/25" />
  </div>
)

/**
 * A row of siblings on a shared bus.
 *
 * The bus is drawn from the cards themselves rather than as one element: each card
 * carries the half-rule on its left and the half-rule on its right, and the outermost
 * halves are hidden. That way the rule always runs exactly from the first card's
 * centre to the last one's, whatever the count, with no measuring.
 */
function Tier({
  seats,
  arms,
  readOnly,
  onRemove,
}: {
  seats: Seat[]
  /** `above` — the bus sits over the cards (children). `below` — under them (parents). */
  arms: 'above' | 'below'
  readOnly: boolean
  onRemove: (i: number) => void
}) {
  const edge = arms === 'above' ? 'top-0' : 'bottom-0'
  return (
    <ul className="flex min-w-max items-start justify-center">
      {seats.map(({ m, i }) => (
        <li
          key={`${m.name}-${i}`}
          className={cn(
            'relative shrink-0 px-2',
            arms === 'above' ? 'pt-6' : 'pb-6',
            "before:absolute before:right-1/2 before:h-px before:w-1/2 before:bg-hairline before:content-['']",
            "after:absolute after:left-1/2 after:h-px after:w-1/2 after:bg-hairline after:content-['']",
            arms === 'above' ? 'before:top-0 after:top-0' : 'before:bottom-0 after:bottom-0',
            'first:before:invisible last:after:invisible',
          )}
        >
          <span
            aria-hidden
            className={cn('absolute left-1/2 h-6 w-px -translate-x-1/2 bg-hairline', edge)}
          />
          <PersonCard
            name={m.name}
            detail={detailOf(m)}
            badge={titleCase(m.relation)}
            badgeVariant={BADGE[m.relation]}
            tone={TONE[m.relation]}
            onRemove={readOnly ? undefined : () => onRemove(i)}
          />
        </li>
      ))}
    </ul>
  )
}

function PersonCard({
  name,
  detail,
  badge,
  badgeVariant,
  tone,
  root = false,
  onRemove,
}: {
  name: string
  detail: string
  badge: string
  badgeVariant: 'brand' | 'gold' | 'leaf' | 'neutral' | 'solid'
  tone: 'brand' | 'gold' | 'leaf'
  root?: boolean
  onRemove?: () => void
}) {
  return (
    <div
      style={{ width: CARD_W }}
      className={cn(
        'shrink-0 rounded-[var(--radius-lg)] border bg-card p-3 shadow-[var(--shadow-xs)]',
        'transition-shadow duration-150 hover:shadow-[var(--shadow-sm)]',
        root ? 'border-brand-500/35 ring-1 ring-brand-500/12' : 'border-line',
      )}
    >
      <div className="flex items-center gap-2.5">
        <Avatar initials={initialsOf(name)} tone={tone} className="size-8 text-xs" />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink" title={name}>
          {name}
        </p>
      </div>
      {/* On its own full-width line rather than beside the avatar: a gothra and a
          nakshatra together run longer than the space left over by an avatar, and a
          card that wrapped to a second line stopped matching the height of its
          siblings — which is the one thing a tier of cards must not do. */}
      <p className="mt-2 truncate text-xs text-muted" title={detail}>
        {detail || 'No nakshatra recorded'}
      </p>
      <div className="mt-2 flex h-8 items-center justify-between gap-2">
        <Badge variant={badgeVariant}>{badge}</Badge>
        {onRemove ? (
          <Button
            variant="plain"
            size="icon-sm"
            aria-label={`Remove ${name}`}
            className="-mr-1 text-faint hover:text-brand-600"
            onClick={onRemove}
          >
            <Trash2 />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
