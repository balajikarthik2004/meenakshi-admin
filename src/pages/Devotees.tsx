import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Search, Users } from 'lucide-react'
import type { MembershipTier, User } from '@/lib/data/types'
import { PageHeader } from '@/components/layout/AdminLayout'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { TierBadge } from '@/components/shared/badges'
import { LoadingSkeleton } from '@/components/shared/states'
import { Avatar } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { getMyBookings, listDevotees, listDonations, listMemberships } from '@/lib/data/api'
import { CITIES } from '@/lib/data/mock'
import { useAsync, useDebounced } from '@/lib/hooks'
import { downloadCSV, fmtDate, money } from '@/lib/utils'

interface Row {
  user: User
  tier?: MembershipTier
  contributions: number
  activePujas: number
}

const JOINED_RANGES = [
  { key: 'all', label: 'Any time' },
  { key: '1y', label: 'Last 12 months' },
  { key: '3y', label: 'Last 3 years' },
  { key: '5y', label: 'Last 5 years' },
]

export default function Devotees() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState('')
  const [city, setCity] = useState('')
  const [joined, setJoined] = useState('all')
  const debounced = useDebounced(search)

  const { data, loading } = useAsync(
    async () => Promise.all([listDevotees(), listMemberships(), listDonations()]),
    [],
  )

  const { data: bookingCounts } = useAsync(async () => {
    const devotees = await listDevotees()
    const entries = await Promise.all(
      devotees.map(async (d) => {
        const bookings = await getMyBookings(d.id)
        return [d.id, bookings.filter((b) => b.status === 'active').length] as const
      }),
    )
    return new Map(entries)
  }, [])

  const rows = useMemo<Row[]>(() => {
    if (!data) return []
    const [devotees, memberships, donations] = data
    const activeMembership = new Map(
      memberships.filter((m) => m.status === 'active').map((m) => [m.userId, m.tier]),
    )
    const totals = new Map<string, number>()
    for (const d of donations) {
      if (!d.userId) continue
      totals.set(d.userId, (totals.get(d.userId) ?? 0) + d.amount)
    }

    const cutoff = (() => {
      const now = new Date()
      if (joined === '1y') return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      if (joined === '3y') return new Date(now.getFullYear() - 3, now.getMonth(), now.getDate())
      if (joined === '5y') return new Date(now.getFullYear() - 5, now.getMonth(), now.getDate())
      return null
    })()

    const q = debounced.trim().toLowerCase()

    return devotees
      .filter((u) =>
        q ? [u.name, u.email, u.phone].some((f) => f.toLowerCase().includes(q)) : true,
      )
      .filter((u) => (city ? u.city === city : true))
      .filter((u) => (tier ? activeMembership.get(u.id) === tier : true))
      .filter((u) => (cutoff ? new Date(u.createdAt) >= cutoff : true))
      .map((user) => ({
        user,
        tier: activeMembership.get(user.id),
        contributions: totals.get(user.id) ?? 0,
        activePujas: bookingCounts?.get(user.id) ?? 0,
      }))
  }, [data, debounced, tier, city, joined, bookingCounts])

  const columns: Column<Row>[] = [
    {
      key: 'name',
      header: 'Name',
      sortValue: (r) => r.user.name,
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar initials={r.user.avatarInitials} className="size-8 text-[11.5px]" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{r.user.name}</p>
            <p className="truncate text-[12px] text-muted">{r.user.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', sortValue: (r) => r.user.phone, cell: (r) => r.user.phone },
    {
      key: 'city',
      header: 'City',
      sortValue: (r) => r.user.city ?? '',
      cell: (r) => r.user.city ?? '—',
    },
    {
      key: 'tier',
      header: 'Tier',
      sortValue: (r) => r.tier ?? 'zz',
      cell: (r) => (r.tier ? <TierBadge tier={r.tier} /> : <span className="text-muted">—</span>),
    },
    {
      key: 'contributions',
      header: 'Contributions',
      sortValue: (r) => r.contributions,
      align: 'right',
      cell: (r) => <span className="tabular-nums">{money(r.contributions)}</span>,
    },
    {
      key: 'pujas',
      header: 'Active pujas',
      sortValue: (r) => r.activePujas,
      align: 'right',
      cell: (r) => <span className="tabular-nums">{r.activePujas}</span>,
    },
    {
      key: 'joined',
      header: 'Joined',
      sortValue: (r) => r.user.createdAt,
      cell: (r) => (
        <span className="whitespace-nowrap text-muted">
          {fmtDate(r.user.createdAt, 'MMM yyyy')}
        </span>
      ),
    },
  ]

  const exportCSV = () =>
    downloadCSV(
      'meenakshi-devotees.csv',
      rows.map((r) => ({
        Name: r.user.name,
        Email: r.user.email,
        Phone: r.user.phone,
        City: r.user.city,
        Tier: r.tier ?? '',
        Contributions: r.contributions,
        ActivePujas: r.activePujas,
        Joined: fmtDate(r.user.createdAt, 'yyyy-MM-dd'),
      })),
    )

  return (
    <>
      <PageHeader
        title="Devotees"
        subtitle={`${rows.length} on the register${loading ? '' : ` · ${money(rows.reduce((s, r) => s + r.contributions, 0))} lifetime donations`}`}
        actions={
          <Button variant="ghost" size="sm" onClick={exportCSV} disabled={rows.length === 0}>
            <Download />
            Export CSV
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone or email"
            aria-label="Search devotees"
            className="pl-9"
          />
        </div>
        <Select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          aria-label="Filter by tier"
          className="w-[150px]"
        >
          <option value="">All tiers</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
          <option value="platinum">Platinum</option>
        </Select>
        <Select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          aria-label="Filter by city"
          className="w-[150px]"
        >
          <option value="">All cities</option>
          {CITIES.map((c) => (
            <option key={c.city} value={c.city}>
              {c.city}
            </option>
          ))}
        </Select>
        <Select
          value={joined}
          onChange={(e) => setJoined(e.target.value)}
          aria-label="Filter by join date"
          className="w-[160px]"
        >
          {JOINED_RANGES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <LoadingSkeleton variant="table" rows={8} />
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.user.id}
          onRowClick={(r) => navigate(`/devotees/${r.user.id}`)}
          initialSort={{ key: 'contributions', dir: 'desc' }}
          empty={{
            title: 'No devotees match those filters',
            detail: 'Clear the search or widen the tier and city filters.',
          }}
        />
      )}

      {!loading && rows.length > 0 ? (
        <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-muted">
          <Users className="size-3.5" />
          Click any row to open the full devotee record.
        </p>
      ) : null}
    </>
  )
}
