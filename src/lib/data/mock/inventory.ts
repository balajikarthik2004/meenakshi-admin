import type {
  PujaReadiness,
  PujaRequirementSheet,
  RequirementEvent,
  RequirementLine,
  StockItem,
  StockMovement,
} from '../types'
import { addDays, iso, id as mkId, offsetISO, rng, today, type Rand } from './seed'
import { PUJA_BY_ID } from './catalog'
import { BOOKINGS, OCCURRENCES } from './bookings'

/**
 * The temple store, seeded.
 *
 * Two things had to be true of this seed for the feature to be demonstrable rather than
 * merely present. First, the ledger and the item master must *agree*: `onHand` is never a
 * typed-in number, it is the balance the movements arrive at. A store screen whose
 * running total disagrees with its own history is the one bug a store keeper will spot in
 * about four seconds.
 *
 * Second, the shelf has to be in proportion to the pujas actually booked, and the
 * shortfalls have to be real ones. Both come from `sizeStore()` below, which reads the
 * demand the booking seed generates and opens the store against it — comfortably for most
 * items, deliberately short for three. A seed where everything is amply in stock
 * demonstrates nothing; one where everything is short demonstrates less than that.
 *
 * The order of the file follows that dependency and cannot be shuffled: items, then
 * sheets, then the sizing pass, then the ledger that lands on the sized figures.
 */

/**
 * How far ahead the seed sizes the store for.
 *
 * Matches `READINESS_WINDOW_DAYS` in `api.ts` — stated here rather than imported because
 * the mock layer must not depend on the API layer that reads it. The two are checked
 * against each other by the readiness screen looking sane, which is the only test this
 * seed has.
 */
const READINESS_SEED_WINDOW_DAYS = 2

interface ItemSpec {
  name: string
  category: StockItem['category']
  unit: StockItem['unit']
  reorderLevel: number
  unitCost: number
  storage: string
  perishable: boolean
}

/* Priced in whole dollars per unit, per the `Money` convention in `types.ts`. */
const ITEM_SPECS: ItemSpec[] = [
  // Flowers — bought fresh, never stocked deep. The perishables are what go short.
  { name: 'Rose garland', category: 'flowers', unit: 'pc', reorderLevel: 12, unitCost: 14, storage: 'Cold room, rack A', perishable: true },
  { name: 'Jasmine string', category: 'flowers', unit: 'metre', reorderLevel: 20, unitCost: 6, storage: 'Cold room, rack A', perishable: true },
  { name: 'Tulsi leaves', category: 'flowers', unit: 'bunch', reorderLevel: 8, unitCost: 3, storage: 'Cold room, rack B', perishable: true },
  { name: 'Marigold loose', category: 'flowers', unit: 'kg', reorderLevel: 5, unitCost: 9, storage: 'Cold room, rack B', perishable: true },
  { name: 'Lotus', category: 'flowers', unit: 'pc', reorderLevel: 10, unitCost: 8, storage: 'Cold room, rack A', perishable: true },

  // Fruits and naivedyam.
  { name: 'Coconut', category: 'fruits', unit: 'pc', reorderLevel: 24, unitCost: 2, storage: 'Store room, bin 1', perishable: false },
  { name: 'Banana', category: 'fruits', unit: 'kg', reorderLevel: 8, unitCost: 4, storage: 'Store room, bin 2', perishable: true },
  { name: 'Betel leaf', category: 'fruits', unit: 'packet', reorderLevel: 6, unitCost: 3, storage: 'Cold room, rack C', perishable: true },

  // Dairy — the abhishekam dravyams, and the ones that move fastest.
  { name: 'Cow ghee', category: 'dairy', unit: 'ml', reorderLevel: 2000, unitCost: 1, storage: 'Store room, shelf 2', perishable: false },
  { name: 'Milk', category: 'dairy', unit: 'l', reorderLevel: 10, unitCost: 3, storage: 'Cold room, shelf 1', perishable: true },
  { name: 'Curd', category: 'dairy', unit: 'l', reorderLevel: 6, unitCost: 4, storage: 'Cold room, shelf 1', perishable: true },
  { name: 'Honey', category: 'dairy', unit: 'ml', reorderLevel: 1000, unitCost: 1, storage: 'Store room, shelf 2', perishable: false },

  // Grains and the annadanam side.
  { name: 'Raw rice', category: 'grains', unit: 'kg', reorderLevel: 25, unitCost: 3, storage: 'Store room, bin 4', perishable: false },
  { name: 'Jaggery', category: 'grains', unit: 'kg', reorderLevel: 8, unitCost: 5, storage: 'Store room, shelf 3', perishable: false },
  { name: 'Sesame seeds', category: 'grains', unit: 'kg', reorderLevel: 4, unitCost: 7, storage: 'Store room, shelf 3', perishable: false },

  // Dravyam and the archana consumables.
  { name: 'Kumkum', category: 'dravyam', unit: 'g', reorderLevel: 500, unitCost: 1, storage: 'Sannidhi cupboard', perishable: false },
  { name: 'Vibhuti', category: 'dravyam', unit: 'g', reorderLevel: 500, unitCost: 1, storage: 'Sannidhi cupboard', perishable: false },
  { name: 'Sandal paste', category: 'dravyam', unit: 'g', reorderLevel: 300, unitCost: 1, storage: 'Sannidhi cupboard', perishable: false },
  { name: 'Camphor', category: 'dravyam', unit: 'packet', reorderLevel: 10, unitCost: 4, storage: 'Sannidhi cupboard', perishable: false },
  { name: 'Agarbatti', category: 'dravyam', unit: 'packet', reorderLevel: 12, unitCost: 3, storage: 'Sannidhi cupboard', perishable: false },

  // Cloth and lamps — slow-moving, but a festival empties them.
  { name: 'Silk vastram', category: 'cloth', unit: 'pc', reorderLevel: 4, unitCost: 65, storage: 'Locked almirah', perishable: false },
  { name: 'Cotton angavastram', category: 'cloth', unit: 'pc', reorderLevel: 8, unitCost: 12, storage: 'Locked almirah', perishable: false },
  { name: 'Lamp oil', category: 'lamp', unit: 'l', reorderLevel: 12, unitCost: 6, storage: 'Store room, bin 6', perishable: false },
  { name: 'Cotton wick', category: 'lamp', unit: 'packet', reorderLevel: 15, unitCost: 2, storage: 'Store room, bin 6', perishable: false },
]

function buildStockItems(): StockItem[] {
  const now = iso(today())
  return ITEM_SPECS.map((s, i) => ({
    id: mkId('stk', i + 1),
    name: s.name,
    category: s.category,
    unit: s.unit,
    // Filled in by `sizeStore()` once the sheets exist and real demand is known.
    onHand: 0,
    reorderLevel: s.reorderLevel,
    unitCost: s.unitCost,
    storage: s.storage,
    perishable: s.perishable,
    active: true,
    updatedAt: now,
  }))
}

export const STOCK_ITEMS: StockItem[] = buildStockItems()
export const STOCK_BY_ID = new Map(STOCK_ITEMS.map((s) => [s.id, s]))
export const STOCK_BY_NAME = new Map(STOCK_ITEMS.map((s) => [s.name, s]))

export const STOCK_CATEGORY_LABELS: Record<StockItem['category'], string> = {
  flowers: 'Flowers',
  fruits: 'Fruits & naivedyam',
  dairy: 'Dairy & dravyam',
  grains: 'Grains & provisions',
  dravyam: 'Archana consumables',
  cloth: 'Cloth & vastram',
  lamp: 'Lamps & oil',
  other: 'Other',
}

export const STOCK_UNITS: StockItem['unit'][] = ['pc', 'kg', 'g', 'l', 'ml', 'bunch', 'packet', 'metre']

/* ------------------------------------------------------------- requirement sheets */

/** Item name → quantity per performance. Names resolve to ids at build time. */
type LineSpec = [name: string, qty: number, optional?: boolean]

/**
 * What each puja actually consumes, per performance.
 *
 * These are the priest's lists, not an accountant's — an abhishekam is heavy on ghee
 * and milk, an alangaram on flowers and cloth, and a kalyanam on everything at once.
 * The quantities are what make the readiness screen interesting: `Ashtalakshmi Deepam`
 * runs weekly and wants lotus, of which the store is seeded four short.
 */
const SHEET_SPECS: Record<string, LineSpec[]> = {
  puja_0001: [
    ['Rose garland', 2],
    ['Marigold loose', 1],
    ['Coconut', 3],
    ['Banana', 2],
    ['Cow ghee', 250],
    ['Kumkum', 50],
    ['Camphor', 1],
    ['Agarbatti', 1, true],
  ],
  puja_0002: [
    ['Tulsi leaves', 2],
    ['Rose garland', 1],
    ['Coconut', 2],
    ['Milk', 2],
    ['Honey', 100],
    ['Vibhuti', 40],
    ['Camphor', 1],
  ],
  puja_0003: [
    ['Rose garland', 6],
    ['Jasmine string', 8],
    ['Lotus', 4],
    ['Silk vastram', 2],
    ['Coconut', 12],
    ['Raw rice', 5],
    ['Cow ghee', 1000],
    ['Milk', 5],
    ['Curd', 2],
    ['Honey', 300],
    ['Jaggery', 3],
    ['Lamp oil', 4],
    ['Cotton wick', 4],
    ['Kumkum', 200],
    ['Sandal paste', 150],
    ['Cotton angavastram', 4, true],
  ],
  puja_0004: [
    ['Lotus', 8],
    ['Marigold loose', 1],
    ['Lamp oil', 2],
    ['Cotton wick', 3],
    ['Cow ghee', 200],
    ['Jaggery', 1],
    ['Camphor', 2],
  ],
  puja_0005: [
    ['Sesame seeds', 1],
    ['Lamp oil', 1],
    ['Cotton wick', 2],
    ['Coconut', 2],
    ['Vibhuti', 60],
    ['Camphor', 1],
  ],
  puja_0006: [
    ['Cow ghee', 400],
    ['Milk', 3],
    ['Curd', 1],
    ['Honey', 150],
    ['Vibhuti', 80],
    ['Sandal paste', 60],
    ['Coconut', 4],
    ['Cotton wick', 2],
  ],
  puja_0007: [
    ['Jasmine string', 4],
    ['Rose garland', 2],
    ['Lamp oil', 2],
    ['Cotton wick', 4],
    ['Coconut', 3],
    ['Banana', 2],
    ['Kumkum', 80],
  ],
  puja_0008: [
    ['Sesame seeds', 1],
    ['Raw rice', 2],
    ['Tulsi leaves', 1],
    ['Betel leaf', 2],
    ['Coconut', 2],
    ['Cotton angavastram', 1],
  ],
  puja_0009: [
    ['Marigold loose', 1],
    ['Coconut', 3],
    ['Jaggery', 2],
    ['Cow ghee', 300],
    ['Banana', 3],
    ['Agarbatti', 2],
  ],
  puja_0010: [
    ['Tulsi leaves', 3],
    ['Rose garland', 1],
    ['Coconut', 2],
    ['Milk', 2],
    ['Raw rice', 2],
    ['Kumkum', 50],
    ['Camphor', 1],
  ],
  puja_0011: [
    ['Cow ghee', 750],
    ['Lamp oil', 2],
    ['Cotton wick', 3],
    ['Coconut', 6],
    ['Jaggery', 2],
    ['Rose garland', 2],
    ['Vibhuti', 100],
  ],
  puja_0012: [
    ['Marigold loose', 2],
    ['Rose garland', 3],
    ['Lotus', 2],
    ['Kumkum', 120],
    ['Coconut', 3],
    ['Lamp oil', 1],
    ['Cotton angavastram', 1, true],
  ],
}

function linesFrom(specs: LineSpec[]): RequirementLine[] {
  return specs.flatMap(([name, qty, optional]) => {
    const item = STOCK_BY_NAME.get(name)
    // A spec naming an item that does not exist is a seed bug, not a runtime state —
    // dropping it keeps the app up and the missing line is visible on the sheet.
    if (!item) return []
    return [
      {
        itemId: item.id,
        label: item.name,
        unit: item.unit,
        qty,
        unitCost: item.unitCost,
        optional,
      },
    ]
  })
}

export const costOfLines = (lines: RequirementLine[]) =>
  lines.reduce((sum, l) => sum + l.qty * l.unitCost, 0)

const evt = (
  action: RequirementEvent['action'],
  actorId: string,
  actorName: string,
  actorRole: RequirementEvent['actorRole'],
  daysAgo: number,
  note?: string,
): RequirementEvent => ({
  at: offsetISO(-daysAgo, 10 + (daysAgo % 6)),
  actorId,
  actorName,
  actorRole,
  action,
  note,
})

const PRIEST = { id: 'usr_priest', name: 'Ramesh Iyer' } as const
const FINANCE = { id: 'usr_finance', name: 'Anitha Rajagopal' } as const
const ADMIN = { id: 'usr_admin', name: 'Meera Sundaram' } as const

/**
 * Sheets seeded across every stage, so each desk opens onto a queue with work in it.
 *
 * Eight are approved and in force, two sit with accounts, one is with the administrator
 * and one is a draft the priest has not sent yet. The distribution is the point: an
 * approvals screen that is empty on first load reads as broken rather than as calm.
 */
function buildSheets(): PujaRequirementSheet[] {
  const sheets: PujaRequirementSheet[] = []
  let n = 0

  const pujaIds = Object.keys(SHEET_SPECS)

  for (const pujaId of pujaIds) {
    const lines = linesFrom(SHEET_SPECS[pujaId]!)
    const estimate = costOfLines(lines)
    const index = pujaIds.indexOf(pujaId)

    // 0–7 approved, 8–9 with finance, 10 with the administrator, 11 still a draft.
    const stage: PujaRequirementSheet['stage'] =
      index <= 7 ? 'approved' : index <= 9 ? 'finance-review' : index === 10 ? 'admin-review' : 'draft'

    const history: RequirementEvent[] = [evt('drafted', PRIEST.id, PRIEST.name, 'priest', 40 + index)]
    let allocatedAmount: number | undefined
    let allocationNote: string | undefined

    if (stage !== 'draft') {
      history.push(evt('submitted', PRIEST.id, PRIEST.name, 'priest', 34 + index))
    }
    if (stage === 'approved' || stage === 'admin-review') {
      // Accounts round up to a working figure and say why — the note is the whole
      // point of the allocation step, and a seed without one teaches nothing.
      allocatedAmount = Math.max(estimate, Math.ceil((estimate * 1.08) / 5) * 5)
      allocationNote =
        allocatedAmount > estimate
          ? 'Rounded up to cover market variation on flowers and ghee.'
          : 'Allocated at the costed estimate.'
      history.push(
        evt('allocated', FINANCE.id, FINANCE.name, 'finance', 26 + index, allocationNote),
      )
    }
    if (stage === 'approved') {
      history.push(evt('approved', ADMIN.id, ADMIN.name, 'admin', 18 + index))
    }

    sheets.push({
      id: mkId('req', ++n),
      pujaCatalogId: pujaId,
      version: 1,
      lines,
      estimatedCost: estimate,
      allocatedAmount,
      allocationNote,
      stage,
      history,
      preparedById: PRIEST.id,
      preparedByName: PRIEST.name,
      createdAt: offsetISO(-(40 + index), 9),
      updatedAt: history[history.length - 1]!.at,
    })
  }

  // One sheet that has been round the loop — sent back by accounts, revised, and is
  // now back with them. Without it the timeline component never shows a `sent-back`
  // rail in the seed, which is the entry a reviewer most wants to see rendered.
  const revisedPuja = 'puja_0005'
  const revised = sheets.find((s) => s.pujaCatalogId === revisedPuja)
  if (revised) {
    revised.history.splice(
      2,
      0,
      evt(
        'sent-back',
        FINANCE.id,
        FINANCE.name,
        'finance',
        30,
        'Sesame at 1 kg a sitting looks high against last year’s usage — please recheck.',
      ),
      evt('resubmitted', PRIEST.id, PRIEST.name, 'priest', 28, 'Rechecked against the Bhairava homam register; 1 kg is correct.'),
    )
  }

  return sheets
}

export const REQUIREMENT_SHEETS: PujaRequirementSheet[] = buildSheets()

/* ------------------------------------------------------------ sizing the store */

/**
 * Opening stock, derived from what the booked pujas actually consume.
 *
 * Hand-picked opening figures were the first attempt and they were wrong in a way that
 * only showed up on screen: the booking seed materialises something like twenty pujas
 * across the readiness window, the readiness check spends stock down cumulatively as it
 * walks that window, and a shelf sized by eye for "a normal week" left almost every row
 * red. A store screen where everything is short says nothing about anything.
 *
 * So the shelf is sized from the demand the rest of the seed generates. Most items open
 * at a comfortable multiple of it; the three named below open deliberately short, which
 * is what gives the readiness screen something real to be red about on the first load.
 * Sizing this way also means the seed stays honest if the booking seed ever changes its
 * volume — the store follows it rather than drifting quietly out of proportion.
 */

/** Opened deliberately short, so the shortfall path is exercised by the seed itself. */
const SEEDED_SHORT = new Set(['Lotus', 'Sesame seeds', 'Sandal paste'])

/** Opened just under the reorder mark — low, but not yet stopping anything. */
const SEEDED_LOW = new Set(['Cow ghee', 'Jasmine string'])

function sizeStore() {
  const approved = new Map(
    REQUIREMENT_SHEETS.filter((s) => s.stage === 'approved').map((s) => [s.pujaCatalogId, s]),
  )
  const pujaOfBooking = new Map(BOOKINGS.map((b) => [b.id, b.pujaCatalogId]))

  // The same window the readiness screen reads, so the two are sized against each other.
  const from = today().getTime()
  const to = addDays(today(), READINESS_SEED_WINDOW_DAYS).getTime()

  const demand = new Map<string, number>()
  for (const o of OCCURRENCES) {
    const when = new Date(o.scheduledAt).getTime()
    if (o.status !== 'scheduled' || when < from || when > to) continue
    const sheet = approved.get(pujaOfBooking.get(o.bookingId) ?? '')
    if (!sheet) continue
    for (const l of sheet.lines) demand.set(l.itemId, (demand.get(l.itemId) ?? 0) + l.qty)
  }

  for (const item of STOCK_ITEMS) {
    const needed = demand.get(item.id) ?? 0

    // Nothing in the window wants it — the authored reorder level is the whole story,
    // and a comfortable multiple of it is as good an opening figure as any.
    if (needed === 0) {
      item.onHand = Math.round(item.reorderLevel * 1.6)
      continue
    }

    // The reorder level follows demand too. A level of 12 garlands against a window
    // that consumes 40 would mark the shelf "fine" right up to the morning it runs out.
    item.reorderLevel = Math.max(item.reorderLevel, Math.ceil(needed * 0.5))

    const factor = SEEDED_SHORT.has(item.name) ? 0.45 : SEEDED_LOW.has(item.name) ? 0.95 : 1.45
    item.onHand = Math.max(1, Math.round(needed * factor))
  }
}
sizeStore()

/**
 * Six weeks of ledger, ending at exactly the `onHand` each item is seeded with.
 *
 * Built backwards: the balance is walked from today's figure back through a plausible
 * run of receipts and issues, then the whole list is reversed so it reads forwards with
 * a correct running balance. Building it forwards from a guessed opening figure would
 * mean the two ends never quite meeting, which is the one thing this ledger cannot do.
 */
function buildMovements(): StockMovement[] {
  const r = rng(90210)
  const rows: StockMovement[] = []
  const base = today()
  let n = 0

  for (const item of STOCK_ITEMS) {
    // Perishables turn over weekly; provisions are bought in bulk far less often.
    const steps = item.perishable ? 9 : 5
    let balance = item.onHand
    const back: StockMovement[] = []

    for (let s = 0; s < steps; s++) {
      const daysAgo = 3 + s * (item.perishable ? 4 : 8) + Math.floor(r() * 3)
      // Alternating so the ledger reads as a real rhythm: buy a lot, spend it down.
      const isReceipt = s % 2 === 1
      const magnitude = Math.max(1, Math.round(item.reorderLevel * (0.3 + r() * 0.7)))
      const qty = isReceipt ? magnitude : -Math.max(1, Math.round(magnitude * 0.6))

      back.push({
        id: mkId('mov', ++n),
        itemId: item.id,
        kind: isReceipt ? 'received' : 'issued',
        qty,
        balance,
        note: isReceipt ? 'Purchased for the store' : 'Issued to the sannidhi',
        actorName: isReceipt ? 'Meera Sundaram' : 'Ramesh Iyer',
        at: iso(addDays(base, -daysAgo)),
      })
      // Step back to what the balance must have been *before* this movement.
      balance -= qty
    }

    // One opening line so the earliest balance in the ledger has a stated origin
    // rather than appearing out of nowhere.
    back.push({
      id: mkId('mov', ++n),
      itemId: item.id,
      kind: 'adjusted',
      qty: balance,
      balance,
      note: 'Opening stock count',
      actorName: 'Meera Sundaram',
      at: iso(addDays(base, -60)),
    })

    rows.push(...back.reverse())
  }

  return rows.sort((a, b) => a.at.localeCompare(b.at))
}

export const STOCK_MOVEMENTS: StockMovement[] = buildMovements()

/**
 * A handful of readiness sign-offs already on the board.
 *
 * Only for occurrences inside the next two days, and only where the puja behind the
 * occurrence has an approved sheet — seeding a confirmation against a sheet that was
 * never approved would put the screen into a state its own rules cannot produce.
 */
function buildReadiness(): PujaReadiness[] {
  const approved = new Set(
    REQUIREMENT_SHEETS.filter((s) => s.stage === 'approved').map((s) => s.pujaCatalogId),
  )
  const pujaOfBooking = new Map(BOOKINGS.map((b) => [b.id, b.pujaCatalogId]))
  const horizon = addDays(today(), 2).getTime()
  const rows: PujaReadiness[] = []
  let n = 0
  const r: Rand = rng(4242)

  for (const o of OCCURRENCES) {
    const when = new Date(o.scheduledAt).getTime()
    if (when < today().getTime() || when > horizon) continue
    if (o.status !== 'scheduled') continue

    const pujaId = pujaOfBooking.get(o.bookingId)
    if (!pujaId || !approved.has(pujaId)) continue

    // The seed signs off roughly half of what is in the window, so the priest's
    // worklist opens with both settled rows and rows still asking for a decision.
    if (r() > 0.5) continue

    rows.push({
      id: mkId('rdy', ++n),
      occurrenceId: o.id,
      status: 'confirmed',
      byId: PRIEST.id,
      byName: PRIEST.name,
      at: offsetISO(-1, 8),
      movementIds: [],
    })
  }

  return rows
}

export const PUJA_READINESS: PujaReadiness[] = buildReadiness()

/** Sheets that are in force right now, one per puja — what a readiness check reads. */
export const approvedSheetFor = (
  sheets: PujaRequirementSheet[],
  pujaCatalogId: string,
): PujaRequirementSheet | undefined =>
  sheets.find((s) => s.pujaCatalogId === pujaCatalogId && s.stage === 'approved')

/** Puja name for a sheet, for screens that list sheets without loading the catalogue. */
export const pujaNameFor = (pujaCatalogId: string) =>
  PUJA_BY_ID.get(pujaCatalogId)?.name ?? 'Unknown puja'
