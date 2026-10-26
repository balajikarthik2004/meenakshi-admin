import type { ClassEnrolment, ISODate, SchoolClass, SchoolTerm } from '@/lib/data/types'
import { DEVOTEES } from './users'
import { chance, id, int, pick, rng } from './seed'
import { holdsSeat } from '@/lib/school'

/**
 * The Vedic Heritage School — the temple's Hindu WISDOM Program.
 *
 * The shape is taken from the school's own published page: the Purna Vidya
 * curriculum of nine progressive levels for ages five to sixteen, running alternate
 * Sundays from 8:45 to 12:30 across the academic year, with a Parents' Corner
 * alongside it, plus shloka assembly, yoga, chess and a seva programme for the
 * high-school students.
 *
 * Two things here are *not* from that page and are marked where they appear. The
 * Tamil, Sanskrit and music classes were asked for separately and are modelled on
 * what a temple of this size normally runs. And no fee is published anywhere, so
 * every `fee` is a placeholder — that is the one field to change when the
 * coordinators hand over their own schedule.
 */

export const SCHOOL_TERM: SchoolTerm = {
  id: 'trm_2026',
  name: '2026–27 Academic Year',
  // Orientation through the last class, as the school's calendar publishes them.
  startDate: new Date(2026, 7, 30).toISOString(),
  endDate: new Date(2027, 4, 23).toISOString(),
  registrationOpens: new Date(2026, 2, 1).toISOString(),
  /*
   * Registration really closes before the year opens.
   *
   * The school's own page says registration for the *following* year opens the
   * March before it, so by late October the current year is under way and nothing
   * can be registered for it. Faithful — and it would leave the whole module
   * reading "closed" for most of the year, including today, with nothing to
   * demonstrate.
   *
   * So the published cut-off is kept below and overridden by one flag. Set
   * `LATE_ENROLMENT_OPEN` to false to enforce the real calendar.
   */
  registrationCloses: new Date(2026, 7, 29).toISOString(),
  cadence: 'Alternate Sundays',
  status: 'in-progress',
}

/** TEMPORARY — see the note on `registrationCloses`. Set to false to restore it. */
const LATE_ENROLMENT_OPEN = true

if (LATE_ENROLMENT_OPEN) {
  SCHOOL_TERM.registrationCloses = new Date(2027, 2, 31).toISOString()
  SCHOOL_TERM.status = 'open'
}

/**
 * The published class calendar.
 *
 * The school teaches on named, numbered Sundays rather than simply "every other
 * week", and the dates are not a clean fortnightly series — the gap between Class
 * #5 and #6 is three weeks, and #8 and #9 are consecutive. Deriving them from a
 * rule would produce a timetable that disagrees with the one handed out on the
 * first day, so they are listed exactly as published.
 *
 * Only the Fall is published so far; the Spring dates follow in the new year.
 */
export interface SchoolSession {
  label: string
  date: ISODate
  /** Where this Sunday differs from the usual 8:45–12:30. */
  note?: string
}

export const HWP_CALENDAR: SchoolSession[] = [
  { label: 'Orientation', date: new Date(2026, 7, 30).toISOString() },
  { label: 'Class #2', date: new Date(2026, 8, 13).toISOString() },
  { label: 'Class #3', date: new Date(2026, 8, 27).toISOString() },
  { label: 'Class #4', date: new Date(2026, 9, 11).toISOString() },
  {
    label: 'Class #5',
    date: new Date(2026, 9, 25).toISOString(),
    note: 'Saraswathi Pooja Day — 9:15–10:45 AM',
  },
  { label: 'Class #6', date: new Date(2026, 10, 15).toISOString() },
  { label: 'Class #7', date: new Date(2026, 10, 29).toISOString() },
  { label: 'Class #8', date: new Date(2026, 11, 6).toISOString() },
  { label: 'Class #9', date: new Date(2026, 11, 13).toISOString() },
]

/** The school's own caveat, reproduced so the page cannot overstate the calendar. */
export const CALENDAR_CAVEAT =
  'These class dates are not final and are subject to change in accordance with temple requirements.'

/** The next published session on or after a given day. */
export function nextSession(on: Date = new Date()): SchoolSession | undefined {
  const t = on.getTime()
  return HWP_CALENDAR.find((s) => new Date(s.date).getTime() >= t)
}

/** Where the school teaches. Used on the class cards and the printed register. */
const ROOMS = {
  hall: 'Upper hall',
  annexe: 'Education annexe',
  class: (n: number) => `Classroom ${n}`,
  music: 'Music room',
  yoga: 'Yoga studio',
  library: 'Library',
} as const

/**
 * The eleven Purna Vidya classes, as the school describes them.
 *
 * Not "Level 1" through "Level 9". The home page summarises the curriculum as nine
 * progressive levels, but the Classes Description page sets out eleven classes with
 * names of their own — Ramayana, Bhagavath Purana, Values — and a parent looking for
 * where their child goes is looking for those names. Mahabharata is two classes
 * because the school splits the itihasa in two, and the ages are theirs.
 */
const PURNA_VIDYA: {
  key: string
  name: string
  minAge: number
  maxAge: number
  summary: string
  description: string
}[] = [
  {
    key: 'beginners-1',
    name: 'Beginners 1',
    minAge: 5,
    maxAge: 6,
    summary: 'The deities, and the stories that carry their morals.',
    description:
      'The entry-level class. It introduces the various Gods and deities — Lord Krishna, Lord ' +
      'Ganesha and others — through short stories, and draws out the moral of each. Tales from ' +
      'the Panchatantra are covered alongside them.',
  },
  {
    key: 'beginners-2',
    name: 'Beginners 2',
    minAge: 6,
    maxAge: 7,
    summary: 'Shiva, Parvathi, Ganesha and Vishnu, and how they relate.',
    description:
      'Well-known stories of Lord Shiva, Goddess Parvathi, Lord Ganesha and Lord Vishnu, with ' +
      'other celestial beings introduced. These simple stories from the Puranas let children ' +
      'understand the deities and the relationships between them.',
  },
  {
    key: 'ramayana',
    name: 'Ramayana',
    minAge: 7,
    maxAge: 8,
    summary: 'The immortal itihasa, and dharma against adharma.',
    description:
      'The Ramayana taught in full — the epic that symbolises dharma and adharma. Students learn ' +
      'the story and the morals that run through it, and work through the characters, what they ' +
      'did and why.',
  },
  {
    key: 'bhagavath-purana',
    name: 'Bhagavath Purana',
    minAge: 8,
    maxAge: 9,
    summary: 'The Shrimad Bhagavatam, and the Dasha avatara.',
    description:
      'Tales from the Shrimad Bhagavatam: stories of Lord Vishnu, and of kings and devotees such ' +
      'as Dhruva and Harishchandra, their trials and their adherence to dharma. The class goes on ' +
      'to the Dasha avatara and what each of the ten teaches.',
  },
  {
    key: 'mahabharata-1',
    name: 'Mahabharata · Part 1',
    minAge: 9,
    maxAge: 10,
    summary: 'Adi Parva to Virata Parva.',
    description:
      'The first half of the Mahabharata, which the school teaches across two classes. From the ' +
      'origins of the Kuru dynasty through to the thirteen-year exile of the Pandavas. Students ' +
      'learn the characters and begin to debate the dharma and adharma in what they do.',
  },
  {
    key: 'mahabharata-2',
    name: 'Mahabharata · Part 2',
    minAge: 10,
    maxAge: 11,
    summary: 'Udyoga Parva to Shanti Parva, and Kurukshetra.',
    description:
      'The second half: the Udyoga Parva through to the Shanti Parva, covering the events leading ' +
      'up to and including the Kurukshetra war, and the arguments on both sides of it.',
  },
  {
    key: 'values',
    name: 'Values',
    minAge: 10,
    maxAge: 11,
    summary: 'Ethics and morals, and thinking about them independently.',
    description:
      'Ethics and morals as taught by our Vedic culture. Students are taught to think ' +
      'independently about right and wrong — what to do, what not to do, and the reasons behind ' +
      'the do’s and don’ts rather than the rules alone.',
  },
  {
    key: 'isvara',
    name: 'Isvara & Religious Discipline',
    minAge: 11,
    maxAge: 12,
    summary: 'Isvara as cause, and the disciplines of practice.',
    description:
      'Isvara — the intelligent and material cause of the whole creation — covering the ' +
      'panchabhutas, ista devatas and navagrahas. The class also studies the forms of religious ' +
      'discipline: vows, japa, fasting, pilgrimage and charity.',
  },
  {
    key: 'sanatana-dharma',
    name: 'Religious Culture & Sanatana Dharma',
    minAge: 12,
    maxAge: 13,
    summary: 'The arts, traditions and practices still followed today.',
    description:
      'The spiritual and humanistic religious culture of India — its arts and literature, ' +
      'traditions, practices, vows and pilgrimages. Sanatana Dharma is covered as tradition, ' +
      'philosophy and practice, exploring purusharthas, samskaras, avatara, karma and rebirth.',
  },
  {
    key: 'vedanta',
    name: 'Vedanta & Human Development',
    minAge: 13,
    maxAge: 14,
    summary: 'Spiritual, emotional and intellectual growth, for teenagers.',
    description:
      'The Vedic philosophies addressing the non-physical aspects of human growth — spiritual, ' +
      'emotional and intellectual — pitched specifically at teenagers. It also covers the ' +
      'contributions of Sanatana Dharma to architecture, medicine, science and music, and how to ' +
      'bring those values into one’s own life.',
  },
  {
    key: 'bhagavad-gita',
    name: 'Bhagavad Gita',
    minAge: 14,
    maxAge: 16,
    summary: 'The last class of the programme.',
    description:
      'The key teachings of the Bhagavad Gita, their meanings and their implications in a modern ' +
      'world. The final class of the VHS programme, meant to give a strong foundation for a ' +
      'spiritual pursuit that continues after school.',
  },
]

const PV_TEACHERS = [
  'Vidya Madabushi',
  'Venkat Prasad',
  'Madhuri Vasudevan',
  'Shanthi Raghavan',
  'Geetha Subramanian',
]

function purnaVidyaClasses(): SchoolClass[] {
  return PURNA_VIDYA.map((l, i) => ({
    id: `cls_pv${i + 1}`,
    slug: `purna-vidya-${l.key}`,
    code: `PV-${i + 1}`,
    name: l.name,
    category: 'purna-vidya' as const,
    summary: l.summary,
    description: l.description,
    minAge: l.minAge,
    maxAge: l.maxAge,
    audience: 'child' as const,
    day: 0,
    startTime: '08:45',
    endTime: '12:30',
    room: ROOMS.class(i + 1),
    teacher: PV_TEACHERS[i % PV_TEACHERS.length]!,
    fee: 180,
    capacity: 24,
    // Seeded as a real register reads: the younger classes fill first.
    enrolled: [22, 24, 21, 19, 17, 15, 14, 12, 10, 8, 7][i]!,
    prerequisiteClassId: i > 0 ? `cls_pv${i}` : undefined,
    notes: [
      'Purna Vidya teaching guides and books are provided — there is no separate cost for books.',
      'Alternate Sundays. The published calendar is handed out at Orientation.',
      'At least 70% attendance is expected across the year.',
    ],
    active: true,
  }))
}

const OTHER_CLASSES: SchoolClass[] = [
  /* ---------------------------------------------------------------- languages */
  {
    id: 'cls_tam1',
    slug: 'tamil-beginners',
    code: 'TAM-1',
    name: 'Tamil · Beginners',
    category: 'language',
    summary: 'The alphabet, reading simple words, and speaking at home.',
    description:
      'For children who hear Tamil at home but have never read or written it. The year covers ' +
      'the uyir and mei letters, joining them into words, reading short passages aloud, and ' +
      'enough conversation to use with grandparents. No prior reading is assumed.',
    minAge: 6,
    maxAge: 12,
    audience: 'child',
    day: 0,
    startTime: '09:00',
    endTime: '10:15',
    room: ROOMS.annexe,
    teacher: 'Kalaivani Murugesan',
    fee: 150,
    capacity: 20,
    enrolled: 16,
    notes: ['Workbook included.', 'Taught in Tamil and English together.'],
    active: true,
  },
  {
    id: 'cls_tam2',
    slug: 'tamil-intermediate',
    code: 'TAM-2',
    name: 'Tamil · Intermediate',
    category: 'language',
    summary: 'Reading fluently, writing paragraphs, and the Thirukkural.',
    description:
      'For students who can already read the Tamil script. The year builds reading speed, ' +
      'moves writing from sentences to paragraphs, and works through selected Thirukkural ' +
      'couplets with their meaning.',
    minAge: 9,
    maxAge: 16,
    audience: 'child',
    day: 0,
    startTime: '10:30',
    endTime: '11:45',
    room: ROOMS.annexe,
    teacher: 'Kalaivani Murugesan',
    fee: 150,
    capacity: 20,
    enrolled: 11,
    prerequisiteClassId: 'cls_tam1',
    notes: ['Reading the script is assumed — the coordinators will place new students.'],
    active: true,
  },
  {
    id: 'cls_san1',
    slug: 'sanskrit-beginners',
    code: 'SAN-1',
    name: 'Sanskrit · Beginners',
    category: 'language',
    summary: 'Devanagari, and reading the shlokas you already chant.',
    description:
      'Devanagari from the first letter, with the aim that a student can read a shloka they ' +
      'already know by heart and see what the words are doing. Grammar is introduced only as ' +
      'far as it helps the reading.',
    minAge: 8,
    maxAge: 16,
    audience: 'child',
    day: 0,
    startTime: '09:00',
    endTime: '10:15',
    room: ROOMS.library,
    teacher: 'Dr Ramanathan Iyer',
    fee: 150,
    capacity: 18,
    enrolled: 9,
    notes: ['Pairs well with Purna Vidya Level 5 and above.'],
    active: true,
  },

  /* -------------------------------------------------------------------- music */
  {
    id: 'cls_voc1',
    slug: 'carnatic-vocal-beginners',
    code: 'MUS-1',
    name: 'Carnatic Vocal · Beginners',
    category: 'music',
    summary: 'Sarali varisai through to the first geethams.',
    description:
      'The beginning of a Carnatic training: shruti and sitting posture, the sarali, janta and ' +
      'alankaram exercises, and the first geethams. Students sing in the temple on Navaratri ' +
      'and at the year-end concert.',
    minAge: 7,
    maxAge: 16,
    audience: 'child',
    day: 0,
    startTime: '09:00',
    endTime: '10:15',
    room: ROOMS.music,
    teacher: 'Smt. Jayashree Balan',
    fee: 220,
    capacity: 14,
    enrolled: 14,
    notes: ['A shruti box or tanpura app is needed for practice at home.'],
    active: true,
  },
  {
    id: 'cls_voc2',
    slug: 'carnatic-vocal-intermediate',
    code: 'MUS-2',
    name: 'Carnatic Vocal · Intermediate',
    category: 'music',
    summary: 'Varnams, kritis, and singing with the mridangam.',
    description:
      'For students past the geethams. The year covers swarajathis and varnams, two or three ' +
      'kritis learned properly, and rehearsing with a mridangam accompanist.',
    minAge: 9,
    maxAge: 18,
    audience: 'child',
    day: 0,
    startTime: '10:30',
    endTime: '11:45',
    room: ROOMS.music,
    teacher: 'Smt. Jayashree Balan',
    fee: 240,
    capacity: 12,
    enrolled: 8,
    prerequisiteClassId: 'cls_voc1',
    notes: ['Placement is by a short hearing with the teacher before the first class.'],
    active: true,
  },
  {
    id: 'cls_mri1',
    slug: 'mridangam',
    code: 'MUS-3',
    name: 'Mridangam',
    category: 'music',
    summary: 'From the first sollukattu to accompanying a vocalist.',
    description:
      'Hand position, the basic sollukattus, and the tala cycles — worked slowly and by ear. ' +
      'Senior students accompany the vocal class at the year-end concert.',
    minAge: 8,
    maxAge: 18,
    audience: 'child',
    day: 0,
    startTime: '10:30',
    endTime: '11:45',
    room: ROOMS.class(10),
    teacher: 'Sri Karthik Narayanan',
    fee: 260,
    capacity: 10,
    enrolled: 6,
    notes: [
      'Students bring their own mridangam. The school has two loan instruments.',
      'Daily practice of twenty minutes is expected.',
    ],
    active: true,
  },
  {
    id: 'cls_vee1',
    slug: 'veena',
    code: 'MUS-4',
    name: 'Veena',
    category: 'music',
    summary: 'The temple instrument, from first position upward.',
    description:
      'Veena from the beginning: holding and tuning the instrument, the sarali exercises on ' +
      'the fretboard, and simple kritis by the end of the year.',
    minAge: 10,
    maxAge: 18,
    audience: 'child',
    day: 0,
    startTime: '09:00',
    endTime: '10:15',
    room: ROOMS.class(11),
    teacher: 'Smt. Lalitha Venkatesh',
    fee: 260,
    capacity: 8,
    enrolled: 8,
    notes: ['Students bring their own veena.'],
    active: true,
  },

  /* -------------------------------------------------------------- wellbeing */
  {
    id: 'cls_yog_s',
    slug: 'yoga-students',
    code: 'YOG-S',
    name: 'Yoga for Students',
    category: 'wellbeing',
    summary: 'Asana and breathing, pitched at school age.',
    description:
      'A gentle class in asana and pranayama for the school students, run alongside the Purna ' +
      'Vidya morning. No experience needed and nothing to bring but loose clothes.',
    minAge: 7,
    maxAge: 16,
    audience: 'child',
    day: 0,
    startTime: '11:45',
    endTime: '12:15',
    room: ROOMS.yoga,
    teacher: 'Sri Mohan Das',
    fee: 90,
    capacity: 30,
    enrolled: 18,
    notes: [
      'Thirty minutes. Mats are provided — please dress comfortably.',
      'Parents are welcome to join, space permitting.',
    ],
    active: true,
  },
  {
    id: 'cls_yog_p',
    slug: 'yoga-parents',
    code: 'YOG-P',
    name: 'Yoga for Parents',
    category: 'parents',
    summary: 'While your children are in class.',
    description:
      'Part of the Parents’ Corner. A 45-minute session for parents waiting through the ' +
      'school morning — asana, breathing, and a short relaxation.',
    minAge: 18,
    audience: 'adult',
    day: 0,
    startTime: '11:00',
    endTime: '11:45',
    room: ROOMS.yoga,
    teacher: 'Sri Mohan Das',
    fee: 60,
    capacity: 25,
    enrolled: 13,
    notes: ['Open only to parents of enrolled students.'],
    active: true,
  },
  {
    id: 'cls_par_g',
    slug: 'parents-gita',
    code: 'PAR-1',
    name: 'Vishnu Sahasranamam & Bhagavad Gita',
    category: 'parents',
    summary: 'The Parents’ Corner study session.',
    description:
      'Parents chant the Vishnu Sahasranamam together and then read a passage of the Bhagavad ' +
      'Gita with commentary. Come to either half or both. No fee and no registration needed — ' +
      'listed here so the morning’s timetable is in one place.',
    minAge: 18,
    audience: 'adult',
    day: 0,
    startTime: '10:00',
    endTime: '10:45',
    room: ROOMS.hall,
    teacher: 'Sri Ramesh Iyer',
    fee: 0,
    capacity: 60,
    enrolled: 31,
    notes: ['Free, and open to any parent at the temple that morning.'],
    active: true,
  },

  /* ------------------------------------------------------------- enrichment */
  {
    id: 'cls_shl',
    slug: 'shloka-assembly',
    code: 'ENR-1',
    name: 'Assembly & Bhajan',
    category: 'enrichment',
    summary: 'Four assembly groups, by age, before class.',
    description:
      'Every school Sunday opens with assembly. There are four groups — Junior, Junior ' +
      'Intermediate, Senior Intermediate and Senior — and a student is placed in theirs by age. ' +
      'The session lasts thirty minutes. Included for every enrolled student, so there is ' +
      'nothing to book.',
    minAge: 5,
    maxAge: 16,
    audience: 'child',
    day: 0,
    startTime: '09:15',
    endTime: '09:45',
    room: ROOMS.hall,
    teacher: 'VHS Coordinators',
    fee: 0,
    capacity: 200,
    enrolled: 147,
    notes: [
      'Four groups: Junior, Junior Intermediate, Senior Intermediate and Senior.',
      'Students arriving after 9:45 AM may need help joining without disturbing others.',
      'Parents are welcome to observe; seating is limited.',
    ],
    active: true,
  },
  {
    id: 'cls_che',
    slug: 'chess',
    code: 'ENR-2',
    name: 'Chess',
    category: 'enrichment',
    summary: 'Optional, and genuinely competitive by the spring.',
    description:
      'An optional class running alongside the school morning. Openings and endgames taught ' +
      'properly, with a ladder through the year and a tournament in the spring.',
    minAge: 7,
    maxAge: 16,
    audience: 'child',
    day: 0,
    startTime: '11:45',
    endTime: '12:30',
    room: ROOMS.class(12),
    teacher: 'Sri Anand Krishnamurthy',
    fee: 75,
    capacity: 24,
    enrolled: 20,
    notes: ['Boards and clocks provided.'],
    active: true,
  },
  {
    id: 'cls_sev',
    slug: 'seva-programme',
    code: 'ENR-3',
    name: 'Seva Programme',
    category: 'enrichment',
    summary: 'Selfless service as part of spiritual growth.',
    description:
      'The Seva Project encourages students into selfless service as part of their spiritual ' +
      'growth — volunteering at the temple, assisting with projects, organising events and ' +
      'teaching younger students. It also takes in care for the environment, such as cleanups ' +
      'and tree planting.',
    minAge: 14,
    maxAge: 15,
    audience: 'youth',
    day: 0,
    startTime: '08:45',
    endTime: '12:30',
    room: 'Across the campus',
    teacher: 'Venkat Prasad',
    fee: 0,
    capacity: 20,
    enrolled: 12,
    notes: ['Service hours are logged and certified.', 'A short interview before joining.'],
    active: true,
  },
]

export const SCHOOL_CLASSES: SchoolClass[] = [...purnaVidyaClasses(), ...OTHER_CLASSES]

export const CLASS_BY_ID = new Map(SCHOOL_CLASSES.map((c) => [c.id, c]))

/**
 * Enrolments already on the register.
 *
 * Deliberately a fraction of each class's `enrolled` count. That count is the real
 * register, including every family who signed up on paper at the desk; these are
 * only the ones that came through this app, which is why the two are not the same
 * number and must not be made to agree. A couple sit unpaid on purpose — the
 * school's own process is pay-then-register, so chasing a payment is routine work
 * and the console needs something to do it against.
 */
function buildEnrolments(): ClassEnrolment[] {
  const r = rng(5520118)
  const out: ClassEnrolment[] = []

  const CHILD_NAMES = [
    'Aarav',
    'Diya',
    'Vihaan',
    'Ananya',
    'Arjun',
    'Meera',
    'Rohan',
    'Kavya',
    'Ishaan',
    'Nila',
    'Karthik',
    'Tara',
    'Aditya',
    'Shreya',
    'Nikhil',
    'Pooja',
  ]

  const bookable = SCHOOL_CLASSES.filter((c) => c.fee > 0)

  for (let i = 0; i < 18; i++) {
    const cls = pick(r, bookable)
    const parent = pick(r, DEVOTEES)
    const surname = parent.name.split(' ').slice(-1)[0]!
    const age = int(r, cls.minAge, cls.maxAge ?? cls.minAge + 4)

    // Most are settled; a few are waiting on a cheque, one or two on the list.
    const roll = r()
    const status: ClassEnrolment['status'] =
      roll < 0.17 ? 'pending-payment' : roll < 0.28 ? 'waitlisted' : 'enrolled'

    const method: ClassEnrolment['paymentMethod'] =
      status === 'pending-payment' ? pick(r, ['check', 'zelle'] as const) : 'card'

    const createdAt = new Date(
      new Date(SCHOOL_TERM.registrationOpens).getTime() + int(r, 1, 160) * 86400000,
    )

    out.push({
      id: id('enr', i + 1),
      termId: SCHOOL_TERM.id,
      classId: cls.id,
      userId: parent.id,
      studentName: `${pick(r, CHILD_NAMES)} ${surname}`,
      studentAge: age,
      guardianName: parent.name,
      guardianPhone: parent.phone,
      guardianEmail: parent.email,
      status,
      fee: cls.fee,
      paymentMethod: method,
      paidAt: status === 'enrolled' ? createdAt.toISOString() : undefined,
      waitlistPosition: status === 'waitlisted' ? int(r, 1, 4) : undefined,
      notes: chance(r, 22)
        ? pick(r, [
            'Please seat with an older sibling if possible.',
            'Peanut allergy — no prasadam with nuts.',
            'Will arrive by 9:15 on alternate weeks.',
          ])
        : undefined,
      createdAt: createdAt.toISOString(),
    })
  }

  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export const CLASS_ENROLMENTS: ClassEnrolment[] = buildEnrolments()

/** Seats a class holds from this app's own enrolments. Used by the register view. */
export const appSeatsFor = (classId: string): number =>
  CLASS_ENROLMENTS.filter((e) => e.classId === classId && holdsSeat(e.status)).length
