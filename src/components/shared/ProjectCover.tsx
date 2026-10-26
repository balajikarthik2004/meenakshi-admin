import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * Cover artwork for a capital project.
 *
 * These are drawn rather than photographed, and that is the point. Three of the four
 * projects do not exist yet — there is nothing to photograph — and the temple's image
 * library holds deity portraits and festival scenes, none of which belong at the top
 * of a page about a solar array. Putting Raja Ravi Varma's Murugan over "Roof load
 * assessment passed" is the specific thing that makes a page look assembled rather
 * than designed.
 *
 * So each project gets an elevation in the temple's own palette: the same treatment a
 * real capital appeal uses before the building stands, which is an architect's
 * drawing. They are inline SVG, so they cost no request, scale to any card, and stay
 * sharp on a retina display — and when the Devasthanam supplies photographs of the
 * finished work, a project simply carries an `imageUrl` and this steps aside.
 *
 * Every scene shares one frame — warm sky, low sun, horizon, grain — so four
 * different subjects still read as one set.
 */

export type ProjectCoverKey = 'gopuram' | 'shrine' | 'solar' | 'access' | 'default'

const LABELS: Record<ProjectCoverKey, string> = {
  gopuram: 'Illustration of the temple rajagopuram under scaffolding',
  shrine: 'Illustration of the planned navagraha shrine, with the nine planetary stones',
  solar: 'Illustration of the temple hall with a rooftop solar array',
  access: 'Illustration of the planned accessibility ramp and platform lift',
  default: 'Illustration of the temple campus',
}

export function ProjectCover({
  cover = 'default',
  className,
  /** Dims the art so white type can sit over it — used on the detail hero. */
  overlay = false,
}: {
  cover?: ProjectCoverKey
  className?: string
  overlay?: boolean
}) {
  // Gradient ids must be unique per instance or the first card on a grid captures
  // every later reference to them and the rest render flat.
  const uid = useId().replace(/:/g, '')
  const sky = `sky-${uid}`
  const sun = `sun-${uid}`
  const grain = `grain-${uid}`

  return (
    <svg
      viewBox="0 0 480 280"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={LABELS[cover]}
      className={cn('block h-full w-full', className)}
    >
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdf0d3" />
          <stop offset="55%" stopColor="#fbf3e4" />
          <stop offset="100%" stopColor="#f6e7cc" />
        </linearGradient>
        <radialGradient id={sun} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#f8c95f" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#f2ab21" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#f2ab21" stopOpacity="0" />
        </radialGradient>
        {/* A sparse dot field standing in for paper tooth. Cheap, and it stops the
            large flat areas of sky reading as a rendering error on a big screen. */}
        <pattern id={grain} width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.5" fill="#9c1f16" opacity="0.05" />
        </pattern>
      </defs>

      <rect width="480" height="280" fill={`url(#${sky})`} />
      <circle cx="370" cy="86" r="132" fill={`url(#${sun})`} />
      <rect width="480" height="280" fill={`url(#${grain})`} />

      {/* The distant campus, held at low opacity on every scene so the subject in
          front of it always has somewhere to stand. */}
      <g fill="#9c1f16" opacity="0.09">
        <path d="M0 252h58v-34l14-12 14 12v34h40v-52l18-14 18 14v52H0z" />
        <path d="M402 252v-44l16-13 16 13v44h46v8H388v-8z" />
      </g>

      {cover === 'gopuram' ? <Gopuram /> : null}
      {cover === 'shrine' ? <Shrine /> : null}
      {cover === 'solar' ? <Solar /> : null}
      {cover === 'access' ? <Access /> : null}
      {cover === 'default' ? <Campus /> : null}

      {/* Ground. One warm band rather than a hard line, so the buildings sit on
          something instead of being pasted onto the sky. */}
      <rect y="252" width="480" height="28" fill="#9c1f16" opacity="0.1" />
      <rect y="252" width="480" height="1.5" fill="#9c1f16" opacity="0.22" />

      {overlay ? (
        <rect width="480" height="280" fill="#241a14" opacity="0.42" />
      ) : null}
    </svg>
  )
}

/* ------------------------------------------------------------------ scenes */

/**
 * The rajagopuram: five diminishing talas, a barrel-vaulted sala and its kalasams,
 * with the restoration scaffold standing against the north face.
 */
function Gopuram() {
  const tiers = [
    { y0: 252, y1: 212, h0: 92, h1: 79 },
    { y0: 212, y1: 176, h0: 79, h1: 67 },
    { y0: 176, y1: 144, h0: 67, h1: 55 },
    { y0: 144, y1: 118, h0: 55, h1: 44 },
    { y0: 118, y1: 98, h0: 44, h1: 35 },
  ]
  const cx = 212

  return (
    <g>
      {/* Plinth */}
      <rect x={cx - 102} y="240" width="204" height="13" fill="#7f150f" opacity="0.9" />

      {tiers.map((t, i) => (
        <g key={i}>
          <path
            d={`M${cx - t.h0} ${t.y0}L${cx - t.h1} ${t.y1}H${cx + t.h1}L${cx + t.h0} ${t.y0}Z`}
            fill="#9c1f16"
            opacity={0.88 - i * 0.04}
          />
          {/* Cornice: the overhang that gives each tala its shadow line. */}
          <rect
            x={cx - t.h1 - 6}
            y={t.y1 - 5}
            width={(t.h1 + 6) * 2}
            height="6"
            rx="1.5"
            fill="#5f0f0a"
            opacity="0.5"
          />
          {/* Niches, fewer as the tower narrows — the real proportion. */}
          {Array.from({ length: 5 - i }, (_, n) => {
            const span = (t.h0 + t.h1) / 2
            const step = (span * 2) / (6 - i)
            const x = cx - span + step * (n + 1)
            return (
              <rect
                key={n}
                x={x - 3.5}
                y={t.y1 + 6}
                width="7"
                height={t.y0 - t.y1 - 12}
                rx="3.5"
                fill="#fbf3e4"
                opacity="0.3"
              />
            )
          })}
        </g>
      ))}

      {/* Sala — the barrel roof — and the kalasam row along its ridge. */}
      <path d={`M${cx - 38} 98H${cx + 38}a38 24 0 0 0-76 0Z`} fill="#7f150f" />
      {[-28, -14, 0, 14, 28].map((dx) => (
        <g key={dx}>
          <rect x={cx + dx - 1.5} y="62" width="3" height="13" fill="#bf9a3f" />
          <circle cx={cx + dx} cy="59" r="4" fill="#d7bc78" />
        </g>
      ))}

      {/* Scaffold against the east face: standards, ledgers and a diagonal brace. */}
      <g stroke="#bf9a3f" strokeWidth="2" fill="none" opacity="0.85">
        <path d="M316 252V104M344 252V104M330 252V104" />
        {[104, 134, 164, 194, 224].map((y) => (
          <path key={y} d={`M314 ${y}h32`} />
        ))}
        <path d="M316 224l28-30M316 164l28-30" strokeWidth="1.3" opacity="0.6" />
      </g>
      {/* Hoarding at the base, so the scaffold reads as a live site. */}
      <rect x="310" y="232" width="40" height="20" fill="#2c6b50" opacity="0.75" rx="1.5" />
    </g>
  )
}

/**
 * The navagraha sannidhi: an open mandapam, and the nine stones in the three-by-three
 * grid they are actually installed in.
 */
function Shrine() {
  const cx = 168
  return (
    <g>
      <rect x={cx - 76} y="238" width="152" height="15" fill="#7f150f" opacity="0.9" />
      <rect x={cx - 68} y="230" width="136" height="9" fill="#5f0f0a" opacity="0.55" />

      {/* Four pillars, with capitals. */}
      {[-56, -20, 20, 56].map((dx) => (
        <g key={dx}>
          <rect x={cx + dx - 7} y="150" width="14" height="80" fill="#9c1f16" opacity="0.9" />
          <rect x={cx + dx - 10} y="146" width="20" height="7" rx="1.5" fill="#5f0f0a" opacity="0.6" />
          <rect x={cx + dx - 10} y="224" width="20" height="7" rx="1.5" fill="#5f0f0a" opacity="0.6" />
        </g>
      ))}

      {/* Entablature and a small vimanam over the sanctum. */}
      <rect x={cx - 84} y="132" width="168" height="15" rx="2" fill="#7f150f" />
      <path d={`M${cx - 44} 132L${cx - 30} 100h60l14 32Z`} fill="#9c1f16" />
      <path d={`M${cx - 30} 100L${cx - 18} 80h36l12 20Z`} fill="#7f150f" />
      <rect x={cx - 1.5} y="62" width="3" height="19" fill="#bf9a3f" />
      <circle cx={cx} cy="59" r="4.5" fill="#d7bc78" />

      {/* The nine grahas, 3 × 3. Surya at the centre, in gold. */}
      <g>
        {Array.from({ length: 9 }, (_, i) => {
          const col = i % 3
          const row = Math.floor(i / 3)
          const x = 330 + col * 34
          const y = 148 + row * 34
          const centre = i === 4
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="12.5"
                fill={centre ? '#d7bc78' : '#fbf3e4'}
                stroke={centre ? '#bf9a3f' : '#9c1f16'}
                strokeWidth="1.6"
                opacity={centre ? 1 : 0.85}
              />
              <circle cx={x} cy={y} r="4.5" fill="#9c1f16" opacity={centre ? 0.55 : 0.3} />
            </g>
          )
        })}
      </g>
    </g>
  )
}

/** The hall roof, carrying its array. */
function Solar() {
  return (
    <g>
      {/* Hall: a long low block with a stepped parapet. */}
      <rect x="92" y="176" width="300" height="77" fill="#9c1f16" opacity="0.9" />
      <rect x="84" y="166" width="316" height="12" rx="2" fill="#7f150f" />
      {[110, 150, 190, 230, 270, 310, 350].map((x) => (
        <rect key={x} x={x} y="196" width="22" height="34" rx="11" fill="#fbf3e4" opacity="0.26" />
      ))}
      <rect x="226" y="206" width="32" height="47" rx="2" fill="#5f0f0a" opacity="0.7" />

      {/* Three ranks of panels, raked south and stepped back so the array has depth. */}
      {[
        { x: 104, y: 150 },
        { x: 204, y: 150 },
        { x: 304, y: 150 },
      ].map((p) => (
        <g key={p.x}>
          <path
            d={`M${p.x} ${p.y + 14}L${p.x + 10} ${p.y - 12}h62l-10 26Z`}
            fill="#1c5040"
            opacity="0.92"
          />
          {[0, 1, 2].map((n) => (
            <path
              key={n}
              d={`M${p.x + 16 + n * 18} ${p.y + 13}l10 -25`}
              stroke="#4a8a6e"
              strokeWidth="1.4"
              opacity="0.7"
            />
          ))}
          <path
            d={`M${p.x + 10} ${p.y - 12}h62`}
            stroke="#d7bc78"
            strokeWidth="1.6"
            opacity="0.8"
          />
          <path
            d={`M${p.x + 6} ${p.y + 14}v12M${p.x + 68} ${p.y + 14}v12`}
            stroke="#5f0f0a"
            strokeWidth="2.2"
          />
        </g>
      ))}

      {/* Battery cabinet at the gable end — the half of the project people forget. */}
      <rect x="402" y="208" width="34" height="45" rx="3" fill="#5f0f0a" opacity="0.85" />
      <path d="M414 220l-6 12h8l-4 10 10-14h-8l6-8z" fill="#f2ab21" />

      {/* Rays, picking up the sun already in the frame. */}
      <g stroke="#f2ab21" strokeWidth="2.2" strokeLinecap="round" opacity="0.55">
        <path d="M398 44v-16M430 58l12-11M366 58l-12-11M444 86h16" />
      </g>
    </g>
  )
}

/** The ramp, its landing and the platform lift to the upper hall. */
function Access() {
  return (
    <g>
      {/* The upper hall the ramp is reaching. */}
      <rect x="196" y="120" width="204" height="133" fill="#9c1f16" opacity="0.88" />
      <rect x="188" y="110" width="220" height="12" rx="2" fill="#7f150f" />
      {[216, 256, 296, 336].map((x) => (
        <rect key={x} x={x} y="142" width="22" height="36" rx="11" fill="#fbf3e4" opacity="0.26" />
      ))}

      {/* The eighteen steps, drawn as the obstacle they are. */}
      {Array.from({ length: 7 }, (_, i) => (
        <rect
          key={i}
          x={196 - (i + 1) * 11}
          y={196 + i * 8}
          width="11"
          height={57 - i * 8}
          fill="#7f150f"
          opacity={0.72 - i * 0.04}
        />
      ))}

      {/* Ramp: two flights and a landing, at the 1:12 the drawings specify. */}
      <path d="M40 253l82-36h40l-82 36Z" fill="#2c6b50" opacity="0.9" />
      <path d="M122 217h52v-9h-52Z" fill="#1c5040" opacity="0.9" />
      <path d="M174 208l64-28h40l-64 28Z" fill="#2c6b50" opacity="0.9" />
      <g stroke="#bf9a3f" strokeWidth="2.4" fill="none" strokeLinecap="round">
        <path d="M44 240l80-35M126 205h48M176 196l62-27" />
        <path d="M60 246v-14M96 230v-14M140 212v-12M196 188v-12" strokeWidth="1.6" opacity="0.8" />
      </g>

      {/* Platform lift against the hall: shaft, car and call panel. */}
      <rect x="404" y="128" width="46" height="125" rx="3" fill="#5f0f0a" opacity="0.85" />
      <rect x="411" y="176" width="32" height="40" rx="2" fill="#fbf3e4" opacity="0.8" />
      <path d="M427 182v28M419 190l8-8 8 8" stroke="#2c6b50" strokeWidth="2" fill="none" />
      <circle cx="427" cy="156" r="4" fill="#d7bc78" />
    </g>
  )
}

/** Fallback: the campus itself, for a project with no scene of its own. */
function Campus() {
  return (
    <g>
      <rect x="120" y="172" width="240" height="81" fill="#9c1f16" opacity="0.88" />
      <rect x="112" y="162" width="256" height="12" rx="2" fill="#7f150f" />
      <path d="M196 162l44-56 44 56Z" fill="#7f150f" />
      <rect x="238.5" y="80" width="3" height="18" fill="#bf9a3f" />
      <circle cx="240" cy="77" r="4.5" fill="#d7bc78" />
      {[140, 180, 300, 340].map((x) => (
        <rect key={x} x={x} y="196" width="22" height="36" rx="11" fill="#fbf3e4" opacity="0.26" />
      ))}
      <rect x="226" y="200" width="32" height="53" rx="2" fill="#5f0f0a" opacity="0.7" />
    </g>
  )
}
