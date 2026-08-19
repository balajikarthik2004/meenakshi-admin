import { cn } from '@/lib/utils'

/**
 * Deity photography.
 *
 * Every image is a public-domain or CC work from Wikimedia Commons, resized to WebP —
 * see `public/deities/CREDITS.md`. They exist so the prototype reads as a temple rather
 * than a wireframe; the Devasthanam's own photography replaces them before production.
 *
 * `focus` matters: devotional art is almost always vertical with the face in the upper
 * third, so a default centre crop decapitates the deity in a wide card. Each image
 * carries its own object-position.
 */
export interface DeityImageMeta {
  src: string
  focus: string
  credit: string
  /** Responsive variants, widest last. Only worth it for full-bleed imagery. */
  srcSet?: string
}

export const DEITY_IMAGES: Record<string, DeityImageMeta> = {
  Meenakshi: {
    src: '/deities/meenakshi.png',
    focus: '50% 22%',
    credit: 'Raja Ravi Varma · public domain',
  },
  Sundareswarar: {
    src: '/deities/sundareswarar.png',
    focus: '50% 30%',
    credit: 'LACMA · public domain',
  },
  Venkateshwara: {
    src: '/deities/venkateshwara.png',
    focus: '50% 28%',
    credit: 'Wikimedia Commons · public domain',
  },
  Lakshmi: {
    src: '/deities/lakshmi.png',
    focus: '50% 26%',
    credit: 'Raja Ravi Varma · public domain',
  },
  Ganesha: {
    src: '/deities/ganesha.png',
    focus: '50% 30%',
    credit: 'Google Art Project · public domain',
  },
  Murugan: {
    src: '/deities/murugan.png',
    focus: '50% 24%',
    credit: 'Raja Ravi Varma · public domain',
  },
  Durga: {
    src: '/deities/durga.png',
    focus: '50% 22%',
    credit: 'Wikimedia Commons · public domain',
  },
  // Commons has no suitably licensed image of Ayyappan. Rather than misattribute
  // another deity's likeness, this slot shows the lamp offering central to his worship.
  Ayyappan: {
    src: '/deities/ayyappan.png',
    focus: '50% 55%',
    credit: 'McKay Savage · CC BY 2.0',
  },
}

/** Non-deity scenes used for festivals, heroes and auth panels. */
export const SCENES: Record<string, DeityImageMeta> = {
  gopuram: {
    src: '/deities/gopuram-1200.webp',
    srcSet:
      '/deities/gopuram-760.webp 760w, /deities/gopuram-1200.webp 1200w, /deities/gopuram-1700.webp 1700w',
    focus: '50% 40%',
    credit: 'J-P Dalbéra · CC BY 2.0',
  },
  lamps: { src: '/deities/lamps.webp', focus: '50% 50%', credit: 'McKay Savage · CC BY 2.0' },
  deepam: { src: '/deities/deepam.webp', focus: '50% 45%', credit: 'Wikimedia · CC BY-SA 4.0' },
}

export const resolveImage = (key: string): DeityImageMeta =>
  DEITY_IMAGES[key] ?? SCENES[key] ?? SCENES.gopuram!

/**
 * A framed deity image. `overlay` darkens the lower half so white type can sit on it;
 * `vignette` is the softer treatment used behind cards.
 */
export function DeityArt({
  deity,
  className,
  label,
  overlay = false,
  vignette = false,
  pan = false,
  priority = false,
  rounded,
}: {
  deity: string
  className?: string
  label?: string
  overlay?: boolean
  vignette?: boolean
  pan?: boolean
  /** Set on the LCP image so the browser does not lazy-load it. */
  priority?: boolean
  rounded?: string
}) {
  const meta = resolveImage(deity)

  return (
    <div className={cn('relative overflow-hidden bg-brand-800', rounded, className)}>
      <img
        src={meta.src}
        srcSet={meta.srcSet}
        sizes={meta.srcSet ? '100vw' : undefined}
        alt={label ?? `${deity} — devotional image`}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        className={cn('h-full w-full object-cover', pan && 'animate-slow-pan')}
        style={{ objectPosition: meta.focus }}
      />
      {vignette ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 50% 30%, transparent 40%, rgba(40,5,3,0.45) 100%)',
          }}
        />
      ) : null}
      {overlay ? (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-900/92 via-brand-900/45 to-brand-900/10" />
      ) : null}
    </div>
  )
}

/** Small attribution line, shown once per page rather than on every card. */
export function ImageCredit({ deity, className }: { deity: string; className?: string }) {
  return (
    <span className={cn('text-xs text-muted/80', className)}>
      Image: {resolveImage(deity).credit}
    </span>
  )
}
