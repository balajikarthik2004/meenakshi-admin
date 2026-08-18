import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Pause, Play, X } from 'lucide-react'
import type { Booking, User } from '@/lib/data/types'
import { PageHeader } from '@/components/layout/AdminLayout'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { StatusPill } from '@/components/shared/badges'
import { LoadingSkeleton } from '@/components/shared/states'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { MenuItem, Popover } from '@/components/ui/overlay'
import { useToast } from '@/components/ui/toast'
import { listBookings, listDevotees, setBookingStatus } from '@/lib/data/api'
import { PUJA_BY_ID, PUJA_CATALOG } from '@/lib/data/mock'
import { useAsync } from '@/lib/hooks'
import { downloadCSV, fmtDate, money, titleCase } from '@/lib/utils'

interface Row {
  booking: Booking
  devotee?: User
}

export default function Bookings() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [status, setStatus] = useState('')
  const [puja, setPuja] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data, loading, refresh } = useAsync(
    async () => Promise.all([listBookings(), listDevotees()]),
    [],
  )

  const rows = useMemo<Row[]>(() => {
    if (!data) return []
    const [bookings, devotees] = data
    const byId = new Map(devotees.map((d) => [d.id, d]))
    return bookings
      .filter((b) => (status ? b.status === status : true))
      .filter((b) => (puja ? b.pujaCatalogId === puja : true))
      .filter((b) => (from ? b.startDate >= new Date(from).toISOString() : true))
      .filter((b) => (to ? b.startDate <= new Date(`${to}T23:59:59`).toISOString() : true))
      .map((booking) => ({ booking, devotee: byId.get(booking.userId) }))
  }, [data, status, puja, from, to])

  const act = async (id: string, next: Booking['status'], label: string) => {
    await setBookingStatus(id, next)
    toast(label)
    refresh()
  }

  const columns: Column<Row>[] = [
    {
      key: 'devotee',
      header: 'Devotee',
      sortValue: (r) => r.devotee?.name ?? '',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{r.devotee?.name ?? 'Unknown'}</p>
          <p className="truncate text-[12px] text-muted">{r.devotee?.phone}</p>
        </div>
      ),
    },
    {
      key: 'puja',
      header: 'Puja',
      sortValue: (r) => PUJA_BY_ID.get(r.booking.pujaCatalogId)?.name ?? '',
      cell: (r) => {
        const p = PUJA_BY_ID.get(r.booking.pujaCatalogId)
        return (
          <div className="min-w-0">
            <p className="truncate">{p?.name}</p>
            <p className="truncate text-[12px] text-muted">{p?.deity}</p>
          </div>
        )
      },
    },
    {
      key: 'cadence',
      header: 'Cadence',
      sortValue: (r) => r.booking.cadence,
      cell: (r) => titleCase(r.booking.cadence),
    },
    {
      key: 'names',
      header: 'Sankalpam',
      cell: (r) => (
        <span className="block max-w-[200px] truncate text-muted">
          {r.booking.sankalpamNames.join(', ')}
        </span>
      ),
    },
    {
      key: 'period',
      header: 'Period',
      sortValue: (r) => r.booking.startDate,
      cell: (r) => (
        <span className="whitespace-nowrap text-muted">
          {fmtDate(r.booking.startDate, 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortValue: (r) => r.booking.amount,
      align: 'right',
      cell: (r) => <span className="tabular-nums">{money(r.booking.amount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.booking.status,
      cell: (r) => <StatusPill status={r.booking.status} />,
    },
    {
      key: 'actions',
      header: '',
      cell: (r) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Popover
            trigger={({ toggle }) => (
              <Button variant="plain" size="sm" onClick={toggle}>
                Manage
              </Button>
            )}
          >
            {(close) => (
              <>
                {r.booking.status === 'active' ? (
                  <MenuItem
                    onClick={() => {
                      close()
                      act(r.booking.id, 'paused', 'Booking paused')
                    }}
                  >
                    <Pause className="size-4" />
                    Pause
                  </MenuItem>
                ) : (
                  <MenuItem
                    onClick={() => {
                      close()
                      act(r.booking.id, 'active', 'Booking resumed')
                    }}
                  >
                    <Play className="size-4" />
                    Resume
                  </MenuItem>
                )}
                <MenuItem
                  onClick={() => {
                    close()
                    act(r.booking.id, 'cancelled', 'Booking cancelled')
                  }}
                >
                  <X className="size-4" />
                  Cancel booking
                </MenuItem>
              </>
            )}
          </Popover>
        </div>
      ),
    },
  ]

  const exportCSV = () =>
    downloadCSV(
      'meenakshi-bookings.csv',
      rows.map((r) => ({
        Booking: r.booking.id,
        Devotee: r.devotee?.name ?? '',
        Puja: PUJA_BY_ID.get(r.booking.pujaCatalogId)?.name ?? '',
        Cadence: r.booking.cadence,
        Sankalpam: r.booking.sankalpamNames.join('; '),
        Start: fmtDate(r.booking.startDate, 'yyyy-MM-dd'),
        End: fmtDate(r.booking.endDate, 'yyyy-MM-dd'),
        Amount: r.booking.amount,
        Status: r.booking.status,
      })),
    )

  return (
    <>
      <PageHeader
        title="All bookings"
        subtitle={`${rows.length} sponsorship${rows.length === 1 ? '' : 's'} · ${money(rows.reduce((s, r) => s + r.booking.amount, 0))} committed`}
        actions={
          <Button variant="ghost" size="sm" onClick={exportCSV} disabled={rows.length === 0}>
            <Download />
            Export CSV
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
          className="w-[150px]"
        >
          <option value="">All statuses</option>
          {['active', 'paused', 'completed', 'cancelled'].map((s) => (
            <option key={s} value={s}>
              {titleCase(s)}
            </option>
          ))}
        </Select>
        <Select
          value={puja}
          onChange={(e) => setPuja(e.target.value)}
          aria-label="Filter by puja"
          className="w-[220px]"
        >
          <option value="">All pujas</option>
          {PUJA_CATALOG.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <div>
          <label htmlFor="bk-from" className="mb-1 block text-[11.5px] text-muted">
            Started after
          </label>
          <Input
            id="bk-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-[160px]"
          />
        </div>
        <div>
          <label htmlFor="bk-to" className="mb-1 block text-[11.5px] text-muted">
            Started before
          </label>
          <Input
            id="bk-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-[160px]"
          />
        </div>
        {(status || puja || from || to) && (
          <Button
            variant="plain"
            size="sm"
            onClick={() => {
              setStatus('')
              setPuja('')
              setFrom('')
              setTo('')
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton variant="table" rows={8} />
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.booking.id}
          onRowClick={(r) => r.devotee && navigate(`/devotees/${r.devotee.id}`)}
          initialSort={{ key: 'period', dir: 'desc' }}
          empty={{ title: 'No bookings match', detail: 'Widen the status, puja or date filters.' }}
        />
      )}
    </>
  )
}
