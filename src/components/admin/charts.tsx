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
        {/* `monotone` invented smooth troughs between months and made a spiky series
            look like data that was never recorded — a single major gift can move one
            month by six figures. A straight join tells the truth, and visible dots mark
            where the real readings are. */}
        <Area
          type="linear"
          dataKey="amount"
          stroke={CHART.categorical[0]}
          strokeWidth={2}
          fill="url(#trendFill)"
          dot={{ r: 2.5, fill: CHART.categorical[0], strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: CHART.surface }}
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

  const accent =
    tone === 'leaf'
      ? 'before:bg-leaf-500'
      : tone === 'gold'
        ? 'before:bg-saffron-400'
        : tone === 'brand'
          ? 'before:bg-brand-500'
          : 'before:bg-line'

  return (
    <div
      className={cn(
        // A 3px rail on the left carries the tone, so the card body stays white and the
        // row reads as one band of figures rather than four separately tinted boxes.
        'relative overflow-hidden rounded-[10px] border border-line bg-card py-3 pl-4 pr-3.5 shadow-[var(--shadow-sm)]',
        'before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-[""]',
        accent,
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[10.5px] font-semibold tracking-[0.11em] uppercase text-muted">
          {label}
        </p>
        {Icon ? <Icon className="size-3.5 shrink-0 text-muted/70" /> : null}
      </div>

      <div className="mt-1.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-[27px] leading-none text-ink">{value}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2">
            {sub ? <p className="text-[12px] leading-tight text-muted">{sub}</p> : null}
            {trend ? (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-[11.5px] font-medium',
                  trend.direction === 'up' ? 'text-leaf-500' : 'text-brand-500',
                )}
              >
                {trend.direction === 'up' ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {trend.value}
              </span>
            ) : null}
          </div>
        </div>

        {/* The sparkline sits beside the number rather than under it — same information,
            roughly half the card height, so the row stops stretching to match it. */}
        {series && series.length > 1 ? (
          <div className="h-8 w-20 shrink-0" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={series.map((v, i) => ({ i, v }))}
                margin={{ top: 2, right: 0, left: 0, bottom: 2 }}
              >
                <Line type="linear" dataKey="v" stroke={stroke} strokeWidth={1.75} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
    </div>
  )
}
