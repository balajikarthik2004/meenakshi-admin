import type { TempleEvent } from '@/lib/data/types'
import { festivalISO, id, int, rng } from './seed'

interface EventSeed {
  title: string
  month: number
  day: number
  endMonth?: number
  endDay?: number
  target: number
  collectedPct: number
  ticketPrice?: number
  description: string
}

/** 20 festivals across the temple year, in calendar order from Aadi. */
const SEEDS: EventSeed[] = [
  {
    title: 'Aadi Perukku',
    month: 8,
    day: 3,
    target: 9000,
    collectedPct: 104,
    description:
      'Riverside thanksgiving for the monsoon flood. Kalasa puja at the temple tank followed by annadanam for all attendees.',
  },
  {
    title: 'Varalakshmi Vratam',
    month: 8,
    day: 22,
    target: 18000,
    collectedPct: 71,
    ticketPrice: 51,
    description:
      'The great Friday vratam for Lakshmi. Sponsored kalasam sets for 108 families, group puja in the main hall and evening Sri Suktam homam.',
  },
  {
    title: 'Ganesh Chaturthi',
    month: 9,
    day: 6,
    target: 24000,
    collectedPct: 58,
    description:
      'Clay Vinayaka installation, 21 modakam naivedyam, sahasranama archana and the community visarjan procession on the final evening.',
  },
  ...Array.from({ length: 9 }, (_, i) => ({
    title: `Navaratri Day ${i + 1}`,
    month: 9,
    day: 21 + i,
    target: 8000 + i * 500,
    collectedPct: 42 + i * 6,
    ticketPrice: i % 3 === 0 ? 25 : undefined,
    description: `Day ${i + 1} of the nine nights. Golu darshan, kolattam by the youth group, evening alangaram for the Devi and sponsored annadanam.`,
  })),
  {
    title: 'Vijayadashami',
    month: 9,
    day: 30,
    target: 20000,
    collectedPct: 66,
    description:
      'Vidyarambham for children, aayudha puja for tools and vehicles, and the Saraswati processional on the tenth day of victory.',
  },
  {
    title: 'Deepavali',
    month: 11,
    day: 12,
    target: 32000,
    collectedPct: 47,
    ticketPrice: 15,
    description:
      'Ganga snanam abhishekam at dawn, lamp-lighting across the prakaram, fireworks in the north lot and the temple sweets bazaar.',
  },
  {
    title: 'Karthigai Deepam',
    month: 11,
    day: 24,
    target: 26000,
    collectedPct: 39,
    description:
      'Ten thousand agal lamps around the temple, the great Sokka Panai bonfire and Thirukarthigai deepam at the Sundareswarar sannidhi.',
  },
  {
    title: 'Vaikunta Ekadasi',
    month: 1,
    day: 4,
    target: 28000,
    collectedPct: 33,
    description:
      'Sorga Vasal opening at 4:30 AM, day-long Perumal darshan through the Gate of Heaven, and Tiruppavai parayanam by the bhajan mandali.',
  },
  {
    title: 'Thai Pusam',
    month: 2,
    day: 1,
    target: 22000,
    collectedPct: 30,
    description:
      'Kavadi procession for Murugan, milk-pot abhishekam from the parking lot to the sannidhi, and the golden vel alangaram.',
  },
  {
    title: 'Panguni Uthiram',
    month: 3,
    day: 22,
    target: 24000,
    collectedPct: 35,
    description:
      'The divine wedding day. Kalyana utsavam for Murugan–Deivanai and Meenakshi–Sundareswarar with sponsored thirumangalyam.',
  },
  {
    title: 'Rama Navami',
    month: 4,
    day: 5,
    target: 14000,
    collectedPct: 44,
    description:
      'Sri Rama pattabhishekam, day-long Ramayana parayanam and panakam-neer mor distribution to every visiting family.',
  },
  {
    title: 'Chithirai Festival',
    month: 4,
    day: 26,
    endMonth: 5,
    endDay: 4,
    target: 40000,
    collectedPct: 52,
    ticketPrice: 35,
    description:
      'Nine days of Meenakshi Thirukalyanam — the temple’s signature festival, ending with the Kallazhagar river entry and the grand ther procession.',
  },
]

const COST_TEMPLATES: [string, number][][] = [
  [
    ['Flowers & garlands', 0.18],
    ['Priest honorarium', 0.14],
    ['Annadanam catering', 0.31],
    ['Decor & lighting', 0.12],
    ['Printing & publicity', 0.05],
  ],
  [
    ['Prasadam ingredients', 0.24],
    ['Priest honorarium', 0.16],
    ['Hall setup & rentals', 0.19],
    ['Sound & livestream', 0.09],
    ['Volunteer supplies', 0.04],
  ],
  [
    ['Abhishekam dravyam', 0.21],
    ['Annadanam catering', 0.29],
    ['Security & parking', 0.07],
    ['Decor & lighting', 0.15],
    ['Printing & publicity', 0.04],
  ],
]

/**
 * What a devotee can actually sponsor, three per festival. Priced as a share of the
 * event's target so the ask scales with the occasion — the flowers at a $40,000
 * Chithirai are a bigger undertaking than at a $9,000 Aadi Perukku — then rounded to
 * a round figure a devotee would recognise on a hundi slip.
 *
 * These are deliberately smaller than the published `costs` lines above: a cost line
 * is the temple's whole budget for that head, while a sponsorship is one family's
 * share of it. The three templates track the three cost templates so the offer always
 * matches the character of the festival.
 */
const SPONSORSHIP_TEMPLATES: [string, string, string, number][][] = [
  [
    ['flowers', 'Flowers & garlands', 'Fresh malai for the utsava murti and every sannidhi', 0.05],
    ['annadanam', 'Annadanam for the day', 'Free meals for every family who attends', 0.1],
    ['honorarium', 'Priest honorarium', 'Dakshina for the priests who officiate the day', 0.035],
  ],
  [
    ['prasadam', 'Prasadam ingredients', 'Ghee, jaggery and rice for the day’s naivedyam', 0.045],
    ['decor', 'Decor & lighting', 'Mandapam decoration, kolam and the deepam array', 0.075],
    ['livestream', 'Sound & livestream', 'PA hire and the stream for families abroad', 0.03],
  ],
  [
    ['dravyam', 'Abhishekam dravyam', 'Milk, honey, sandal and panchamirtham', 0.055],
    ['annadanam', 'Annadanam for the day', 'Free meals for every family who attends', 0.1],
    [
      'vastram',
      'Vastram & alangaram',
      'New silk and the jewellery setting for the alangaram',
      0.04,
    ],
  ],
]

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function buildEvents(): TempleEvent[] {
  const r = rng(551201)
  const now = Date.now()

  return SEEDS.map((s, i) => {
    const date = festivalISO(s.month, s.day, 18)
    const endDate = s.endMonth && s.endDay ? festivalISO(s.endMonth, s.endDay, 21) : undefined
    const startMs = new Date(date).getTime()
    const endMs = endDate ? new Date(endDate).getTime() : startMs + 86400000

    const status: TempleEvent['status'] =
      now > endMs ? 'completed' : now >= startMs ? 'ongoing' : 'upcoming'

    const template = COST_TEMPLATES[i % COST_TEMPLATES.length]!
    const costs = template.map(([label, pct]) => ({
      label,
      amount: Math.round((s.target * pct) / 10) * 10,
    }))

    // Rounded to the nearest $25 — a sponsorship is a figure a devotee reads off a
    // board and writes on a cheque, not a computed fraction of a budget.
    const sponsorships = SPONSORSHIP_TEMPLATES[i % SPONSORSHIP_TEMPLATES.length]!.map(
      ([key, label, blurb, pct]) => ({
        key,
        label,
        blurb,
        price: Math.max(25, Math.round((s.target * pct) / 25) * 25),
      }),
    )

    return {
      id: id('evt', i + 1),
      title: s.title,
      slug: slugify(s.title),
      date,
      endDate,
      description: s.description,
      targetAmount: s.target,
      collectedAmount: Math.round((s.target * s.collectedPct) / 100 / 50) * 50,
      costs,
      sponsorships,
      ticketPrice: s.ticketPrice,
      rsvpCount: int(r, 24, 340),
      status,
    }
  }).sort((a, b) => a.date.localeCompare(b.date))
}

export const EVENTS: TempleEvent[] = buildEvents()

/** Lookup for the ledgers, which hold an `eventId` but need to print a title. */
export const EVENT_BY_ID = new Map(EVENTS.map((e) => [e.id, e]))
