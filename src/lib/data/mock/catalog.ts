import type { PujaAddOn, PujaCatalogItem } from '@/lib/data/types'

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
    type: 'monthly',
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
    type: 'monthly',
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
    type: 'monthly',
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
    type: 'monthly',
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

/** Direct cost of performing one occurrence — flowers, milk, priest time, prasadam. */
export const PUJA_UNIT_COST: Record<string, number> = {
  puja_0001: 128,
  puja_0002: 205,
  puja_0003: 340,
  puja_0004: 72,
  puja_0005: 96,
  puja_0006: 61,
  puja_0007: 58,
  puja_0008: 44,
  puja_0009: 105,
  puja_0010: 92,
  puja_0011: 88,
  puja_0012: 118,
}

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
