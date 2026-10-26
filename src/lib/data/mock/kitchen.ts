import type { KitchenOrder, MenuItem, OrderLine } from '@/lib/data/types'
import { DEVOTEES } from './users'
import { chance, id, int, pick, rng } from './seed'
import { estimateMinutes, kitchenStatusAt, linesSubtotal } from '@/lib/kitchen'

/**
 * The temple cafeteria board.
 *
 * These are the dishes the Devasthanam actually publishes, in the six groupings it
 * publishes them under. Prices are not published anywhere the app can read, so they
 * are set for a Houston temple canteen in 2026 — under a restaurant, because the
 * kitchen is run by volunteers and the point of it is that a family can eat after
 * darshan without thinking about it. `price` is the only field to change when the
 * office hands over its own list.
 *
 * Everything here is vegetarian, so nothing records it — a tick against all of them
 * would carry no information. What does vary is recorded: which dishes are cooked
 * without onion and garlic, which carry nuts, and which service each belongs to.
 * Idly is a breakfast dish and the board does not offer it at eight in the evening,
 * because the kitchen does not cook it then.
 */
export const MENU: MenuItem[] = [
  /* ------------------------------------------------------- breakfast items */
  {
    id: 'mnu_0001',
    image: '/menu/idli.jpg',
    name: 'Idly',
    tamilName: 'இட்லி',
    description: 'Steamed rice cakes, served with sambar and coconut chutney.',
    category: 'breakfast',
    price: 4,
    prepMinutes: 5,
    servedAt: ['breakfast', 'evening'],
    available: true,
    noOnionGarlic: true,
    popular: true,
  },
  {
    id: 'mnu_0002',
    image: '/menu/poori-masala.jpg',
    name: 'Puri & Sabji',
    description: 'Two pooris with potato sabji.',
    category: 'breakfast',
    price: 7,
    prepMinutes: 12,
    servedAt: ['breakfast'],
    available: true,
  },

  /* -------------------------------------------------------- dosa varieties */
  {
    id: 'mnu_0003',
    image: '/menu/masala-dosa.jpg',
    name: 'Masala Dosa',
    tamilName: 'மசால் தோசை',
    description: 'Crisp rice crêpe folded over spiced potato, with sambar and chutney.',
    category: 'dosa',
    price: 8,
    prepMinutes: 12,
    servedAt: ['breakfast', 'lunch', 'evening'],
    available: true,
    popular: true,
  },
  {
    id: 'mnu_0004',
    image: '/menu/mysore-masala-dosa.jpg',
    name: 'Mysore Masala Dosa',
    description: 'Masala dosa spread with red chutney before it is folded.',
    category: 'dosa',
    price: 9,
    prepMinutes: 13,
    servedAt: ['breakfast', 'lunch', 'evening'],
    available: true,
    spicy: true,
    popular: true,
  },
  {
    id: 'mnu_0005',
    image: '/menu/plain-dosa.jpg',
    name: 'Plain Dosa',
    description: 'Rice crêpe cooked to order, with sambar and coconut chutney.',
    category: 'dosa',
    price: 6.5,
    prepMinutes: 10,
    servedAt: ['breakfast', 'lunch', 'evening'],
    available: true,
    noOnionGarlic: true,
  },
  {
    id: 'mnu_0006',
    image: '/menu/onion-dosa.jpg',
    name: 'Onion Dosa',
    description: 'Dosa cooked with finely chopped onion and green chilli.',
    category: 'dosa',
    price: 8,
    prepMinutes: 13,
    servedAt: ['breakfast', 'lunch', 'evening'],
    available: true,
    spicy: true,
  },

  /* ------------------------------------------------------ snacks & starters */
  {
    id: 'mnu_0007',
    image: '/menu/medu-vada.jpg',
    name: 'Vada',
    tamilName: 'வடை',
    description: 'Two urad dal fritters, crisp outside and soft within.',
    category: 'snacks',
    price: 4.5,
    prepMinutes: 8,
    servedAt: ['breakfast', 'evening'],
    available: true,
    popular: true,
  },
  {
    id: 'mnu_0008',
    image: '/menu/spring-rolls.jpg',
    name: 'Spring Rolls',
    description: 'Four vegetable spring rolls, fried to order.',
    category: 'snacks',
    price: 5.5,
    prepMinutes: 10,
    servedAt: ['evening'],
    available: true,
  },
  {
    id: 'mnu_0009',
    image: '/menu/cutlets.jpg',
    name: 'Cutlets',
    description: 'Two vegetable cutlets with mint chutney.',
    category: 'snacks',
    price: 5,
    prepMinutes: 9,
    servedAt: ['evening'],
    available: true,
  },
  {
    id: 'mnu_0010',
    image: '/menu/bonda.jpg',
    name: 'Bonda',
    description: 'Three fried dumplings, light and crisp.',
    category: 'snacks',
    price: 4,
    prepMinutes: 8,
    servedAt: ['breakfast', 'evening'],
    available: true,
  },

  /* ----------------------------------------------------- rice & main dishes */
  {
    id: 'mnu_0011',
    image: '/menu/veg-pulao.jpg',
    name: 'Vegetable Pulao',
    description: 'Basmati rice cooked with vegetables and whole spices, with raita.',
    category: 'rice',
    price: 9,
    prepMinutes: 10,
    servedAt: ['lunch', 'evening'],
    available: true,
    containsNuts: true,
  },
  {
    id: 'mnu_0012',
    image: '/menu/pongal.jpg',
    name: 'Pongal',
    tamilName: 'வெண் பொங்கல்',
    description: 'Rice and moong dal with pepper, cumin and cashew in ghee.',
    category: 'rice',
    price: 5.5,
    prepMinutes: 6,
    servedAt: ['breakfast', 'lunch'],
    available: true,
    noOnionGarlic: true,
    containsNuts: true,
  },
  {
    id: 'mnu_0013',
    image: '/menu/puliyodarai.jpg',
    name: 'Tamarind Rice',
    tamilName: 'புளியோதரை',
    description: 'Puliyodarai made the temple way, served with appalam.',
    category: 'rice',
    price: 5.5,
    prepMinutes: 4,
    servedAt: ['lunch', 'evening'],
    available: true,
    noOnionGarlic: true,
    containsNuts: true,
    popular: true,
  },
  {
    id: 'mnu_0014',
    image: '/menu/curd-rice.jpg',
    name: 'Yogurt Rice',
    tamilName: 'தயிர் சாதம்',
    description: 'Rice in set curd with ginger, green chilli and pomegranate.',
    category: 'rice',
    price: 5,
    prepMinutes: 4,
    servedAt: ['lunch', 'evening'],
    available: true,
    noOnionGarlic: true,
  },

  /* ------------------------------------------------ beverages & refreshments */
  {
    id: 'mnu_0015',
    image: '/menu/mango-lassi.jpg',
    name: 'Mango Lassi',
    description: 'Yogurt blended with mango pulp and a little cardamom.',
    category: 'beverages',
    price: 4.5,
    prepMinutes: 3,
    servedAt: ['breakfast', 'lunch', 'evening'],
    available: true,
    noOnionGarlic: true,
    popular: true,
  },
  {
    id: 'mnu_0016',
    image: '/menu/sweet-lassi.jpg',
    name: 'Sweet Lassi',
    description: 'Churned yogurt, sweetened and chilled.',
    category: 'beverages',
    price: 4,
    prepMinutes: 3,
    servedAt: ['breakfast', 'lunch', 'evening'],
    available: true,
    noOnionGarlic: true,
  },
  {
    id: 'mnu_0017',
    image: '/menu/masala-chai.jpg',
    name: 'Tea',
    description: 'Black tea with ginger, cardamom and milk.',
    category: 'beverages',
    price: 2,
    prepMinutes: 3,
    servedAt: ['breakfast', 'lunch', 'evening'],
    available: true,
    noOnionGarlic: true,
  },
  {
    id: 'mnu_0018',
    image: '/menu/filter-coffee.jpg',
    name: 'Coffee',
    tamilName: 'டிகிரி காபி',
    description: 'Degree filter coffee, in a tumbler and dabara.',
    category: 'beverages',
    price: 2.5,
    prepMinutes: 3,
    servedAt: ['breakfast', 'lunch', 'evening'],
    available: true,
    noOnionGarlic: true,
    popular: true,
  },
  {
    id: 'mnu_0019',
    name: 'Water Bottle',
    description: 'Chilled bottled water, 500ml.',
    category: 'beverages',
    price: 1,
    prepMinutes: 1,
    servedAt: ['breakfast', 'lunch', 'evening'],
    available: true,
    noOnionGarlic: true,
  },

  /* -------------------------------------------------------- weekend & shelf */
  {
    /* The published menu promises "unique snacks prepared fresh every weekend"
       rather than naming them, so the board says exactly that and `servedOn`
       keeps it off the weekday menu instead of a sentence asking people to
       remember which days it applies to. */
    id: 'mnu_0020',
    image: '/menu/bajji.jpg',
    name: 'Weekend Special Snack',
    description: 'Whatever the kitchen has made fresh this weekend — ask at the counter.',
    category: 'weekend',
    price: 5,
    prepMinutes: 9,
    servedAt: ['breakfast', 'lunch', 'evening'],
    servedOn: [0, 6],
    available: true,
  },
  {
    id: 'mnu_0021',
    image: '/menu/savouries.jpg',
    name: 'South Indian Savouries',
    description: 'Murukku, mixture and ribbon pakoda, packed to take home.',
    category: 'weekend',
    price: 6,
    prepMinutes: 2,
    servedAt: ['breakfast', 'lunch', 'evening'],
    available: true,
  },
]

export const MENU_BY_ID = new Map(MENU.map((m) => [m.id, m]))

export const MENU_CATEGORIES: { key: MenuItem['category']; label: string; blurb: string }[] = [
  { key: 'breakfast', label: 'Breakfast Items', blurb: 'Idly, puri and the morning board' },
  { key: 'dosa', label: 'Dosa Varieties', blurb: 'Cooked to order on the griddle' },
  { key: 'snacks', label: 'Snacks & Starters', blurb: 'Fried fresh through the evening' },
  { key: 'rice', label: 'Rice & Main Dishes', blurb: 'Full plates and temple rice' },
  { key: 'beverages', label: 'Beverages', blurb: 'Lassi, filter coffee and tea' },
  {
    key: 'weekend',
    label: 'Weekend & Shelf',
    blurb: 'Weekend specials and savouries to take home',
  },
]

/** Counter tokens run A-01 upward and reset each service. */
export function tokenFor(n: number): string {
  const letter = String.fromCharCode(65 + (Math.floor((n - 1) / 99) % 26))
  return `${letter}-${String(((n - 1) % 99) + 1).padStart(2, '0')}`
}

/**
 * A handful of tickets already on the rail.
 *
 * Seeded relative to *now* rather than to a fixed clock, and only when the kitchen is
 * actually open, so opening the board during a service shows a working rail and
 * opening it on a Monday correctly shows nothing. Two sit unaccepted on purpose —
 * the board's whole job is to make those impossible to miss, and a rail with none of
 * them demonstrates nothing.
 */
function buildOrders(): KitchenOrder[] {
  const now = new Date()
  const status = kitchenStatusAt(now)
  if (!status.serving || !status.current) return []

  const r = rng(8812470)
  const meal = status.current.meal
  const day = now.getDay()
  const servable = MENU.filter(
    (m) => m.available && m.servedAt.includes(meal) && (!m.servedOn || m.servedOn.includes(day)),
  )
  if (servable.length === 0) return []

  const NOTES = ['Less spicy please.', 'No coriander.', 'Extra chutney if possible.']

  // Oldest first, so the collected and ready tickets sit behind the new ones.
  const plan: { status: KitchenOrder['status']; minsAgo: number }[] = [
    { status: 'collected', minsAgo: 46 },
    { status: 'collected', minsAgo: 38 },
    { status: 'ready', minsAgo: 24 },
    { status: 'ready', minsAgo: 17 },
    { status: 'preparing', minsAgo: 12 },
    { status: 'preparing', minsAgo: 8 },
    { status: 'placed', minsAgo: 4 },
    { status: 'placed', minsAgo: 1 },
  ]

  return plan.map((p, i) => {
    const n = i + 1
    const user = pick(r, DEVOTEES)
    const lines: OrderLine[] = Array.from({ length: int(r, 1, 3) }, () => {
      const item = pick(r, servable)
      return { itemId: item.id, name: item.name, qty: int(r, 1, 3), unitPrice: item.price }
    }).filter((l, idx, all) => all.findIndex((x) => x.itemId === l.itemId) === idx)

    const subtotal = linesSubtotal(lines)
    const donationAmount = chance(r, 35) ? pick(r, [1, 2, 5]) : 0
    const placed = new Date(now.getTime() - p.minsAgo * 60000)
    const promised = estimateMinutes(lines, MENU, i)

    const order: KitchenOrder = {
      id: id('ord', n),
      token: tokenFor(n),
      userId: user.id,
      contactName: user.name,
      contactPhone: user.phone,
      meal,
      lines,
      subtotal,
      donationAmount,
      total: subtotal + donationAmount,
      status: p.status,
      paymentMethod: chance(r, 70) ? 'card' : 'cash-at-counter',
      promisedMinutes: promised,
      note: chance(r, 25) ? pick(r, NOTES) : undefined,
      placedAt: placed.toISOString(),
    }

    if (p.status !== 'placed') {
      order.acceptedAt = new Date(placed.getTime() + 90_000).toISOString()
    }
    if (p.status === 'ready' || p.status === 'collected') {
      order.readyAt = new Date(placed.getTime() + promised * 60000).toISOString()
    }
    if (p.status === 'collected') {
      order.collectedAt = new Date(placed.getTime() + (promised + 6) * 60000).toISOString()
    }
    return order
  })
}

export const KITCHEN_ORDERS: KitchenOrder[] = buildOrders()
