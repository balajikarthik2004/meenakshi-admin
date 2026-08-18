import { useState } from 'react'
import { Download, FileText, Mail, Printer } from 'lucide-react'
import { PageHeader } from '@/components/layout/AdminLayout'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { TaxReceiptPreview } from '@/components/shared/TaxReceiptPreview'
import { StatTile } from '@/components/shared/StatTile'
import { EmptyState, LoadingSkeleton } from '@/components/shared/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { getMyBookings, getYearlyContributions, listDonations } from '@/lib/data/api'
import { PUJA_BY_ID } from '@/lib/data/mock'
import { useAsync } from '@/lib/hooks'
import { downloadCSV, money, titleCase } from '@/lib/utils'
import type { User } from '@/lib/data/types'

type Row = { user: User; donations: number; sponsorships: number; total: number }

export default function Receipts() {
  const { toast } = useToast()
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(thisYear - 1)
  const [preview, setPreview] = useState<Row | null>(null)

  const { data, loading } = useAsync(() => getYearlyContributions(year), [year])

  const { data: lines } = useAsync(async () => {
    if (!preview) return null
    const [donations, bookings] = await Promise.all([
      listDonations(preview.user.id),
      getMyBookings(preview.user.id),
    ])
    return [
      ...donations
        .filter((d) => new Date(d.createdAt).getFullYear() === year)
        .map((d) => ({
          date: d.createdAt,
          description: `${titleCase(d.category)} donation${d.dedicatedTo ? ` — ${d.dedicatedTo}` : ''}`,
          amount: d.amount,
        })),
      ...bookings
        .filter((b) => b.status !== 'cancelled' && new Date(b.createdAt).getFullYear() === year)
        .map((b) => ({
          date: b.createdAt,
          description: `${PUJA_BY_ID.get(b.pujaCatalogId)?.name ?? 'Puja'} sponsorship (${b.cadence})`,
          amount: b.amount,
        })),
    ].sort((a, b) => a.date.localeCompare(b.date))
  }, [preview?.user.id, year])

  const rows = data ?? []
  const grandTotal = rows.reduce((s, r) => s + r.total, 0)
  const years = Array.from({ length: 5 }, (_, i) => thisYear - i)

  const columns: Column<Row>[] = [
    {
      key: 'name',
      header: 'Devotee',
      sortValue: (r) => r.user.name,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{r.user.name}</p>
          <p className="truncate text-[12px] text-muted">{r.user.email}</p>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'City',
      sortValue: (r) => r.user.city ?? '',
      cell: (r) => r.user.city ?? '—',
    },
    {
      key: 'donations',
      header: 'Donations',
      sortValue: (r) => r.donations,
      align: 'right',
      cell: (r) => <span className="tabular-nums text-muted">{money(r.donations)}</span>,
    },
    {
      key: 'sponsorships',
      header: 'Sponsorships',
      sortValue: (r) => r.sponsorships,
      align: 'right',
      cell: (r) => <span className="tabular-nums text-muted">{money(r.sponsorships)}</span>,
    },
    {
      key: 'total',
      header: 'Total contributed',
      sortValue: (r) => r.total,
      align: 'right',
      cell: (r) => <span className="font-medium tabular-nums">{money(r.total)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (r) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setPreview(r)}>
            <FileText />
            Generate PDF
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Bulk tax receipts"
        subtitle={`${rows.length} devotees with recorded contributions in ${year}`}
        actions={
          <>
            <Select
              value={year}
              onChange={(e) => {
                setYear(Number(e.target.value))
                setPreview(null)
              }}
              aria-label="Statement year"
              className="w-[110px]"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                downloadCSV(
                  `meenakshi-contributions-${year}.csv`,
                  rows.map((r) => ({
                    Devotee: r.user.name,
                    Email: r.user.email,
                    City: r.user.city,
                    Donations: r.donations,
                    Sponsorships: r.sponsorships,
                    Total: r.total,
                  })),
                )
              }
              disabled={rows.length === 0}
            >
              <Download />
              Export CSV
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast(`${rows.length} statements queued`, {
                  detail: `Prototype only — no email is sent. Real build would post ${year} PDFs to each devotee.`,
                })
              }
              disabled={rows.length === 0}
            >
              <Mail />
              Email all statements
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatTile
          label={`${year} total`}
          value={money(grandTotal)}
          sub="All devotees"
          tone="leaf"
        />
        <StatTile
          label="Statements to issue"
          value={rows.length}
          sub="One per donor household"
          tone="brand"
        />
        <StatTile
          label="Average per donor"
          value={money(rows.length ? Math.round(grandTotal / rows.length) : 0)}
          sub={`Across ${year}`}
          tone="gold"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr] xl:items-start">
        <div className="min-w-0">
          {loading ? (
            <LoadingSkeleton variant="table" rows={8} />
          ) : (
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(r) => r.user.id}
              onRowClick={setPreview}
              initialSort={{ key: 'total', dir: 'desc' }}
              empty={{
                title: `No contributions recorded in ${year}`,
                detail: 'Pick another year from the selector above.',
              }}
            />
          )}
        </div>

        <Card className="xl:sticky xl:top-6">
          <div className="flex items-center justify-between gap-3 border-b border-line p-4">
            <h2 className="font-serif text-[18px]">Receipt preview</h2>
            {preview ? (
              <Button variant="ghost" size="sm" onClick={() => window.print()}>
                <Printer />
                Print
              </Button>
            ) : null}
          </div>
          <div className="p-4">
            {preview && lines ? (
              <TaxReceiptPreview
                donorName={preview.user.name}
                donorAddress={
                  preview.user.address
                    ? `${preview.user.address}, ${preview.user.city}, ${preview.user.state} ${preview.user.zip}`
                    : undefined
                }
                receiptNo={`STMT-${year}-${preview.user.id.toUpperCase()}`}
                year={year}
                lines={lines}
                className="border-0 p-0 shadow-none"
              />
            ) : (
              <EmptyState
                Icon={FileText}
                title="Select a devotee"
                detail="Pick any row to render their 501(c)(3) contribution statement here."
              />
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
