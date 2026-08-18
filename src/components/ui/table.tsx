import * as React from 'react'
import { cn } from '@/lib/utils'

export const TableWrap = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'w-full overflow-x-auto rounded-[10px] border border-line bg-card shadow-[var(--shadow-sm)]',
      className,
    )}
    {...props}
  />
)

export const Table = ({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
  <table className={cn('w-full border-collapse text-left text-[13px]', className)} {...props} />
)

/**
 * Sticky by default. An ops table routinely runs past a screenful, and losing the column
 * headings three rows into a donation ledger is the fastest way to misread a figure.
 */
export const THead = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead
    className={cn('sticky top-0 z-10 bg-tint/95 backdrop-blur supports-[backdrop-filter]:bg-tint/80', className)}
    {...props}
  />
)

export const TBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn('divide-y divide-line/70', className)} {...props} />
)

export const TR = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn('transition-colors', className)} {...props} />
)

export const TH = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      'border-b border-line px-3 py-2 text-[10.5px] font-semibold uppercase tracking-[0.09em] whitespace-nowrap text-muted',
      className,
    )}
    {...props}
  />
)

export const TD = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn('px-3 py-2 align-middle', className)} {...props} />
)
