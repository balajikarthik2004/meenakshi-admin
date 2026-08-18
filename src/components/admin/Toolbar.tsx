import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * One filter bar for every list view.
 *
 * Filters used to float loose above each table, so every screen invented its own
 * spacing and the controls read as page content rather than as a control surface.
 * Putting them in a single bordered rail makes it obvious what is a filter, and gives
 * "clear" somewhere consistent to live.
 */
export function Toolbar({
  search,
  onSearch,
  searchPlaceholder = 'Search',
  children,
  onClear,
  activeCount = 0,
  className,
}: {
  search?: string
  onSearch?: (v: string) => void
  searchPlaceholder?: string
  children?: React.ReactNode
  onClear?: () => void
  /** Number of filters currently narrowing the list, shown as a badge. */
  activeCount?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-wrap items-center gap-2 rounded-[10px] border border-line bg-card p-2 shadow-[var(--shadow-sm)]',
        className,
      )}
    >
      {onSearch ? (
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
          <Input
            value={search ?? ''}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-9 border-transparent bg-tint/50 pl-8 text-[13px] focus-visible:border-brand-400"
          />
        </div>
      ) : null}

      {children ? (
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="ml-1 size-3.5 shrink-0 text-muted" aria-hidden="true" />
          {children}
        </div>
      ) : null}

      {onClear && activeCount > 0 ? (
        <Button variant="plain" size="sm" onClick={onClear} className="ml-auto">
          <X />
          Clear {activeCount} filter{activeCount === 1 ? '' : 's'}
        </Button>
      ) : null}
    </div>
  )
}

/** Compact select sized for the toolbar rail. */
export function ToolbarSelect({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-9 cursor-pointer appearance-none rounded-md border border-line bg-card pl-2.5 pr-7 text-[13px] text-ink',
        'bg-[length:13px] bg-[right_8px_center] bg-no-repeat transition-colors',
        'hover:border-brand-300 focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236f6157' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    />
  )
}

/** Date input sized to match ToolbarSelect, with its label inline. */
export function ToolbarDate({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex items-center gap-1.5 text-[12px] text-muted">
      {label}
      <input
        type="date"
        className="h-9 rounded-md border border-line bg-card px-2 text-[13px] text-ink transition-colors hover:border-brand-300 focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
        {...props}
      />
    </label>
  )
}
