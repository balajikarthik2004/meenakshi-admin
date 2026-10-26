import type {
  FacilityBooking,
  FacilityEventType,
  FacilitySlotKey,
  FacilitySlotSpec,
  FacilityVenue,
  Money,
} from '@/lib/data/types'
import { DEVOTEES } from './users'
import { addDays, iso, id, int, pick, rng, today } from './seed'

/**
 * The hall programme — what the temple hires out, and the register of who has it.
 *
 * The four venues are the ones a temple of this size actually lets: a wedding hall
 * that seats four hundred, a mini hall for the sixty-guest functions that make up
 * most of the book, the dining hall that is usually hired alongside one of them, and
 * the open-air mandapam. Rates are per slot, and the seeded register below is built
 * so that it is *legal* — no two bookings that hold a venue ever overlap, because the
 * whole point of this module is that the availability check is real. If the seed
 * contained a double booking the calendar would open on a conflict nobody made.
 */

export const FACILITY_SLOTS: FacilitySlotSpec[] = [
  { key: 'morning', label: 'Morning', startHour: 7, endHour: 14, hint: '7:00 am – 2:00 pm' },
  { key: 'evening', label: 'Evening', startHour: 16, endHour: 22, hint: '4:00 pm – 10:00 pm' },
  { key: 'full-day', label: 'Full day', startHour: 7, endHour: 22, hint: '7:00 am – 10:00 pm' },
]

export const SLOT_BY_KEY = new Map(FACILITY_SLOTS.map((s) => [s.key, s]))

export const FACILITY_VENUES: FacilityVenue[] = [
  {
    id: 'ven_0001',
    slug: 'kalyana-mandapam',
    name: 'Kalyana Mandapam',
    kind: 'hall',
    capacity: 400,
    // A full day is priced under the two halves: the hall is let once, cleaned once,
    // and a family that takes the whole day saves the office a second turnaround.
    rates: { morning: 1200, evening: 1400, 'full-day': 2200 },
    deposit: 500,
    // Three weeks. A wedding here needs the caretaker rota, the kitchen warned and
    // the car park stewarded, none of which the office can arrange in a fortnight.
    minNoticeDays: 21,
    amenities: [
      'Raised stage with homa kunda',
      'Bridal and groom changing rooms',
      'Air conditioned',
      'Seats 400 banquet style',
      'Adjoining dining hall',
      'Parking for 120 cars',
    ],
    description:
      'The temple’s wedding hall, and the only space with a permanent homa kunda vented for a full muhurtham. Weddings, receptions and upanayanams are held here; the stage, the changing rooms and the dining hall next door come with the hire.',
    active: true,
  },
  {
    id: 'ven_0002',
    slug: 'mini-hall',
    name: 'Mini Hall',
    kind: 'mini-hall',
    capacity: 120,
    rates: { morning: 450, evening: 520, 'full-day': 800 },
    deposit: 200,
    minNoticeDays: 10,
    amenities: [
      'Seats 120 theatre style',
      'Projector and screen',
      'Air conditioned',
      'Pantry access',
      'Step-free entrance',
    ],
    description:
      'A smaller room off the east corridor for seemanthams, birthdays, satsangs and study circles. Most of the hall book is this room — it is the right size for a function of sixty.',
    active: true,
  },
  {
    id: 'ven_0003',
    slug: 'dining-hall',
    name: 'Dining Hall',
    kind: 'dining',
    capacity: 180,
    rates: { morning: 300, evening: 340, 'full-day': 560 },
    deposit: 150,
    minNoticeDays: 7,
    amenities: [
      'Seats 180 at long tables',
      'Serving counter and wash line',
      'Commercial kitchen access',
      'Vegetarian catering only',
    ],
    description:
      'The annadanam dining hall, hired on its own for a lunch or alongside the Kalyana Mandapam for a wedding meal. Catering must be vegetarian and arranged through the temple kitchen.',
    active: true,
  },
  {
    id: 'ven_0004',
    slug: 'open-air-mandapam',
    name: 'Open-Air Mandapam',
    kind: 'open-air',
    capacity: 250,
    rates: { morning: 400, evening: 450, 'full-day': 700 },
    deposit: 150,
    minNoticeDays: 10,
    amenities: [
      'Covered stone pavilion',
      'Seats 250',
      'Beside the temple tank',
      'Evening lighting',
      'No air conditioning',
    ],
    description:
      'The pillared pavilion by the tank, used for thirumanjanam, cultural evenings and the overflow at a large wedding. Open to the weather on three sides — the office will advise against it in July and August.',
    active: true,
  },
]

export const VENUE_BY_ID = new Map(FACILITY_VENUES.map((v) => [v.id, v]))

/** Hire extras, charged on top of the slot rate. */
export const FACILITY_ADDONS: { label: string; price: Money; unit: string }[] = [
  { label: 'Folding chairs', price: 2, unit: 'per chair' },
  { label: 'Banquet tables', price: 12, unit: 'per table' },
  { label: 'Vegetarian catering', price: 18, unit: 'per plate' },
  { label: 'Sound system & microphones', price: 150, unit: 'flat' },
  { label: 'Stage lighting', price: 220, unit: 'flat' },
  { label: 'Floral stage decoration', price: 340, unit: 'flat' },
  { label: 'Cleaning crew', price: 180, unit: 'flat' },
  { label: 'Priest for the ceremony', price: 251, unit: 'flat' },
]

export const FACILITY_EVENT_TYPES: {
  key: FacilityEventType
  label: string
  /** Steers the default slot — a muhurtham is a morning, a reception is not. */
  defaultSlot: FacilitySlotKey
}[] = [
  { key: 'wedding', label: 'Wedding / Kalyanam', defaultSlot: 'full-day' },
  { key: 'reception', label: 'Reception', defaultSlot: 'evening' },
  { key: 'upanayanam', label: 'Upanayanam', defaultSlot: 'morning' },
  { key: 'seemantham', label: 'Seemantham / Valaikappu', defaultSlot: 'morning' },
  { key: 'birthday', label: 'Birthday / Ayush homam', defaultSlot: 'morning' },
  { key: 'satsang', label: 'Satsang / Bhajan', defaultSlot: 'evening' },
  { key: 'community', label: 'Community gathering', defaultSlot: 'evening' },
  { key: 'other', label: 'Something else', defaultSlot: 'morning' },
]

export const EVENT_TYPE_BY_KEY = new Map(FACILITY_EVENT_TYPES.map((e) => [e.key, e]))

/**
 * The seeded register.
 *
 * Built against a set of taken slots so that nothing in it double-books a venue. The
 * generator asks for a (venue, day, slot) and walks on if that holds something
 * already — which is the same rule `lib/facility.ts` enforces against new requests,
 * stated once here so the seed cannot contradict the engine.
 */
function buildFacilityBookings(): FacilityBooking[] {
  const r = rng(660331)
  const base = today()
  const out: FacilityBooking[] = []
  const held = new Set<string>()

  const hold = (venueId: string, day: string, slot: FacilitySlotKey) => {
    // A full day collides with both halves, so every booking claims all the keys it
    // would block. One `has` then answers the question for any slot.
    const keys =
      slot === 'full-day'
        ? ['morning', 'evening', 'full-day']
        : [slot, 'full-day']
    if (keys.some((k) => held.has(`${venueId}|${day}|${k}`))) return false
    for (const k of keys) held.add(`${venueId}|${day}|${k}`)
    return true
  }

  const slots: FacilitySlotKey[] = ['morning', 'evening', 'full-day']
  let seq = 0

  /**
   * What each room is actually used for.
   *
   * Drawing an occasion uniformly put weddings in the dining hall, which is the sort
   * of detail that makes seeded data read as noise. Nothing enforces this at booking
   * time — a family may hire any room for anything — but the register the office
   * opens on should look like a register.
   */
  const typesFor: Record<FacilityVenue['kind'], FacilityEventType[]> = {
    hall: ['wedding', 'reception', 'upanayanam', 'seemantham', 'community'],
    'mini-hall': ['upanayanam', 'seemantham', 'birthday', 'satsang', 'other'],
    dining: ['community', 'satsang', 'birthday', 'other'],
    'open-air': ['satsang', 'community', 'reception', 'birthday'],
  }

  // Past bookings are completed, near ones confirmed, far ones a mix — so the queue
  // opens with something to decide and the calendar with something to show.
  //
  // The loop runs well past the number of bookings wanted because `hold` rejects a
  // collision rather than retrying it; roughly a third of attempts land on a slot
  // that is already gone, which is itself what a well-used hall book looks like.
  // The Kalyana Mandapam is weighted: weddings are most of the trade.
  const draw = [...FACILITY_VENUES, FACILITY_VENUES[0]!, FACILITY_VENUES[0]!, FACILITY_VENUES[1]!]

  for (let i = 0; i < 110; i++) {
    const venue = pick(r, draw)
    const offset = int(r, -50, 120)
    const date = addDays(base, offset)
    const day = date.toISOString().slice(0, 10)
    const slot = pick(r, slots)
    if (!hold(venue.id, day, slot)) continue

    const eventType = pick(r, typesFor[venue.kind])
    const expectedGuests = int(r, 30, Math.min(venue.capacity, 380))
    const items = FACILITY_ADDONS.filter(() => r() > 0.6).map((it) => ({
      label: it.label,
      qty: it.unit === 'flat' ? 1 : int(r, 20, 160),
      price: it.price,
    }))

    const hireCharge = venue.rates[slot]
    const addOnsTotal = items.reduce<number>((s, it) => s + it.qty * it.price, 0)
    const discountPct = r() > 0.6 ? 10 : 0
    const discount = Math.round(((hireCharge + addOnsTotal) * discountPct) / 100)

    const status: FacilityBooking['status'] =
      offset < 0 ? 'completed' : offset < 20 ? 'confirmed' : pick(r, ['confirmed', 'pending', 'pending', 'declined'])

    const user = pick(r, DEVOTEES)
    const createdAt = iso(addDays(date, -int(r, 25, 70)))

    out.push({
      id: id('fac', ++seq),
      reference: `HALL-${2600 + seq}`,
      userId: user.id,
      venueId: venue.id,
      date: iso(date),
      slot,
      eventType,
      expectedGuests,
      items,
      hireCharge,
      addOnsTotal,
      discountPct,
      total: hireCharge + addOnsTotal - discount,
      deposit: venue.deposit,
      depositPaidAt:
        status === 'confirmed' || status === 'completed' ? iso(addDays(date, -14)) : undefined,
      status,
      contactPhone: user.phone,
      notes: undefined,
      declineReason:
        status === 'declined' ? 'The hall is already held for a temple event that day.' : undefined,
      createdAt,
      decidedAt: status === 'pending' ? undefined : iso(addDays(date, -int(r, 10, 24))),
    })
  }

  return out.sort((a, b) => a.date.localeCompare(b.date))
}

export const FACILITY_BOOKINGS: FacilityBooking[] = buildFacilityBookings()
