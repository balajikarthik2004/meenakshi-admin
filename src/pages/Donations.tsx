import { useMemo, useRef, useState } from 'react'
import {
  Download,
  FileCheck2,
  Landmark,
  Printer,
  Receipt as ReceiptIcon,
  Wand2,
} from 'lucide-react'
import type { Donation, User } from '@/lib/data/types'
import { PageShell } from '@/components/layout/PageShell'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { StatTile } from '@/components/shared/StatTile'
import { LoadingSkeleton } from '@/components/shared/states'
import { TransactionReceipt } from '@/components/shared/TransactionReceipt'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox, Textarea } from '@/components/ui/input'
import { Toolbar, ToolbarDate, ToolbarSelect } from '@/components/admin/Toolbar'
import { Dialog, Sheet } from '@/components/ui/overlay'
import { useToast } from '@/components/ui/toast'
import { issueTaxReceipts, listDevotees, listDonations } from '@/lib/data/api'
import { DONATION_CATEGORIES } from '@/lib/data/mock'
import { useAsync } from '@/lib/hooks'
import { EVENT_BY_ID, PROJECT_BY_ID } from '@/lib/data/mock'
import { Link } from 'react-router-dom'
import { downloadElementAsPdf } from '@/lib/pdf'
import { downloadCSV, fmtDate, money, titleCase } from '@/lib/utils'

interface Row {
  donation: Donation
  donor?: User
}

/**
 * What a gift was earmarked for — the festival or the capital project, and for a
 * festival which heads it covers. Blank for an unrestricted gift.
 */
function eventPurpose(d: Donation) {
  const event = d.eventId ? EVENT_BY_ID.get(d.eventId) : undefined
  if (event) {
    return d.eventItems?.length ? `${event.title} — ${d.eventItems.join(', ')}` : event.title
  }
  return d.projectId ? (PROJECT_BY_ID.get(d.projectId)?.title ?? '') : ''
}

interface MatchResult {
  line: string
  amount: number
  matched?: Donation
  donor?: User
}

const METHODS: Donation['paymentMethod'][] = ['card', 'ach', 'zelle', 'check', 'cash']

const SAMPLE_STATEMENT = `08/14  ACH CREDIT  ANNAMALAI P            2,500.00
08/12  ZELLE FROM RAGHAVAN L                501.00
08/11  CHECK DEPOSIT 10428                1,001.00
08/09  CARD BATCH SETTLEMENT                108.00
08/07  ACH CREDIT  UNIDENTIFIED             750.00`

export default function Donations() {
  const { toast } = useToast()
  const [category, setCategory] = useState('')
  const [method, setMethod] = useState('')
  const [receipt, setReceipt] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [reconciling, setReconciling] = useState(false)
  const [statement, setStatement] = useState(SAMPLE_STATEMENT)
  const [matches, setMatches] = useState<MatchResult[] | null>(null)
  const [receiptRow, setReceiptRow] = useState<Row | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  const { data, loading, refresh } = useAsync(
    async () => Promise.all([listDonations(), listDevotees()]),
    [],
  )

  const rows = useMemo<Row[]>(() => {
    if (!data) return []
    const [donations, devotees] = data
    const byId = new Map(devotees.map((d) => [d.id, d]))
    return donations
      .filter((d) => (category ? d.category === category : true))
      .filter((d) => (method ? d.paymentMethod === method : true))
      .filter((d) =>
        receipt === 'sent' ? !!d.taxReceiptId : receipt === 'pending' ? !d.taxReceiptId : true,
      )
      .filter((d) => (from ? d.createdAt >= new Date(from).toISOString() : true))
      .filter((d) => (to ? d.createdAt <= new Date(`${to}T23:59:59`).toISOString() : true))
      .map((donation) => ({
        donation,
        donor: donation.userId ? byId.get(donation.userId) : undefined,
      }))
  }, [data, category, method, receipt, from, to])

  const total = rows.reduce((s, r) => s + r.donation.amount, 0)
  const pendingReceipts = rows.filter((r) => !r.donation.taxReceiptId).length

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const generateReceipts = async () => {
    const ids =
      selected.size > 0
        ? [...selected]
        : rows.filter((r) => !r.donation.taxReceiptId).map((r) => r.donation.id)
    const n = await issueTaxReceipts(ids)
    toast(`${n} tax receipt${n === 1 ? '' : 's'} generated`, {
      detail: 'Each donor gets a 501(c)(3) acknowledgement on file.',
    })
    setSelected(new Set())
    refresh()
  }

  /** Mock reconciliation: parse trailing amounts and match the nearest unreceipted gift. */
  const runMatch = () => {
    if (!data) return
    const [donations, devotees] = data
    const byId = new Map(devotees.map((d) => [d.id, d]))
    const used = new Set<string>()

    const results: MatchResult[] = statement
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const m = line.match(/([\d,]+\.\d{2})\s*$/)
        const amount = m ? Number(m[1]!.replace(/,/g, '')) : 0
        const matched = donations.find(
          (d) => d.amount === amount && !used.has(d.id) && d.paymentMethod !== 'cash',
        )
        if (matched) used.add(matched.id)
        return {
          line,
          amount,
          matched,
          donor: matched?.userId ? byId.get(matched.userId) : undefined,
        }
      })

    setMatches(results)
  }

  const columns: Column<Row>[] = [
    {
      key: 'select',
      header: '',
      cell: (r) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected.has(r.donation.id)}
            onChange={() => toggle(r.donation.id)}
            aria-label={`Select donation ${r.donation.id}`}
          />
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortValue: (r) => r.donation.createdAt,
      cell: (r) => (
        <span className="whitespace-nowrap text-muted">{fmtDate(r.donation.createdAt)}</span>
      ),
    },
    {
      key: 'donor',
      header: 'Donor',
      sortValue: (r) => r.donor?.name ?? 'Anonymous',
      cell: (r) =>
        r.donor ? (
          <span className="font-medium text-ink">{r.donor.name}</span>
        ) : (
          <span className="text-muted italic">Anonymous</span>
        ),
    },
    {
      key: 'category',
      header: 'Fund',
      sortValue: (r) => r.donation.category,
      cell: (r) => (
        <div className="min-w-0">
          <span>
            {titleCase(r.donation.category)}
            {r.donation.isRecurring ? (
              <Badge variant="gold" className="ml-2">
                {titleCase(r.donation.recurringCadence ?? 'recurring')}
              </Badge>
            ) : null}
            {/* Where the money came from changes how the row should be read: this one
                settles a promise already on the register rather than arriving out of
                nowhere, and the link is how the desk gets back to the rest of it. */}
            {r.donation.pledgeId ? (
              <Link to="/donations/pledges" onClick={(e) => e.stopPropagation()} className="ml-2">
                <Badge variant="neutral">Pledge</Badge>
              </Link>
            ) : null}
          </span>
          {eventPurpose(r.donation) ? (
            <p className="max-w-[30ch] truncate text-sm text-muted">{eventPurpose(r.donation)}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      sortValue: (r) => r.donation.paymentMethod,
      cell: (r) => titleCase(r.donation.paymentMethod),
    },
    {
      key: 'receipt',
      header: 'Receipt',
      sortValue: (r) => (r.donation.taxReceiptId ? 'y' : 'n'),
      align: 'center',
      // "Y" and "N" in a pill made the reader decode a legend that was never printed —
      // and the two states are not equivalent: a missing receipt is work outstanding,
      // which is the whole reason this column is on the page.
      cell: (r) =>
        r.donation.taxReceiptId ? (
          <Badge variant="leaf">Sent</Badge>
        ) : (
          <Badge variant="gold">Pending</Badge>
        ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortValue: (r) => r.donation.amount,
      align: 'right',
      cell: (r) => <span className="font-medium tabular-nums">{money(r.donation.amount)}</span>,
    },
    {
      key: 'receipt-action',
      header: '',
      cell: (r) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setReceiptRow(r)}>
            <ReceiptIcon />
            Receipt
          </Button>
        </div>
      ),
    },
  ]

  const exportCSV = () =>
    downloadCSV(
      'meenakshi-donations.csv',
      rows.map((r) => ({
        Id: r.donation.id,
        Date: fmtDate(r.donation.createdAt, 'yyyy-MM-dd'),
        Donor: r.donor?.name ?? 'Anonymous',
        Fund: titleCase(r.donation.category),
        Festival: r.donation.eventId ? (EVENT_BY_ID.get(r.donation.eventId)?.title ?? '') : '',
        Project: r.donation.projectId ? (PROJECT_BY_ID.get(r.donation.projectId)?.title ?? '') : '',
        Sponsored: r.donation.eventItems?.join('; ') ?? '',
        Amount: r.donation.amount,
        Method: r.donation.paymentMethod,
        Recurring: r.donation.isRecurring ? r.donation.recurringCadence : 'No',
        Pledge: r.donation.pledgeId ?? '',
        Receipt: r.donation.taxReceiptId ?? '',
      })),
    )

  const toolbar = (
    <Toolbar
      activeCount={[category, method, receipt, from, to].filter(Boolean).length}
      onClear={() => {
        setCategory('')
        setMethod('')
        setReceipt('')
        setFrom('')
        setTo('')
      }}
    >
      <ToolbarSelect
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        aria-label="Filter by fund"
      >
        <option value="">All funds</option>
        {DONATION_CATEGORIES.map((c) => (
          <option key={c.key} value={c.key}>
            {c.label}
          </option>
        ))}
      </ToolbarSelect>
      <ToolbarSelect
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        aria-label="Filter by method"
      >
        <option value="">All methods</option>
        {METHODS.map((m) => (
          <option key={m} value={m}>
            {titleCase(m)}
          </option>
        ))}
      </ToolbarSelect>
      <ToolbarSelect
        value={receipt}
        onChange={(e) => setReceipt(e.target.value)}
        aria-label="Filter by receipt status"
      >
        <option value="">Any receipt status</option>
        <option value="sent">Receipt sent</option>
        <option value="pending">Receipt pending</option>
      </ToolbarSelect>
      <ToolbarDate label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
      <ToolbarDate label="To" value={to} onChange={(e) => setTo(e.target.value)} />
    </Toolbar>
  )

  return (
    <PageShell
      toolbar={toolbar}
      eyebrow="Money"
      title="Donation ledger"
      description={`${rows.length} entries · ${money(total)} recorded`}
      actions={
        <>
          <Button variant="ghost" size="sm" onClick={() => setReconciling(true)}>
            <Landmark />
            Reconcile bank
          </Button>
          <Button variant="ghost" size="sm" onClick={exportCSV} disabled={rows.length === 0}>
            <Download />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={generateReceipts}
            disabled={pendingReceipts === 0 && selected.size === 0}
          >
            <FileCheck2 />
            Generate tax receipts
            {selected.size > 0 ? ` (${selected.size})` : ''}
          </Button>
        </>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total Donation"
          value={money(total)}
          sub={`${rows.length} gifts`}
          tone="leaf"
        />
        {/* <StatTile
          label="Receipts pending"
          value={pendingReceipts}
          sub="Not yet acknowledged"
          tone="gold"
        /> */}
        <StatTile
          label="Recurring donors"
          value={rows.filter((r) => r.donation.isRecurring).length}
          sub="Standing orders in this view"
        />
        <StatTile
          label="Average Donation"
          value={money(rows.length ? Math.round(total / rows.length) : 0)}
          sub="Across the filtered set"
          tone="brand"
        />
      </div>

      {loading ? (
        <LoadingSkeleton variant="table" rows={10} />
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.donation.id}
          initialSort={{ key: 'date', dir: 'desc' }}
          empty={{
            title: 'No donations match',
            detail: 'Clear a filter to widen the ledger view.',
          }}
        />
      )}

      <Sheet
        open={reconciling}
        onClose={() => setReconciling(false)}
        title="Reconcile bank statement"
        description="Paste lines from the bank export; the ledger matches them by amount."
        className="max-w-xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setReconciling(false)}>
              Close
            </Button>
            <Button onClick={runMatch}>
              <Wand2 />
              Auto-match
            </Button>
          </>
        }
      >
        <Textarea
          rows={8}
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          className="font-mono text-sm"
          aria-label="Bank statement lines"
        />

        {matches ? (
          <div className="mt-4">
            <p className="eyebrow mb-2">
              Match results — {matches.filter((m) => m.matched).length} of {matches.length} matched
            </p>
            <ul className="space-y-2">
              {matches.map((m, i) => (
                <li key={i} className="rounded-[var(--radius-lg)] border border-line p-3">
                  <p className="font-mono text-xs text-muted">{m.line}</p>
                  {m.matched ? (
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-base">
                      <Badge variant="leaf">Matched</Badge>
                      <span className="font-medium">{m.donor?.name ?? 'Anonymous'}</span>
                      <span className="text-muted">
                        {titleCase(m.matched.category)} · {fmtDate(m.matched.createdAt)} ·{' '}
                        {m.matched.id}
                      </span>
                    </p>
                  ) : (
                    <p className="mt-1.5 flex items-center gap-2 text-base">
                      <Badge variant="brand">Unmatched</Badge>
                      <span className="text-muted">
                        No ledger entry for {money(m.amount)} — needs manual entry.
                      </span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm italic text-muted">
              Matching is amount-only for now. Payer name, date window and reference number are not
              yet compared.
            </p>
          </div>
        ) : null}
      </Sheet>

      <Dialog
        open={!!receiptRow}
        onClose={() => setReceiptRow(null)}
        title="Transaction receipt"
        className="max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer />
              Print
            </Button>
            <Button
              onClick={() => {
                if (!receiptRef.current || !receiptRow) return
                downloadElementAsPdf(
                  receiptRef.current,
                  `receipt-${receiptRow.donation.taxReceiptId ?? receiptRow.donation.id}.pdf`,
                )
              }}
            >
              <Download />
              Download PDF
            </Button>
          </>
        }
      >
        {receiptRow ? (
          <TransactionReceipt
            ref={receiptRef}
            recipientName={receiptRow.donor?.name ?? 'Devotee'}
            recipientEmail={receiptRow.donor?.email}
            date={receiptRow.donation.createdAt}
            receiptNo={(receiptRow.donation.taxReceiptId ?? receiptRow.donation.id).toUpperCase()}
            lines={[
              {
                serviceName:
                  `${titleCase(receiptRow.donation.category)} donation` +
                  (eventPurpose(receiptRow.donation)
                    ? ` — ${eventPurpose(receiptRow.donation)}`
                    : '') +
                  (receiptRow.donation.dedicatedTo ? ` (${receiptRow.donation.dedicatedTo})` : ''),
                qty: 1,
                amount: receiptRow.donation.amount,
              },
            ]}
            paymentMode={titleCase(receiptRow.donation.paymentMethod)}
            referenceNumber={receiptRow.donation.id.toUpperCase()}
          />
        ) : null}
      </Dialog>
    </PageShell>
  )
}
