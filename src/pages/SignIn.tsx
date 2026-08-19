import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, Gauge, Loader2, Lock, ShieldCheck, Users } from 'lucide-react'
import type { Role } from '@/lib/data/types'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/shared/Logo'
import { USERS, TEMPLE } from '@/lib/data/mock'
import { useAuthStore } from '@/lib/store/auth'
import { cn } from '@/lib/utils'

const ROLES: {
  role: Extract<Role, 'admin' | 'priest' | 'board'>
  title: string
  Icon: typeof Users
  blurb: string
  sees: string[]
}[] = [
  {
    role: 'admin',
    title: 'Temple Administrator',
    Icon: Users,
    blurb: 'Full operational access — devotees, bookings, ledger, events and settings.',
    sees: ['Devotee records', 'Donation ledger', 'Event CMS', 'Settings'],
  },
  {
    role: 'priest',
    title: 'Priest',
    Icon: BookOpen,
    blurb: 'The daily worklist — today’s archana names, sankalpam details and fulfilment.',
    sees: ['Today’s pujas', 'Archana list', 'Puja catalogue'],
  },
  {
    role: 'board',
    title: 'Board Member',
    Icon: Gauge,
    blurb: 'Strategic and financial oversight, including the read-only AGM view.',
    sees: ['Transparency dashboard', 'Board view', 'Projects tracker'],
  },
]

export default function SignIn() {
  const navigate = useNavigate()
  const location = useLocation()
  const signIn = useAuthStore((s) => s.signIn)
  const [busy, setBusy] = useState<Role | null>(null)

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const pick = async (role: Role) => {
    setBusy(role)
    await signIn('', role)
    setBusy(null)
    navigate(role === 'board' ? '/board' : from, { replace: true })
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-10 sm:px-8">
      <div className="w-full max-w-4xl">
        {/* The masthead is set as a plate rather than stacked text: the mark, the
            wordmark and the console name in one horizontal group, so the page opens
            with a signature instead of a heading. */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Logo size={52} />
          <div>
            <p className="eyebrow mb-2">Staff access</p>
            <h1 className="font-bold text-3xl leading-none text-ink">Operations Console</h1>
            <p className="mx-auto mt-3 max-w-[46ch] text-base leading-relaxed text-muted">
              {TEMPLE.name} · {TEMPLE.city}, {TEMPLE.state}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold text-muted shadow-[var(--shadow-xs)]">
            <Lock className="size-3 text-gold-500" />
            Choose a role to continue
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {ROLES.map(({ role, title, Icon, blurb, sees }) => {
            const person = USERS.find((u) => u.role === role)
            const loading = busy === role
            return (
              <button
                key={role}
                type="button"
                onClick={() => pick(role)}
                disabled={busy != null}
                className={cn(
                  'card-interactive group flex flex-col rounded-[var(--radius-lg)] border border-line bg-card p-5 text-left shadow-[var(--shadow-sm)]',
                  'disabled:pointer-events-none disabled:opacity-55',
                  loading && 'border-brand-300 opacity-100',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="grid size-10 place-items-center rounded-[9px] bg-tint text-brand-500 ring-1 ring-line transition-colors group-hover:bg-brand-500 group-hover:text-white group-hover:ring-brand-600">
                    {loading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <Icon className="size-5" />
                    )}
                  </span>
                  <ArrowRight className="size-4 text-line transition-colors group-hover:text-brand-500" />
                </span>

                <span className="mt-3.5 font-bold text-lg leading-snug text-ink">{title}</span>
                <span className="mt-1 text-sm font-bold text-brand-600">{person?.name}</span>
                <span className="mt-2 text-sm leading-relaxed text-muted">{blurb}</span>

                <span className="mt-auto block w-full pt-4">
                  <span className="eyebrow mb-1.5 block">Can see</span>
                  <ul className="space-y-1 border-t border-line-soft pt-2">
                    {sees.map((s) => (
                      <li key={s} className="flex items-center gap-1.5 text-sm text-ink-soft">
                        <ShieldCheck className="size-3 shrink-0 text-leaf-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => pick('admin')} disabled={busy != null}>
            Skip — sign in as administrator
            <ArrowRight />
          </Button>
          {/* <p className="max-w-[58ch] text-center text-xs leading-relaxed text-faint">
            Prototype build — all data is local mock data. Nothing here reaches a real devotee
            record.
          </p> */}
        </div>
      </div>
    </div>
  )
}
