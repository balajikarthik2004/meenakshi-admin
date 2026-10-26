import type { Project, ProjectExpense } from '@/lib/data/types'
import { addDays, iso, today } from './seed'

/**
 * The temple's capital programme — what is being built, and the money for it.
 *
 * Two totals here are load-bearing and must not drift. `TRANSPARENCY`'s construction
 * head in `misc.ts` carries the exact raised and spent figures of this file ($63,040
 * and $48,600), because the capital projects section of the transparency page is the
 * same money counted a second way, and `TargetBreakdown` puts a variance row on the
 * page the moment the two disagree. Changing a project therefore means rebalancing its
 * siblings rather than adding on top — which is what the assertions at the bottom of
 * this file enforce, loudly, at import time.
 *
 * Every project's `spentAmount` is the sum of its own expense lines rather than a
 * figure typed beside them, so "where did the money actually go" is a question the
 * page can answer rather than merely pose.
 *
 * Each carries an `imageUrl`, which takes precedence over the drawn `cover`. The
 * photographs are stand-ins showing the kind of work involved rather than the
 * temple's own sites — see `public/projects/CREDITS.md`, and replace them with the
 * Devasthanam's own photography before this goes live.
 */

const daysAgo = (n: number) => iso(addDays(today(), -n))
const daysAhead = (n: number) => iso(addDays(today(), n))

let expenseSeq = 0
const expense = (
  date: string,
  vendor: string,
  description: string,
  amount: number,
  reference?: string,
): ProjectExpense => ({
  id: `exp_${String(++expenseSeq).padStart(4, '0')}`,
  date,
  vendor,
  description,
  amount,
  reference,
})

/**
 * Four projects, all genuinely under way, deliberately at four different places.
 *
 * The lift is nearly built and nearly paid for; the rajagopuram is the flagship and
 * has barely started on a target six times larger; the sannidhi is mid-build; the
 * solar array is still on paper. A programme where every bar sat at the same place
 * would make the funding meter look decorative — the whole point of publishing it is
 * that the four do not look alike.
 */
const PROJECT_SEED: Project[] = [
  {
    id: 'prj_0001',
    slug: 'rajagopuram-restoration',
    imageUrl: '/projects/rajagopuram.webp',
    title: 'Rajagopuram Restoration',
    summary: 'Stone repair and re-plastering of the main tower, ahead of the kumbhabhishekam.',
    description:
      'The rajagopuram has not been touched since it was raised, and the survey found water tracking behind the stucco on the north face along with three cracked stones at the second tier. The restoration repairs the stonework, re-plasters the tower in lime mortar and repaints the figures, so that the twelve-yearly kumbhabhishekam is performed on a tower that is sound rather than merely clean.',
    targetAmount: 150_000,
    raisedAmount: 24_000,
    spentAmount: 19_500,
    progressPct: 18,
    status: 'in-progress',
    openForDonations: true,
    startedAt: daysAgo(150),
    targetCompletion: daysAhead(640),
    cover: 'gopuram',
    notes: [
      'Structural survey complete — three cracked stones at the second tier, north face.',
      'Sthapathi engaged from Kumbakonam; phase one is stonework only.',
      'Kumbhabhishekam provisionally set for the Chithirai after completion.',
      'The largest item in the capital programme. A lead gift is being sought.',
    ],
    expenses: [
      expense(
        daysAgo(141),
        'Sastry Associates',
        'Structural survey of the tower',
        3_500,
        'INV-7701',
      ),
      expense(
        daysAgo(118),
        'Kumbakonam Silpa Kalai',
        'Sthapathi retainer, phase one',
        9_500,
        'INV-7718',
      ),
      expense(
        daysAgo(62),
        'Lime & Lath Supply Co.',
        'Lime mortar, stucco and curing materials',
        4_800,
        'INV-7760',
      ),
      expense(daysAgo(24), 'Gulf Coast Scaffold', 'Lift hire and site hoarding', 1_700, 'INV-7789'),
    ],
  },
  {
    id: 'prj_0002',
    slug: 'navagraha-sannidhi',
    imageUrl: '/projects/navagraha-sannidhi.jpg',
    title: 'Navagraha Sannidhi',
    summary: 'A new shrine for the nine planetary deities, in the outer prakaram.',
    description:
      'Devotees have asked for a navagraha sannidhi for most of a decade, and the Tuesday and Saturday queues for parihara archana currently form in the open air beside the Murugan shrine. The new sannidhi gives the nine deities a granite platform and a covered prakaram of their own in the north-east corner of the outer courtyard.',
    targetAmount: 48_000,
    raisedAmount: 14_800,
    spentAmount: 11_200,
    progressPct: 35,
    status: 'in-progress',
    openForDonations: true,
    startedAt: daysAgo(85),
    targetCompletion: daysAhead(420),
    cover: 'shrine',
    notes: [
      'Granite murtis commissioned from Mamallapuram; nine-month carving lead time.',
      'Foundation levelled and the platform slabs delivered.',
      'Sponsorship of an individual graha is offered at $4,200 each.',
    ],
    expenses: [
      expense(
        daysAgo(74),
        'Mamallapuram Stone Works',
        'Granite murti carving, advance',
        7_600,
        'INV-3310',
      ),
      expense(daysAgo(61), 'Sastry Associates', 'Platform and canopy drawings', 350, 'INV-3327'),
      expense(
        daysAgo(33),
        'Brazos Site Works',
        'Foundation excavation and levelling',
        1_850,
        'INV-3341',
      ),
      expense(daysAgo(11), 'Hill Country Granite', 'Platform slabs, delivered', 1_400, 'INV-3358'),
    ],
  },
  {
    id: 'prj_0003',
    slug: 'solar-roof',
    imageUrl: '/projects/solar-roof.jpg',
    cover: 'solar',
    title: 'Solar Roof & Battery Backup',
    summary: 'A rooftop array and battery, to cut the power bill and survive outages.',
    description:
      'Electricity is the third largest line in the facilities budget, and the temple lost power for two days during the last freeze with four hundred pounds of annadanam stock in the coolers. A ninety-kilowatt rooftop array with battery backup is projected to cover roughly two-thirds of annual consumption and to keep the kitchen and the sanctum lit through an outage.',
    targetAmount: 72_000,
    raisedAmount: 8_240,
    spentAmount: 5_900,
    progressPct: 10,
    status: 'in-progress',
    openForDonations: true,
    startedAt: daysAgo(55),
    targetCompletion: daysAhead(380),
    notes: [
      'Roof load assessment passed — no structural reinforcement required.',
      'Interconnection application filed with CenterPoint Energy.',
      'The federal clean-energy credit is not available to a 501(c)(3); elective pay is being explored.',
      'Projected to save roughly $9,800 a year against the current facilities budget.',
    ],
    expenses: [
      expense(daysAgo(48), 'Lone Star Structural', 'Roof load assessment', 2_150, 'INV-8820'),
      expense(
        daysAgo(30),
        'CenterPoint Energy',
        'Interconnection application fee',
        600,
        'APP-11574',
      ),
      expense(
        daysAgo(16),
        'Helios Design Group',
        'Shading study and array layout',
        1_250,
        'INV-8841',
      ),
      expense(daysAgo(5), 'SunRail Supply', 'Mounting rail deposit', 1_900, 'INV-8859'),
    ],
  },
  {
    id: 'prj_0004',
    slug: 'accessibility-lift',
    imageUrl: '/projects/accessibility-ramp.jpg',
    cover: 'access',
    title: 'Accessibility Lift & Ramp',
    summary: 'Step-free access to the upper hall, for elderly and wheelchair devotees.',
    description:
      'The upper hall is reached by eighteen steps and nothing else, which means the devotees who attend most faithfully are the ones least able to get to the Friday discourse. The project adds a compliant ramp at the east entrance and a platform lift to the upper hall, together with a step-free route from the accessible parking bays.',
    targetAmount: 26_000,
    raisedAmount: 16_000,
    spentAmount: 12_000,
    progressPct: 70,
    status: 'in-progress',
    openForDonations: true,
    startedAt: daysAgo(190),
    targetCompletion: daysAhead(95),
    notes: [
      'ADA compliance review complete; ramp gradient fixed at 1:12 with two landings.',
      'Platform lift ordered — sixty per cent deposit paid, delivery in ten weeks.',
      'Ramp groundworks and handrail complete at the east entrance.',
      'The senior devotees’ committee asked that this be prioritised, and the board agreed.',
    ],
    expenses: [
      expense(
        daysAgo(178),
        'Access Design TX',
        'ADA compliance review and drawings',
        1_400,
        'INV-6612',
      ),
      expense(daysAgo(160), 'City of Pearland', 'Building permit application', 300, 'PRM-5280'),
      expense(daysAgo(96), 'Brazos Site Works', 'Ramp groundworks and handrail', 2_500, 'INV-6679'),
      expense(
        daysAgo(38),
        'Savaria Texas',
        'Platform lift, sixty per cent deposit',
        7_800,
        'INV-6744',
      ),
    ],
  },
]

/**
 * The published construction figures the programme must continue to add up to.
 *
 * Exported so `misc.ts` states the two numbers once rather than repeating the
 * literals, and so a project edited without rebalancing its siblings fails loudly at
 * import instead of quietly putting a variance row on the transparency page.
 */
export const PROJECTS_RAISED = 63_040
export const PROJECTS_SPENT = 48_600

function buildProjects(): Project[] {
  for (const p of PROJECT_SEED) {
    const lines = p.expenses.reduce((s, e) => s + e.amount, 0)
    if (lines !== p.spentAmount) {
      throw new Error(
        `Project ${p.id}: expense lines total ${lines} but spentAmount is ${p.spentAmount}`,
      )
    }
    if (p.spentAmount > p.raisedAmount) {
      throw new Error(`Project ${p.id}: spent ${p.spentAmount} exceeds raised ${p.raisedAmount}`)
    }
  }

  const raised = PROJECT_SEED.reduce((s, p) => s + p.raisedAmount, 0)
  const spent = PROJECT_SEED.reduce((s, p) => s + p.spentAmount, 0)
  if (raised !== PROJECTS_RAISED || spent !== PROJECTS_SPENT) {
    throw new Error(
      `The capital programme must total ${PROJECTS_RAISED} raised / ${PROJECTS_SPENT} spent to ` +
        `match the construction budget head in misc.ts; got ${raised} / ${spent}`,
    )
  }

  // Newest expense first, so a project's outflow reads as a bank statement does.
  for (const p of PROJECT_SEED) p.expenses.sort((a, b) => b.date.localeCompare(a.date))

  return PROJECT_SEED
}

export const PROJECTS: Project[] = buildProjects()

export const PROJECT_BY_ID = new Map(PROJECTS.map((p) => [p.id, p]))

/** The ids a seeded gift may be tagged to — see `mock/donations.ts`. */
export const PROJECT_IDS: string[] = PROJECTS.map((p) => p.id)
