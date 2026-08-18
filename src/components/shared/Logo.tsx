import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * A Madurai-style gopuram: tiered, crowned with five kalasams, flanked by the
 * temple's brass lamps. Drawn inline so the mark stays crisp at any size and costs
 * no network request.
 */
export function Logo({
  className,
  size = 40,
  onDark = false,
}: {
  className?: string
  size?: number
  onDark?: boolean
}) {
  // A shared gradient id breaks the moment two logos coexist: the reference resolves to
  // the first definition, and if that one sits in a `display:none` subtree (the mobile
  // header bar) Chromium paints nothing at all.
  const gid = `gopuram-${useId().replace(/:/g, '')}`
  const gold = onDark ? '#f8c95f' : '#bf9a3f'
  const stoneTop = onDark ? '#f2ab21' : '#bf5a27'
  const stoneBottom = onDark ? '#9c1f16' : '#9c1f16'
  const ring = onDark ? 'rgba(248,201,95,.45)' : 'rgba(191,154,63,.55)'
  const field = onDark ? 'rgba(255,255,255,.06)' : '#fbf3e4'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Sri Meenakshi Devasthanam"
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stoneTop} />
          <stop offset="100%" stopColor={stoneBottom} />
        </linearGradient>
      </defs>

      <circle cx="32" cy="32" r="30.5" fill={field} stroke={ring} strokeWidth="1.5" />

      {/* Five kalasams along the crown */}
      {[20, 26, 32, 38, 44].map((x, i) => (
        <circle key={x} cx={x} cy={i === 2 ? 12.5 : 14.5} r={i === 2 ? 2.1 : 1.5} fill={gold} />
      ))}

      {/* Tiered vimanam — each tier a little wider than the one above */}
      <path
        d="M22 17h20l1.6 4.4H20.4L22 17Z
           M19.6 22.6h24.8l1.8 5H17.8l1.8-5Z
           M16.8 28.9h30.4l2 5.6H14.8l2-5.6Z
           M13.6 36h36.8l2.2 6.4H11.4L13.6 36Z
           M11 44h42v9H11v-9Z"
        fill={`url(#${gid})`}
      />

      {/* Sanctum doorway */}
      <path d="M28 53v-6.2a4 4 0 0 1 8 0V53Z" fill={field} />

      {/* Flanking lamps */}
      <circle cx="8.5" cy="40" r="1.7" fill={gold} />
      <circle cx="55.5" cy="40" r="1.7" fill={gold} />
    </svg>
  )
}

export function LogoWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Logo size={compact ? 30 : 40} />
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-serif text-[17px] text-brand-600">Sri Meenakshi</span>
        {!compact && (
          <span className="block text-[10px] uppercase tracking-[0.18em] text-muted">
            Devasthanam · Pearland
          </span>
        )}
      </span>
    </span>
  )
}
