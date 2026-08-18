import { Link } from 'react-router-dom'
import {
  BookOpen,
  CalendarCheck,
  Package,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/AdminLayout'
import { MetricCard, BarChartByPuja, TrendChart } from '@/components/admin/charts'
import { TodaysArchanaList, type ArchanaRow } from '@/components/admin/TodaysArchanaList'
import { StatTile } from '@/components/shared/StatTile'
import { BreakEvenMeter } from '@/components/shared/BreakEvenMeter'
import { LoadingSkeleton } from '@/components/shared/states'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import {
  getAdminStats,
  getOccurrencesOn,
  getTransparencySnapshot,
  listBookings,
  setOccurrenceStatus,
} from '@/lib/data/api'
import { USERS } from '@/lib/data/mock'
import { useAuthStore } from '@/lib/store/auth'
import { useAsync } from '@/lib/hooks'
import { fmtDate, money, moneyShort } from '@/lib/utils'

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)!
  const { toast } = useToast()

  const { data, loading, refresh } = useAsync(
    async () =>
      Promise.all([
        getAdminStats(),
        getTransparencySnapshot(),
        getOccurrencesOn(new Date()),
        listBookings(),
      ]),
    [],
  )

  if (loading || !data) {
    return (
      <>
        <PageHeader title="Operations dashboard" subtitle="Loading today’s figures…" />
        <LoadingSkeleton variant="tiles" rows={4} />
      </>
    )
  }

  const [stats, snapshot, todayOccurrences, bookings] = data
  const bookingById = new Map(bookings.map((b) => [b.id, b]))

  const rows: ArchanaRow[] = todayOccurrences
    .map((occurrence) => {
      const booking = bookingById.get(occurrence.bookingId)
      return {
        occurrence,
        booking,
        devotee: booking ? USERS.find((u) => u.id === booking.userId) : undefined,
      }
    })
    .sort((a, b) => a.occurrence.scheduledAt.localeCompare(b.occurrence.scheduledAt))

  const complete = async (ids: string[]) => {
    await Promise.all(ids.map((id) => setOccurrenceStatus(id, 'completed')))
    toast(`${ids.length} puja${ids.length === 1 ? '' : 's'} marked completed`)
    refresh()
  }

  const skip = async (ids: string[]) => {
    await Promise.all(ids.map((id) => setOccurrenceStatus(id, 'skipped')))
    toast(`${ids.length} marked skipped`, { tone: 'warn' })
    refresh()
  }

  const trendSeries = stats.monthlyTrend.map((m) => m.amount)

  return (
    <>
      <PageHeader
        title={`Good morning, ${user.name.split(' ')[0]}`}
        subtitle={`${fmtDate(new Date(), 'EEEE, MMMM d, yyyy')} · ${rows.length} pujas on today’s roster`}
        actions={
          <>
            <Link to="/bookings/today" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              <CalendarCheck />
              Today’s pujas
            </Link>
            <Link to="/transparency" className={buttonVariants({ size: 'sm' })}>
              <TrendingUp />
              Transparency
            </Link>
          </>
        }
      />

      {/* Row 1 — four headline metrics */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Donations"
          value={money(stats.donationsYTD)}
          sub={`${money(stats.donationsMTD)} month to date`}
          Icon={Wallet}
          series={trendSeries}
          tone="brand"
        />
        <MetricCard
          label="Active bookings"
          value={stats.activeBookings}
          sub="Live puja sponsorships"
          Icon={BookOpen}
          tone="gold"
        />
        <MetricCard
          label="Active memberships"
          value={stats.activeMemberships}
          sub="Across silver, gold and platinum"
          Icon={ShieldCheck}
          tone="leaf"
        />
        <MetricCard
          label="Devotees"
          value={stats.devoteeCount}
          sub="On the register"
          Icon={Users}
          trend={
            stats.newDevoteesThisWeek > 0
              ? { value: `+${stats.newDevoteesThisWeek} this week`, direction: 'up' }
              : undefined
          }
        />
      </div>

      {/* Row 2 — break-even, action queue, prasadam */}
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-1">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">
            Break-even snapshot
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-[26px] leading-none">
              {moneyShort(snapshot.ytdCollected)}
            </span>
            <span className="text-[13px] text-muted">of {moneyShort(snapshot.annualTarget)}</span>
          </div>
          <BreakEvenMeter
            className="mt-3"
            target={snapshot.annualTarget}
            collected={snapshot.ytdCollected}
            label="Annual operating target"
            compact
          />
        </Card>

        <StatTile
          label="Today’s action queue"
          value={stats.todayQueue}
          sub="Pujas still to be performed today"
          Icon={CalendarCheck}
          tone="brand"
        />
        <StatTile
          label="Overdue prasadam shipments"
          value={stats.overduePrasadam}
          sub="Sponsorships with prasadam-by-post"
          Icon={Package}
          tone="gold"
        />
      </div>

      {/* Row 3 — charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Donations received, last 12 months</CardTitle>
            <p className="text-[12.5px] text-muted">
              Hover any month for the exact figure. Excludes puja sponsorships.
            </p>
          </CardHeader>
          <div className="p-5 pt-1">
            <TrendChart data={stats.monthlyTrend} />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings by puja type</CardTitle>
            <p className="text-[12.5px] text-muted">
              Live and completed sponsorships, cancelled excluded.
            </p>
          </CardHeader>
          <div className="p-5 pt-1">
            <BarChartByPuja data={stats.byPujaType} />
          </div>
        </Card>
      </div>

      {/* Row 4 — today's roster */}
      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-[20px]">Today at the temple</h2>
          <Link
            to="/bookings/today"
            className="text-[13px] font-medium text-brand-500 hover:underline"
          >
            Open the full roster
          </Link>
        </div>
        <TodaysArchanaList rows={rows.slice(0, 8)} onComplete={complete} onSkip={skip} />
      </section>
    </>
  )
}
