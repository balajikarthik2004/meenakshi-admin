import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Image, Plus, Save, Trash2, Users } from 'lucide-react'
import type { EventCost, TempleEvent } from '@/lib/data/types'
import { PageHeader } from '@/components/layout/AdminLayout'
import { BreakEvenMeter } from '@/components/shared/BreakEvenMeter'
import { EventCard } from '@/components/shared/EventCard'
import { StatusPill } from '@/components/shared/badges'
import { LoadingSkeleton } from '@/components/shared/states'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, Input, Textarea } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { getEventById, saveEvent } from '@/lib/data/api'
import { useAsync } from '@/lib/hooks'
import { fmtDate, money } from '@/lib/utils'

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const blankEvent = (): TempleEvent => {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return {
    id: `evt_${Date.now()}`,
    title: '',
    slug: '',
    date: date.toISOString(),
    description: '',
    targetAmount: 15000,
    collectedAmount: 0,
    costs: [{ label: 'Flowers & garlands', amount: 2500 }],
    rsvpCount: 0,
    status: 'upcoming',
  }
}

export default function EventEditor({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [form, setForm] = useState<TempleEvent>(blankEvent())
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')

  const { data, loading } = useAsync(
    async () => (mode === 'edit' && id ? getEventById(id) : null),
    [mode, id],
  )

  useEffect(() => {
    if (data) {
      setForm(data)
      setSlugTouched(true)
    }
  }, [data])

  const set = <K extends keyof TempleEvent>(k: K, v: TempleEvent[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const setCost = (i: number, patch: Partial<EventCost>) =>
    setForm((f) => ({
      ...f,
      costs: f.costs.map((c, j) => (j === i ? { ...c, ...patch } : c)),
    }))

  const totalCost = form.costs.reduce((s, c) => s + c.amount, 0)

  const save = async () => {
    const slug = form.slug || slugify(form.title)
    await saveEvent({ ...form, slug })
    toast(mode === 'create' ? 'Event created' : 'Event updated', {
      detail: `${form.title} is live on the devotee homepage banner.`,
    })
    navigate('/events')
  }

  if (mode === 'edit' && loading) {
    return (
      <>
        <PageHeader title="Edit event" subtitle="Loading…" />
        <LoadingSkeleton variant="table" rows={5} />
      </>
    )
  }

  if (mode === 'edit' && !data) {
    return (
      <>
        <PageHeader title="Event not found" />
        <Link to="/events" className={buttonVariants({ size: 'sm' })}>
          Back to events
        </Link>
      </>
    )
  }

  return (
    <>
      <Link
        to="/events"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        All events
      </Link>

      <PageHeader
        title={mode === 'create' ? 'New event' : `Edit ${data?.title}`}
        subtitle="Everything here — including the cost breakdown — is visible to devotees."
        actions={
          <Button onClick={save} disabled={!form.title.trim()}>
            <Save />
            {mode === 'create' ? 'Create event' : 'Save changes'}
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr] xl:items-start">
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-serif text-[18px]">Basics</h2>
            <div className="mt-3 grid gap-4">
              <Field label="Title" htmlFor="ev-title">
                <Input
                  id="ev-title"
                  value={form.title}
                  autoFocus
                  onChange={(e) => {
                    set('title', e.target.value)
                    if (!slugTouched) set('slug', slugify(e.target.value))
                  }}
                  placeholder="e.g. Karthigai Deepam"
                />
              </Field>

              <Field
                label="URL slug"
                htmlFor="ev-slug"
                hint={`/events/${form.slug || 'your-slug'}`}
              >
                <Input
                  id="ev-slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    set('slug', slugify(e.target.value))
                  }}
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Start date" htmlFor="ev-date">
                  <Input
                    id="ev-date"
                    type="date"
                    value={form.date.slice(0, 10)}
                    onChange={(e) => set('date', new Date(e.target.value).toISOString())}
                  />
                </Field>
                <Field label="End date" htmlFor="ev-end" hint="optional">
                  <Input
                    id="ev-end"
                    type="date"
                    value={form.endDate ? form.endDate.slice(0, 10) : ''}
                    onChange={(e) =>
                      set(
                        'endDate',
                        e.target.value ? new Date(e.target.value).toISOString() : undefined,
                      )
                    }
                  />
                </Field>
              </div>

              <Field label="Description" htmlFor="ev-desc">
                <Textarea
                  id="ev-desc"
                  rows={5}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="What happens, who it is for, and what a sponsor makes possible."
                />
              </Field>

              <Field
                label={
                  <span className="flex items-center gap-1.5">
                    <Image className="size-3.5" />
                    Flyer URL
                  </span>
                }
                htmlFor="ev-flyer"
                hint="paste a link — no upload in the prototype"
              >
                <Input
                  id="ev-flyer"
                  value={form.flyerUrl ?? ''}
                  onChange={(e) => set('flyerUrl', e.target.value || undefined)}
                  placeholder="https://…"
                />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-serif text-[18px]">Money</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="Target amount" htmlFor="ev-target">
                <Input
                  id="ev-target"
                  type="number"
                  min={0}
                  value={form.targetAmount}
                  onChange={(e) => set('targetAmount', Number(e.target.value) || 0)}
                />
              </Field>
              <Field label="Collected so far" htmlFor="ev-collected">
                <Input
                  id="ev-collected"
                  type="number"
                  min={0}
                  value={form.collectedAmount}
                  onChange={(e) => set('collectedAmount', Number(e.target.value) || 0)}
                />
              </Field>
              <Field label="Ticket price" htmlFor="ev-ticket" hint="blank = free">
                <Input
                  id="ev-ticket"
                  type="number"
                  min={0}
                  value={form.ticketPrice ?? ''}
                  onChange={(e) =>
                    set('ticketPrice', e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-serif text-[18px]">Cost line items</h2>
              <span className="text-[13px] text-muted">{money(totalCost)} total direct cost</span>
            </div>
            <ul className="mt-3 space-y-2">
              {form.costs.map((c, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Input
                    value={c.label}
                    aria-label={`Cost label ${i + 1}`}
                    onChange={(e) => setCost(i, { label: e.target.value })}
                    placeholder="e.g. Annadanam catering"
                  />
                  <Input
                    type="number"
                    min={0}
                    aria-label={`Cost amount ${i + 1}`}
                    value={c.amount}
                    onChange={(e) => setCost(i, { amount: Number(e.target.value) || 0 })}
                    className="w-[130px]"
                  />
                  <Button
                    variant="plain"
                    size="icon"
                    aria-label={`Remove cost ${i + 1}`}
                    onClick={() =>
                      set(
                        'costs',
                        form.costs.filter((_, j) => j !== i),
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => set('costs', [...form.costs, { label: '', amount: 0 }])}
            >
              <Plus />
              Add line item
            </Button>
            {totalCost > form.targetAmount ? (
              <p className="mt-3 rounded-md border border-brand-500/30 bg-brand-500/[0.06] p-2.5 text-[12.5px] text-brand-600">
                Costs exceed the fundraising target by {money(totalCost - form.targetAmount)}. Raise
                the target or trim a line item before publishing.
              </p>
            ) : null}
          </Card>
        </div>

        <div className="space-y-5 xl:sticky xl:top-6">
          <Card className="p-5">
            <h2 className="font-serif text-[18px]">Break-even</h2>
            <BreakEvenMeter
              className="mt-3"
              target={form.targetAmount}
              collected={form.collectedAmount}
              label="Raised vs target"
            />
            <dl className="mt-4 space-y-2 border-t border-line pt-3 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Direct costs</dt>
                <dd className="font-medium tabular-nums">{money(totalCost)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Surplus if target met</dt>
                <dd className="font-medium tabular-nums">{money(form.targetAmount - totalCost)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">RSVPs</dt>
                <dd className="flex items-center gap-1.5 font-medium">
                  <Users className="size-3.5 text-muted" />
                  {form.rsvpCount}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Status</dt>
                <dd>
                  <StatusPill status={form.status} />
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Publishes as</dt>
                <dd className="font-medium">{fmtDate(form.date, 'EEE, MMM d, yyyy')}</dd>
              </div>
            </dl>
          </Card>

          <div>
            <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">
              Devotee preview
            </p>
            <EventCard
              event={{ ...form, title: form.title || 'Untitled event' }}
              showMeter
              to="#"
            />
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              This card is what appears on the devotee homepage and events index. Upcoming events
              also rotate through the homepage hero banner.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
