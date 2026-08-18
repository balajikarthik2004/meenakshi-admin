import { useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BadgeDollarSign,
  BookOpen,
  Building2,
  CalendarDays,
  CalendarCheck,
  ChevronRight,
  Gauge,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import type { Role } from '@/lib/data/types'
import { Logo } from '@/components/shared/Logo'
import { RoleBadge } from '@/components/shared/badges'
import { Avatar } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MenuItem, Popover } from '@/components/ui/overlay'
import { useAuthStore } from '@/lib/store/auth'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  Icon: typeof Users
  end?: boolean
  roles?: Role[]
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Operations',
    items: [
      { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
      { to: '/bookings/today', label: 'Today’s pujas', Icon: CalendarCheck },
      { to: '/bookings', label: 'All bookings', Icon: BookOpen, end: true },
      { to: '/catalog', label: 'Puja catalogue', Icon: Landmark },
    ],
  },
  {
    title: 'People',
    items: [
      { to: '/devotees', label: 'Devotees', Icon: Users, end: true },
      { to: '/memberships', label: 'Memberships', Icon: ShieldCheck },
    ],
  },
  {
    title: 'Money',
    items: [
      { to: '/donations', label: 'Donation ledger', Icon: BadgeDollarSign, end: true },
      { to: '/donations/receipts', label: 'Tax receipts', Icon: ReceiptText },
      { to: '/transparency', label: 'Transparency', Icon: Gauge },
      { to: '/board', label: 'Board view', Icon: ShieldCheck, roles: ['board'] },
    ],
  },
  {
    title: 'Programme',
    items: [
      { to: '/events', label: 'Events', Icon: CalendarDays, end: true },
      { to: '/calendar', label: 'Calendar CMS', Icon: CalendarDays },
      { to: '/facility', label: 'Facility bookings', Icon: Building2 },
      { to: '/settings', label: 'Settings', Icon: Settings },
    ],
  },
]

const CRUMB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  devotees: 'Devotees',
  bookings: 'Bookings',
  today: 'Today',
  catalog: 'Puja catalogue',
  donations: 'Donations',
  receipts: 'Tax receipts',
  memberships: 'Memberships',
  events: 'Events',
  new: 'New',
  edit: 'Edit',
  calendar: 'Calendar CMS',
  facility: 'Facility',
  transparency: 'Transparency',
  board: 'Board view',
  settings: 'Settings',
}

export function RequireAdminAuth() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  if (!user) return <Navigate to="/signin" state={{ from: location.pathname }} replace />
  return <Outlet />
}

/** Board-only routes. Anyone else is bounced to the operational equivalent. */
export function RequireBoard() {
  const user = useAuthStore((s) => s.user)
  if (user?.role !== 'board') return <Navigate to="/transparency" replace />
  return <Outlet />
}

export function AdminLayout() {
  const user = useAuthStore((s) => s.user)!
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileNav, setMobileNav] = useState(false)

  const crumbs = location.pathname.split('/').filter(Boolean)

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
      isActive ? 'bg-brand-500/[0.1] text-brand-600' : 'text-muted hover:bg-tint hover:text-ink',
    )

  const nav = (
    <nav className="space-y-5">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((i) => !i.roles || i.roles.includes(user.role))
        if (items.length === 0) return null
        return (
          <div key={group.title}>
            <p className="mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.11em] text-muted/80">
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {items.map(({ to, label, Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileNav(false)}
                  className={navClass}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-dvh bg-bg">
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-[228px] shrink-0 flex-col border-r border-line bg-card lg:flex">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 border-b border-line px-4 py-4"
          >
            <Logo size={30} />
            <span className="leading-tight">
              <span className="block font-serif text-[14.5px]">Sri Meenakshi</span>
              <span className="block text-[10px] uppercase tracking-[0.12em] text-muted">
                Operations console
              </span>
            </span>
          </Link>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">{nav}</div>
          <div className="border-t border-line p-3">
            <div className="flex items-center gap-2.5 rounded-md p-1.5">
              <Avatar initials={user.avatarInitials} className="size-8 text-[12px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{user.name}</p>
                <RoleBadge role={user.role} />
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar with breadcrumbs */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-card/95 px-4 backdrop-blur sm:px-6">
            <Button
              variant="plain"
              size="icon"
              className="lg:hidden"
              aria-label="Toggle navigation"
              onClick={() => setMobileNav((o) => !o)}
            >
              {mobileNav ? <X /> : <Menu />}
            </Button>

            <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 sm:flex">
              <Link
                to="/dashboard"
                className="text-[13px] text-muted transition-colors hover:text-ink"
              >
                Console
              </Link>
              {crumbs.map((c, i) => (
                <span key={`${c}-${i}`} className="flex items-center gap-1.5">
                  <ChevronRight className="size-3.5 text-muted/60" />
                  <span
                    className={cn(
                      'truncate text-[13px]',
                      i === crumbs.length - 1 ? 'font-medium text-ink' : 'text-muted',
                    )}
                  >
                    {CRUMB_LABELS[c] ?? c}
                  </span>
                </span>
              ))}
            </nav>

            <Link to="/dashboard" className="flex items-center gap-2 sm:hidden">
              <Logo size={26} />
              <span className="font-serif text-[14px]">Console</span>
            </Link>

            <div className="ml-auto flex items-center gap-2">
              <Popover
                trigger={({ toggle }) => (
                  <button
                    type="button"
                    onClick={toggle}
                    className="flex items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-3 transition-colors hover:bg-tint"
                  >
                    <Avatar initials={user.avatarInitials} className="size-7 text-[11px]" />
                    <span className="hidden text-[13px] font-medium sm:inline">
                      {user.name.split(' ')[0]}
                    </span>
                  </button>
                )}
              >
                {(close) => (
                  <>
                    <div className="px-2.5 pb-2 pt-1">
                      <p className="text-[13px] font-medium text-ink">{user.name}</p>
                      <p className="truncate text-[12px] text-muted">{user.email}</p>
                    </div>
                    <MenuItem
                      onClick={() => {
                        close()
                        navigate('/settings')
                      }}
                    >
                      <Settings className="size-4" />
                      Settings
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        close()
                        signOut()
                        navigate('/signin')
                      }}
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </MenuItem>
                  </>
                )}
              </Popover>
            </div>
          </header>

          {mobileNav ? (
            <div className="animate-fade-in border-b border-line bg-card p-3 lg:hidden">{nav}</div>
          ) : null}

          <main className="animate-fade-in min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-7">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export function MinimalLayout() {
  return (
    <div className="min-h-dvh bg-bg">
      <div className="animate-fade-in">
        <Outlet />
      </div>
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h1 className="font-serif text-[26px] leading-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 text-[13.5px] text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
