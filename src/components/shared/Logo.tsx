import { cn } from '@/lib/utils'

/**
 * A Madurai-style gopuram: tiered, crowned with five kalasams, flanked by the
 * temple's brass lamps. Drawn inline so the mark stays crisp at any size and costs
 * no network request.
 */
export function Logo({
  className,
  size = 40,
}: {
  className?: string
  size?: number
}) {
  return (
    <img
      src="/deities/logo.png"
      width={size}
      height={size}
      alt="Sri Meenakshi Temple Society Logo"
      className={cn('shrink-0 object-contain', className)}
    />
  )
}

export function LogoWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Logo size={compact ? 30 : 40} />
      <span className="min-w-0 leading-tight">
        <span className="wordmark block truncate text-lg text-brand-600">Sri Meenakshi</span>
        {!compact && (
          <span className="block text-2xs uppercase tracking-[0.18em] text-muted">
            Temple Society · Pearland
          </span>
        )}
      </span>
    </span>
  )
}
