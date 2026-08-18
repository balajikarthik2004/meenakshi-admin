import { DEITY_GRADIENT } from '@/lib/data/mock'
import { cn } from '@/lib/utils'

/**
 * Stands in for deity photography. Each deity gets a stable gradient plus a
 * kolam-style motif so cards are visually distinguishable without any assets.
 */
export function DeityArt({
  deity,
  className,
  label,
}: {
  deity: string
  className?: string
  label?: string
}) {
  const [from, to] = DEITY_GRADIENT[deity] ?? ['#a3341f', '#d4a25c']
  const seed = deity.charCodeAt(0) % 3

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
      role="img"
      aria-label={label ?? `${deity} sannidhi`}
    >
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.22]"
        viewBox="0 0 120 90"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g stroke="#fff" strokeWidth="0.7" fill="none">
          {Array.from({ length: 7 }, (_, i) => (
            <circle key={i} cx={60} cy={45} r={8 + i * 7} />
          ))}
          {seed !== 2 &&
            Array.from({ length: 12 }, (_, i) => (
              <line
                key={i}
                x1={60}
                y1={45}
                x2={60 + 56 * Math.cos((i * Math.PI) / 6)}
                y2={45 + 56 * Math.sin((i * Math.PI) / 6)}
              />
            ))}
          {seed === 1 &&
            Array.from({ length: 8 }, (_, i) => (
              <path
                key={i}
                d={`M60 45 q${22 * Math.cos((i * Math.PI) / 4)} ${22 * Math.sin((i * Math.PI) / 4)} ${
                  40 * Math.cos((i * Math.PI) / 4)
                } ${40 * Math.sin((i * Math.PI) / 4)}`}
              />
            ))}
        </g>
      </svg>
      <span className="absolute bottom-2 left-3 font-serif text-[13px] text-white/90 drop-shadow">
        {deity}
      </span>
    </div>
  )
}
