import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, Gauge, Loader2, ShieldCheck, Users } from 'lucide-react'
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
    <div className="flex min-h-dvh items-center justify-center px-6 py-10">
      <div className="w-full max-w-3xl">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo size={48} />
          <div>
            <h1 className="font-serif text-[28px] leading-tight">Operations console</h1>
            <p className="mt-1 text-[13.5px] text-muted">
              {TEMPLE.name} · {TEMPLE.city}, {TEMPLE.state}
            </p>
          </div>
        </div>

        <p className="mb-4 text-center text-[13px] text-muted">
          Choose a role to sign in. No password is checked in this prototype.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          {ROLES.map(({ role, title, Icon, blurb, sees }) => {
            const person = USERS.find((u) => u.role === role)
            return (
              <button
                key={role}
                type="button"
                onClick={() => pick(role)}
                disabled={busy != null}
                className={cn(
                  'flex flex-col rounded-[10px] border border-line bg-card p-5 text-left shadow-[var(--shadow-sm)] transition-all',
                  'hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[var(--shadow)] active:scale-[.99]',
                  'disabled:pointer-events-none disabled:opacity-60',
                )}
              >
                <span className="grid size-10 place-items-center rounded-[10px] bg-tint text-brand-500">
                  {busy === role ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Icon className="size-5" />
                  )}
                </span>
                <span className="mt-3 font-serif text-[18px] leading-snug text-ink">{title}</span>
                <span className="mt-0.5 text-[12.5px] font-medium text-brand-600">
                  {person?.name}
                </span>
                <span className="mt-2 text-[12.5px] leading-relaxed text-muted">{blurb}</span>
                <ul className="mt-3 space-y-1 border-t border-line pt-3">
                  {sees.map((s) => (
                    <li key={s} className="flex items-center gap-1.5 text-[12px] text-muted">
                      <ShieldCheck className="size-3 shrink-0 text-leaf-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>

        <p className="mt-6 text-center text-[12px] text-muted">
          Prototype build — all data is local mock data. Nothing here reaches a real devotee record.
        </p>

        <div className="mt-4 flex justify-center">
          <Button variant="plain" size="sm" onClick={() => pick('admin')} disabled={busy != null}>
            Skip — sign in as administrator
          </Button>
        </div>
      </div>
    </div>
  )
}
