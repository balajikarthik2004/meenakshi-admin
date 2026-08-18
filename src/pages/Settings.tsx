import { useState } from 'react'
import { CreditCard, Mail, Plus, Save, Trash2 } from 'lucide-react'
import type { Role, Staff, Temple } from '@/lib/data/types'
import { PageHeader } from '@/components/layout/AdminLayout'
import { RoleBadge } from '@/components/shared/badges'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { EMAIL_TEMPLATES, STAFF, TEMPLE, TEMPLE_EIN } from '@/lib/data/mock'

const TABS = [
  { key: 'temple', label: 'Temple profile' },
  { key: 'staff', label: 'Priests & staff' },
  { key: 'roles', label: 'Roles & permissions' },
  { key: 'payments', label: 'Payment methods' },
  { key: 'email', label: 'Email templates' },
]

const PERMISSIONS = [
  { key: 'devotees', label: 'View & edit devotee records' },
  { key: 'bookings', label: 'Manage bookings and fulfilment' },
  { key: 'catalog', label: 'Edit the puja catalogue' },
  { key: 'ledger', label: 'View the donation ledger' },
  { key: 'receipts', label: 'Issue tax receipts' },
  { key: 'events', label: 'Publish events and the calendar' },
  { key: 'transparency', label: 'View financial dashboards' },
  { key: 'settings', label: 'Change temple settings' },
]

const DEFAULT_MATRIX: Record<string, Record<Role, boolean>> = Object.fromEntries(
  PERMISSIONS.map((p) => [
    p.key,
    {
      admin: true,
      priest: ['bookings', 'catalog'].includes(p.key),
      board: ['transparency', 'ledger', 'devotees'].includes(p.key),
      devotee: false,
    } as Record<Role, boolean>,
  ]),
)

export default function Settings() {
  const { toast } = useToast()
  const [tab, setTab] = useState('temple')
  const [temple, setTemple] = useState<Temple>(TEMPLE)
  const [ein, setEin] = useState(TEMPLE_EIN)
  const [staff, setStaff] = useState<Staff[]>(STAFF)
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX)
  const [templates, setTemplates] = useState(EMAIL_TEMPLATES)
  const [activeTemplate, setActiveTemplate] = useState(EMAIL_TEMPLATES[0]!.id)

  const set = (k: keyof Temple) => (e: { target: { value: string } }) =>
    setTemple((t) => ({ ...t, [k]: e.target.value }))

  const saved = (what: string) => toast(`${what} saved`, { detail: 'Stored in local state only.' })

  const template = templates.find((t) => t.id === activeTemplate)!

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Every form here is functional but writes to local state only — nothing persists."
      />

      <Tabs items={TABS} value={tab} onChange={setTab} className="mb-5" />

      {tab === 'temple' ? (
        <Card className="max-w-3xl p-5">
          <h2 className="font-serif text-[18px]">Temple profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="tp-name" className="sm:col-span-2">
              <Input id="tp-name" value={temple.name} onChange={set('name')} />
            </Field>
            <Field label="Street address" htmlFor="tp-addr" className="sm:col-span-2">
              <Input id="tp-addr" value={temple.address} onChange={set('address')} />
            </Field>
            <Field label="City" htmlFor="tp-city">
              <Input id="tp-city" value={temple.city} onChange={set('city')} />
            </Field>
            <Field label="State" htmlFor="tp-state">
              <Input id="tp-state" value={temple.state} onChange={set('state')} />
            </Field>
            <Field label="ZIP" htmlFor="tp-zip">
              <Input id="tp-zip" value={temple.zip} onChange={set('zip')} />
            </Field>
            <Field label="Timezone" htmlFor="tp-tz">
              <Select id="tp-tz" value={temple.timezone} onChange={set('timezone')}>
                <option value="America/Chicago">America/Chicago</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
              </Select>
            </Field>
            <Field label="Phone" htmlFor="tp-phone">
              <Input id="tp-phone" value={temple.phone} onChange={set('phone')} />
            </Field>
            <Field label="Email" htmlFor="tp-email">
              <Input id="tp-email" type="email" value={temple.email} onChange={set('email')} />
            </Field>
            <Field label="Morning hours" htmlFor="tp-am">
              <Input
                id="tp-am"
                value={temple.timings.morning}
                onChange={(e) =>
                  setTemple((t) => ({ ...t, timings: { ...t.timings, morning: e.target.value } }))
                }
              />
            </Field>
            <Field label="Evening hours" htmlFor="tp-pm">
              <Input
                id="tp-pm"
                value={temple.timings.evening}
                onChange={(e) =>
                  setTemple((t) => ({ ...t, timings: { ...t.timings, evening: e.target.value } }))
                }
              />
            </Field>
            <Field label="Federal EIN" htmlFor="tp-ein" hint="printed on every receipt">
              <Input id="tp-ein" value={ein} onChange={(e) => setEin(e.target.value)} />
            </Field>
            <Field label="Deities" htmlFor="tp-deities" className="sm:col-span-2">
              <Textarea
                id="tp-deities"
                rows={2}
                value={temple.deities.join(', ')}
                onChange={(e) =>
                  setTemple((t) => ({
                    ...t,
                    deities: e.target.value
                      .split(',')
                      .map((d) => d.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </Field>
          </div>
          <Button className="mt-5" onClick={() => saved('Temple profile')}>
            <Save />
            Save profile
          </Button>
        </Card>
      ) : null}

      {tab === 'staff' ? (
        <Card className="max-w-3xl">
          <div className="flex items-center justify-between gap-3 border-b border-line p-5">
            <div>
              <h2 className="font-serif text-[18px]">Priests &amp; staff</h2>
              <p className="mt-0.5 text-[12.5px] text-muted">
                Officiant names appear on every fulfilled occurrence and the archana roster.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                setStaff((s) => [
                  ...s,
                  {
                    id: `stf_${Date.now()}`,
                    name: '',
                    role: 'priest',
                    title: 'Priest',
                    phone: '',
                    email: '',
                  },
                ])
              }
            >
              <Plus />
              Add
            </Button>
          </div>
          <ul className="divide-y divide-line">
            {staff.map((s, i) => (
              <li key={s.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto]">
                <Field label={i === 0 ? 'Name' : undefined} htmlFor={`st-name-${s.id}`}>
                  <Input
                    id={`st-name-${s.id}`}
                    value={s.name}
                    placeholder="Full name"
                    onChange={(e) =>
                      setStaff((all) =>
                        all.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)),
                      )
                    }
                  />
                </Field>
                <Field label={i === 0 ? 'Title' : undefined} htmlFor={`st-title-${s.id}`}>
                  <Input
                    id={`st-title-${s.id}`}
                    value={s.title}
                    placeholder="Role at the temple"
                    onChange={(e) =>
                      setStaff((all) =>
                        all.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)),
                      )
                    }
                  />
                </Field>
                <div
                  className={i === 0 ? 'flex items-end gap-2 pb-0.5' : 'flex items-center gap-2'}
                >
                  <RoleBadge role={s.role} />
                  <Button
                    variant="plain"
                    size="icon"
                    aria-label={`Remove ${s.name || 'staff member'}`}
                    onClick={() => setStaff((all) => all.filter((x) => x.id !== s.id))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-line p-4">
            <Button onClick={() => saved('Staff list')}>
              <Save />
              Save staff
            </Button>
          </div>
        </Card>
      ) : null}

      {tab === 'roles' ? (
        <Card className="max-w-3xl p-5">
          <h2 className="font-serif text-[18px]">Roles &amp; permissions</h2>
          <p className="mt-0.5 text-[12.5px] text-muted">
            The console enforces the board gate today; the rest of this matrix is the shape the real
            build would honour.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="py-2 text-[11.5px] font-semibold uppercase tracking-[0.07em] text-muted">
                    Capability
                  </th>
                  {(['admin', 'priest', 'board'] as const).map((r) => (
                    <th
                      key={r}
                      className="py-2 text-center text-[11.5px] font-semibold uppercase tracking-[0.07em] text-muted"
                    >
                      {r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {PERMISSIONS.map((p) => (
                  <tr key={p.key}>
                    <td className="py-2.5">{p.label}</td>
                    {(['admin', 'priest', 'board'] as const).map((r) => (
                      <td key={r} className="py-2.5 text-center">
                        <Checkbox
                          checked={matrix[p.key]![r]}
                          aria-label={`${p.label} for ${r}`}
                          onChange={(e) =>
                            setMatrix((m) => ({
                              ...m,
                              [p.key]: { ...m[p.key]!, [r]: e.target.checked },
                            }))
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button className="mt-5" onClick={() => saved('Permission matrix')}>
            <Save />
            Save permissions
          </Button>
        </Card>
      ) : null}

      {tab === 'payments' ? (
        <Card className="max-w-2xl p-5">
          <h2 className="font-serif text-[18px]">Payment methods</h2>
          <p className="mt-0.5 text-[12.5px] text-muted">
            Placeholder — the prototype contacts no payment processor.
          </p>
          <ul className="mt-4 space-y-2">
            {[
              { label: 'Card processing', detail: 'Stripe — not connected', badge: 'Placeholder' },
              {
                label: 'ACH / bank transfer',
                detail: 'Direct deposit to operating account',
                badge: 'Placeholder',
              },
              { label: 'Zelle', detail: 'give@smdpearland.org', badge: 'Manual' },
              { label: 'Check & cash', detail: 'Entered by the office desk', badge: 'Manual' },
            ].map((m) => (
              <li
                key={m.label}
                className="flex items-center gap-3 rounded-[10px] border border-line p-3.5"
              >
                <CreditCard className="size-5 shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium">{m.label}</p>
                  <p className="text-[12.5px] text-muted">{m.detail}</p>
                </div>
                <Badge variant="neutral">{m.badge}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {tab === 'email' ? (
        <div className="grid max-w-4xl gap-4 lg:grid-cols-[220px_1fr] lg:items-start">
          <Card className="p-2">
            <ul className="space-y-0.5">
              {templates.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setActiveTemplate(t.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors ${
                      t.id === activeTemplate
                        ? 'bg-brand-500/[0.09] font-medium text-brand-600'
                        : 'text-muted hover:bg-tint hover:text-ink'
                    }`}
                  >
                    <Mail className="size-3.5 shrink-0" />
                    {t.name}
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="font-serif text-[18px]">{template.name}</h2>
            <div className="mt-4 grid gap-4">
              <Field label="Subject line" htmlFor="et-subject">
                <Input
                  id="et-subject"
                  value={template.subject}
                  onChange={(e) =>
                    setTemplates((all) =>
                      all.map((t) =>
                        t.id === template.id ? { ...t, subject: e.target.value } : t,
                      ),
                    )
                  }
                />
              </Field>
              <Field
                label="Body"
                htmlFor="et-body"
                hint="{{placeholders}} are substituted at send time"
              >
                <Textarea
                  id="et-body"
                  rows={10}
                  value={template.body}
                  className="font-mono text-[12.5px]"
                  onChange={(e) =>
                    setTemplates((all) =>
                      all.map((t) => (t.id === template.id ? { ...t, body: e.target.value } : t)),
                    )
                  }
                />
              </Field>
            </div>
            <Button className="mt-4" onClick={() => saved(template.name)}>
              <Save />
              Save template
            </Button>
          </Card>
        </div>
      ) : null}
    </>
  )
}
