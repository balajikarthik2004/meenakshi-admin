import { cn } from '@/lib/utils'

/**
 * A gopuram silhouette in brand red with a gold kalasam — drawn inline so the
 * prototype ships without binary assets.
 */
export function Logo({ className, size = 34 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Sri Meenakshi Devasthanam"
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id="gopuram" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b87938" />
          <stop offset="100%" stopColor="#a3341f" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="23" fill="var(--color-tint)" stroke="var(--color-gold-500)" />
      <path d="M24 7l3 4h-6l3-4Z" fill="var(--color-gold-500)" />
      <path
        d="M17 13h14l2 5H15l2-5Zm-3 7h20l2 5H12l2-5Zm-3 7h26l2 6H9l2-6Zm-2 8h30v6H9v-6Z"
        fill="url(#gopuram)"
      />
      <rect x="21" y="34" width="6" height="7" rx="1" fill="var(--color-tint)" />
    </svg>
  )
}

export function LogoWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Logo size={compact ? 28 : 34} />
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-serif text-[16px] font-semibold text-ink">
          Sri Meenakshi
        </span>
        {!compact && (
          <span className="block text-[11px] uppercase tracking-[0.12em] text-muted">
            Devasthanam · Pearland
          </span>
        )}
      </span>
    </span>
  )
}
