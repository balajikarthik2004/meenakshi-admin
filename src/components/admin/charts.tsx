import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { AXIS_TICK, CHART, TOOLTIP_STYLE } from './chart-theme'
import { cn, money, moneyShort, titleCase } from '@/lib/utils'

/* ------------------------------------------------------------ donations trend */

/**
 * Twelve months of receipts. One series, so no legend box — the card title names
 * it — and no per-point labels; the hover crosshair carries the exact figure.
 */
export function TrendChart({ data }: { data: { month: string; amount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.categorical[0]} stopOpacity={0.22} />
            <stop offset="100%" stopColor={CHART.categorical[0]} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey="month"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: CHART.grid }}
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={54}
          tickFormatter={(v: number) => moneyShort(v)}
        />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [money(Number(v)), 'Received']} />
        <Area
          type="monotone"
          dataKey="amount"
          stroke={CHART.categorical[0]}
          strokeWidth={2}
          fill="url(#trendFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: CHART.surface }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* --------------------------------------------------------- bookings by puja type */

/**
 * A single measure across categories, so this is magnitude — one hue stepped along
 * the sequential ramp by rank, not five identity colours.
 */
export function BarChartByPuja({ data }: { data: { type: string; bookings: number }[] }) {
  const sorted = [...data].sort((a, b) => b.bookings - a.bookings)
  const max = Math.max(...sorted.map((d) => d.bookings), 1)

  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={sorted} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey="type"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: CHART.grid }}
          tickFormatter={(v: string) => titleCase(v)}
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={34}
          allowDecimals={false}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          cursor={{ fill: 'rgba(163,52,31,0.05)' }}
          formatter={(v) => [`${Number(v)} bookings`, '']}
          labelFormatter={(l) => titleCase(String(l))}
        />
        <Bar dataKey="bookings" radius={[4, 4, 0, 0]} maxBarSize={54}>
          {sorted.map((d) => {
            const step = Math.min(
              CHART.sequential.length - 1,
              Math.floor((d.bookings / max) * (CHART.sequential.length - 1)),
            )
            return <Cell key={d.type} fill={CHART.sequential[step]} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ---------------------------------------------------------------- metric card */

/** Dashboard tile with a sparkline. The number is the headline; the line is texture. */
export function MetricCard({
  label,
  value,
  sub,
  Icon,
  series,
  trend,
  tone = 'default',
  className,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  Icon?: LucideIcon
  series?: number[]
  trend?: { value: string; direction: 'up' | 'down' }
  tone?: 'default' | 'brand' | 'gold' | 'leaf'
  className?: string
}) {
  const stroke =
    tone === 'leaf'
      ? CHART.categorical[2]
      : tone === 'gold'
        ? CHART.categorical[1]
        : CHART.categorical[0]

  return (
    <div
      className={cn(
        'flex flex-col rounded-[10px] border border-line bg-card p-4 shadow-[var(--shadow-sm)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">
          {label}
        </p>
        {Icon ? (
          <span className="grid size-7 place-items-center rounded-md bg-tint text-brand-500">
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>

      <p className="mt-2 font-serif text-[26px] leading-none text-ink">{value}</p>

      <div className="mt-1.5 flex items-center gap-2">
        {sub ? <p className="text-[12.5px] text-muted">{sub}</p> : null}
        {trend ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[12px] font-medium',
              trend.direction === 'up' ? 'text-leaf-500' : 'text-brand-500',
            )}
          >
            {trend.direction === 'up' ? (
              <TrendingUp className="size-3.5" />
            ) : (
              <TrendingDown className="size-3.5" />
            )}
            {trend.value}
          </span>
        ) : null}
      </div>

      {series && series.length > 1 ? (
        <div className="mt-3 h-9" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={series.map((v, i) => ({ i, v }))}
              margin={{ top: 2, right: 0, left: 0, bottom: 2 }}
            >
              <Line type="monotone" dataKey="v" stroke={stroke} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  )
}
