import type { Cadence, Money, PujaAddOn, PujaCatalogItem } from '@/lib/data/types'

/** Offered on every recurring sponsorship (Section 10.5, Step 3). */
export const STANDARD_ADDONS: PujaAddOn[] = [
  { id: 'prasadam-post', label: 'Prasadam by post', price: 60 },
  { id: 'birthday-archana', label: 'Extra Archana on birthday', price: 40 },
  { id: 'livestream-reminder', label: 'Livestream reminder email', price: 0 },
]

/**
 * Deity artwork is rendered as a generated gradient tile rather than a photograph —
 * the prototype ships no binary assets. `imageUrl` stays on the type for the real build.
 */
export const PUJA_CATALOG: PujaCatalogItem[] = [
  {
    id: 'puja_0001',
    name: 'Murugar Puja',
    deity: 'Murugan',
    type: 'monthly',
    basePrice: 350,
    durationMin: 45,
    defaultCadence: 'monthly',
    recurringRule: 'Every 3rd Thursday',
    description:
      'Monthly abhishekam and archana at the Murugan sannidhi with vel puja, offered in your family name with sankalpam by the officiating priest.',
    addOns: STANDARD_ADDONS,
    active: true,
  },
  {
    id: 'puja_0002',
    name: 'Venkateshwara Perumal Puja',
    deity: 'Venkateshwara',
    type: 'yearly',
    basePrice: 500,
    durationMin: 150,
    defaultCadence: 'weekly',
    recurringRule: 'Every Saturday',
    description:
      'Weekly Saturday thirumanjanam for Perumal with tulsi archana, sahasranama parayanam and evening deeparadhana in your name through the year.',
    addOns: STANDARD_ADDONS,
    active: true,
  },
  {
    id: 'puja_0003',
    name: 'Meenakshi–Sundareswarar Kalyanam',
    deity: 'Meenakshi',
    type: 'yearly',
    basePrice: 750,
    durationMin: 180,
    defaultCadence: 'yearly',
    recurringRule: 'Chithirai month, annually',
    description:
      'The temple’s flagship celestial wedding. Sponsors are named in the sankalpam, seated in the front mandapam and receive the kalyana prasadam thali.',
    addOns: STANDARD_ADDONS,
    active: true,
  },
  {
    id: 'puja_0004',
    name: 'Ashtalakshmi Deepam',
    deity: 'Lakshmi',
    type: 'yearly',
    basePrice: 200,
    durationMin: 45,
    defaultCadence: 'weekly',
    recurringRule: 'Every Friday',
    description:
      'Friday evening lamp offering to the eight forms of Lakshmi with kumkum archana and Sri Suktam parayanam.',
    addOns: STANDARD_ADDONS,
    active: true,
  },
  {
    id: 'puja_0005',
    name: 'Bhairava Puja',
    deity: 'Sundareswarar',
    type: 'yearly',
    basePrice: 250,
    durationMin: 60,
    defaultCadence: 'weekly',
    recurringRule: 'Every Ashtami',
    description:
      'Ashtami night puja to Kala Bhairava with vada malai, sesame lamp and rahu kalam archana for protection and removal of obstacles.',
    addOns: STANDARD_ADDONS,
    active: true,
  },
  {
    id: 'puja_0006',
    name: 'Pradosha Puja',
    deity: 'Sundareswarar',
    type: 'abhishekam',
    basePrice: 150,
    durationMin: 60,
    defaultCadence: 'monthly',
    recurringRule: 'Every Pradosham (twice monthly)',
    description:
      'Abhishekam to Sundareswarar and Nandi during the pradosha hour with milk, honey, sandal and vibhuti, followed by deeparadhana.',
    addOns: STANDARD_ADDONS,
    active: true,
  },
  {
    id: 'puja_0007',
    name: 'Pournami Puja',
    deity: 'Meenakshi',
    type: 'yearly',
    basePrice: 150,
    durationMin: 60,
    defaultCadence: 'monthly',
    recurringRule: 'Every full moon',
    description:
      'Full-moon archana and alangaram for Meenakshi Amman with lalitha sahasranama parayanam and pournami deepam.',
    addOns: STANDARD_ADDONS,
    active: true,
  },
  {
    id: 'puja_0008',
    name: 'Amavasya Tarpanam',
    deity: 'Sundareswarar',
    type: 'one-time',
    basePrice: 100,
    durationMin: 45,
    defaultCadence: 'one-time',
    recurringRule: 'Every new moon',
    description:
      'New-moon ancestral tarpanam performed by the priest on your behalf with your gothra and pitru names recited in the sankalpam.',
    addOns: STANDARD_ADDONS,
    active: true,
  },
  {
    id: 'puja_0009',
    name: 'Ganesha Sahasranama',
    deity: 'Ganesha',
    type: 'one-time',
    basePrice: 300,
    durationMin: 75,
    defaultCadence: 'one-time',
    recurringRule: 'On request',
    description:
      'The thousand names of Vinayaka chanted with modakam naivedyam and durva archana — traditionally sponsored before a new venture or a house move.',
    addOns: STANDARD_ADDONS,
    active: true,
  },
  {
    id: 'puja_0010',
    name: 'Sri Rama Puja',
    deity: 'Venkateshwara',
    type: 'yearly',
    basePrice: 250,
    durationMin: 60,
    defaultCadence: 'monthly',
    recurringRule: 'Every Punarvasu nakshatra day',
    description:
      'Monthly puja on Punarvasu with Rama nama parayanam, tulsi archana and pattabhishekam alangaram for the Rama parivar.',
    addOns: STANDARD_ADDONS,
    active: true,
  },
  {
    id: 'puja_0011',
    name: 'Ayyappan Puja',
    deity: 'Ayyappan',
    type: 'monthly',
    basePrice: 200,
    durationMin: 60,
    defaultCadence: 'monthly',
    recurringRule: 'First Saturday of the Malayalam month',
    description:
      'Neyyabhishekam and padi puja for Ayyappan with sharanam chanting — the mandala-season favourite of our Sabarimala pilgrim families.',
    addOns: STANDARD_ADDONS,
    active: true,
  },
  {
    id: 'puja_0012',
    name: 'Durga Puja',
    deity: 'Durga',
    type: 'alangaram',
    basePrice: 300,
    durationMin: 75,
    defaultCadence: 'monthly',
    recurringRule: 'Every Tuesday of the ascending moon',
    description:
      'Kumkumarchana and special alangaram for Durga Devi with lemon-garland lamps and Devi Mahatmyam parayanam.',
    addOns: STANDARD_ADDONS,
    active: true,
  },
]

export const PUJA_BY_ID = new Map(PUJA_CATALOG.map((p) => [p.id, p]))

/** How many times a cadence comes round in a year. */
export const OCCURRENCES_PER_YEAR: Record<Cadence, number> = {
  daily: 365,
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
  'one-time': 1,
}

/**
 * Direct cost as a share of the sponsorship price, per puja.
 *
 * `basePrice` buys a full year at the puja's *default* cadence, so the per-occurrence
 * cost is the annual cost divided by that cadence's yearly count. Most pujas run a
 * healthy margin; a couple are thin, and the Kalyanam runs at a deliberate loss — the
 * temple performs its flagship festival whether or not it pays for itself, and the
 * board should see that plainly rather than have it averaged away.
 */
const DIRECT_COST_RATIO: Record<string, number> = {
  puja_0001: 0.58, // Murugar Puja
  puja_0002: 0.64, // Venkateshwara Perumal
  puja_0003: 1.12, // Meenakshi–Sundareswarar Kalyanam — run at a loss, by choice
  puja_0004: 0.47, // Ashtalakshmi Deepam
  puja_0005: 0.55, // Bhairava Puja
  puja_0006: 0.71, // Pradosha Puja
  puja_0007: 0.62, // Pournami Puja
  puja_0008: 0.44, // Amavasya Tarpanam
  puja_0009: 0.52, // Ganesha Sahasranama
  puja_0010: 0.66, // Sri Rama Puja
  puja_0011: 0.93, // Ayyappan Puja — thin, heavy on neyyabhishekam ghee
  puja_0012: 0.49, // Durga Puja
}

/** Cost of performing this puja once — flowers, dravyam, prasadam and priest time. */
export function unitCostOf(puja: PujaCatalogItem): Money {
  const ratio = DIRECT_COST_RATIO[puja.id] ?? 0.6
  const perYear = OCCURRENCES_PER_YEAR[puja.defaultCadence]
  return Math.round((puja.basePrice * ratio) / perYear)
}

/**
 * Cadences ordered from rarest to most frequent. A sponsorship is only offered at the
 * puja's own rhythm or one step either side of it — a temple does not sell a daily
 * Chithirai Kalyanam, and pricing a $100 new-moon tarpanam as a daily endowment gives
 * the nonsense figure of $36,500 a year.
 */
export const CADENCE_LADDER: Cadence[] = [
  'one-time',
  'yearly',
  'quarterly',
  'monthly',
  'weekly',
  'daily',
]

/** The cadences a devotee may actually choose for this puja. */
export function cadenceOptions(puja: PujaCatalogItem): Cadence[] {
  const i = CADENCE_LADDER.indexOf(puja.defaultCadence)
  return CADENCE_LADDER.slice(Math.max(0, i - 1), i + 2)
}

/**
 * What a sponsorship costs at a given cadence.
 *
 * `basePrice` buys a year at the puja's default rhythm, and the price scales with how
 * many times it is actually performed. That has to stay linear: the temple really does
 * buy flowers, milk and prasadam every single time, so any discount curve would put
 * frequent sponsorships permanently below direct cost. Bounding the *cadence* rather
 * than bending the *price* is what keeps the figures both honest and realistic.
 */
export function priceForCadence(puja: PujaCatalogItem, cadence: Cadence): Money {
  const ratio = OCCURRENCES_PER_YEAR[cadence] / OCCURRENCES_PER_YEAR[puja.defaultCadence]
  return Math.max(puja.basePrice, Math.round((puja.basePrice * ratio) / 5) * 5)
}

export const PUJA_UNIT_COST: Record<string, Money> = Object.fromEntries(
  PUJA_CATALOG.map((p) => [p.id, unitCostOf(p)]),
)

/** Deity → gradient pair, used by PujaCard in place of photography. */
export const DEITY_GRADIENT: Record<string, [string, string]> = {
  Meenakshi: ['#2f6b52', '#4a8a6e'],
  Sundareswarar: ['#6b1a10', '#b87938'],
  Venkateshwara: ['#8a2515', '#d4a25c'],
  Lakshmi: ['#a88336', '#f4dcae'],
  Ganesha: ['#a3341f', '#e6c58a'],
  Murugan: ['#1f5040', '#c9a24a'],
  Ayyappan: ['#2e0a04', '#4a8a6e'],
  Durga: ['#4a1108', '#c9a24a'],
}
