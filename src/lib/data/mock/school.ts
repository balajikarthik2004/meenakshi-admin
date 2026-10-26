import type { ClassEnrolment, SchoolClass, SchoolTerm } from '@/lib/data/types'
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
  // The dates the school publishes for the year.
  startDate: new Date(2026, 7, 30).toISOString(),
  endDate: new Date(2027, 4, 23).toISOString(),
  registrationOpens: new Date(2026, 2, 1).toISOString(),
  /*
   * Late enrolment stays open into the spring.
   *
   * The school's published cut-off is just before the first Sunday, but it does in
   * practice take families who arrive mid-year — the coordinators place the child
   * after a short assessment, which is what the prerequisite note on every class
   * page describes. Closing in September would also mean the whole module read
   * "registration closed" for eight months of every year, including right now.
   * Set this back to `new Date(2026, 8, 20)` to enforce the published cut-off.
   */
  registrationCloses: new Date(2027, 2, 31).toISOString(),
  cadence: 'Alternate Sundays',
  status: 'open',
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
 * The nine Purna Vidya levels.
 *
 * Built rather than typed out nine times: they differ by level number, age band,
 * room and teacher, and spelling that out as nine near-identical literals invites
 * exactly the copy-paste mistake that puts two levels in one room.
 */
const PURNA_VIDYA_LEVELS: { level: number; minAge: number; maxAge: number; theme: string }[] = [
  {
    level: 1,
    minAge: 5,
    maxAge: 6,
    theme: 'Our temple, our prayers, and the stories behind them.',
  },
  {
    level: 2,
    minAge: 6,
    maxAge: 7,
    theme: 'Daily prayer, the pancha mahayajnas, and simple shlokas.',
  },
  { level: 3, minAge: 7, maxAge: 8, theme: 'The Ramayana told in full, and what it asks of us.' },
  { level: 4, minAge: 8, maxAge: 9, theme: 'The Mahabharata, and dharma when the choice is hard.' },
  { level: 5, minAge: 9, maxAge: 10, theme: 'The deities, their forms, and what each one means.' },
  { level: 6, minAge: 10, maxAge: 11, theme: 'Festivals and samskaras through the temple year.' },
  { level: 7, minAge: 11, maxAge: 12, theme: 'The Upanishads, opened gently.' },
  { level: 8, minAge: 13, maxAge: 14, theme: 'The Bhagavad Gita, chapter by chapter.' },
  {
    level: 9,
    minAge: 15,
    maxAge: 16,
    theme: 'Vedanta, and carrying it into a life outside the temple.',
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
  return PURNA_VIDYA_LEVELS.map((l, i) => ({
    id: `cls_pv${l.level}`,
    slug: `purna-vidya-level-${l.level}`,
    code: `PV-${l.level}`,
    name: `Purna Vidya · Level ${l.level}`,
    category: 'purna-vidya' as const,
    summary: l.theme,
    description:
      `Level ${l.level} of the Purna Vidya curriculum, the nine-level programme by Sri Dhira ` +
      `Chaitanya and Swamini Pramananda that forms the spine of the Hindu WISDOM Program. ` +
      `${l.theme} Classes run alternate Sundays through the academic year, and the level a ` +
      `child joins is confirmed by the coordinators before the first Sunday.`,
    minAge: l.minAge,
    maxAge: l.maxAge,
    audience: 'child' as const,
    day: 0,
    startTime: '08:45',
    endTime: '12:30',
    room: ROOMS.class(l.level),
    teacher: PV_TEACHERS[i % PV_TEACHERS.length]!,
    fee: 180,
    capacity: 24,
    // Seeded as a real register would read: the lower levels fill first.
    enrolled: [22, 24, 21, 19, 17, 15, 12, 10, 7][i]!,
    prerequisiteClassId: l.level > 1 ? `cls_pv${l.level - 1}` : undefined,
    notes: [
      'Includes the Purna Vidya workbook and materials for the year.',
      'Alternate Sundays — the published calendar is handed out on the first day.',
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
    endTime: '12:30',
    room: ROOMS.yoga,
    teacher: 'Sri Mohan Das',
    fee: 90,
    capacity: 30,
    enrolled: 18,
    notes: ['Mats are provided.'],
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
    name: 'Shloka Assembly',
    category: 'enrichment',
    summary: 'The whole school chants together before class.',
    description:
      'Every school Sunday opens with the whole school chanting together in the upper hall. ' +
      'Included for every enrolled student — there is nothing to book.',
    minAge: 5,
    maxAge: 16,
    audience: 'child',
    day: 0,
    startTime: '08:45',
    endTime: '09:00',
    room: ROOMS.hall,
    teacher: 'VHS Coordinators',
    fee: 0,
    capacity: 200,
    enrolled: 147,
    notes: ['Included with any Purna Vidya enrolment.'],
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
    summary: 'High-school students helping run the school.',
    description:
      'High-school students assist in the junior classrooms, at the annadanam counter and on ' +
      'festival days. Hours are logged and a letter is issued at the end of the year for ' +
      'school service requirements.',
    minAge: 14,
    maxAge: 18,
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
