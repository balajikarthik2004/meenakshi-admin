import type {
  UUID,
  Volunteer,
  VolunteerAssignment,
  VolunteerCampaign,
  VolunteerChannel,
  VolunteerInvite,
  VolunteerMessage,
  VolunteerSkill,
} from '@/lib/data/types'
import { id, int, offsetISO, pick, rng } from './seed'
import { CITIES, DEVOTEES } from './users'
import { EVENTS } from './events'

/**
 * The volunteer pool, and five campaigns sitting at five different points of the flow.
 *
 * Every campaign below is attached to a festival the event seed actually produces, and
 * every `source: 'invited'` assignment traces back to an invite whose status is
 * `accepted`. That coherence is the point of seeding this by hand rather than sprinkling
 * random statuses: the roster screen's whole job is showing that the people standing at
 * Chithirai are the people who said yes, and a seed that cannot survive that comparison
 * teaches the coordinator to distrust the screen.
 */

export const VOLUNTEER_ROLES: { key: VolunteerSkill; label: string; blurb: string }[] = [
  {
    key: 'kitchen',
    label: 'Kitchen & annadanam',
    blurb: 'Cooking, running the serving line and washing up in the madapalli.',
  },
  {
    key: 'decoration',
    label: 'Decoration & alangaram',
    blurb: 'Flower garlands, kolam at the entrance, mandapam draping and lamp setting.',
  },
  {
    key: 'parking',
    label: 'Parking & traffic',
    blurb: 'Directing cars across the lot and keeping the fire lane clear all evening.',
  },
  {
    key: 'registration',
    label: 'Registration desk',
    blurb: 'Signing in sponsors, handing out archana slips and prasadam tokens.',
  },
  {
    key: 'prasadam',
    label: 'Prasadam distribution',
    blurb: 'Packing and handing out prasadam after each abhishekam.',
  },
  {
    key: 'crowd',
    label: 'Queue & crowd care',
    blurb: 'Holding the darshan queue and walking elderly devotees to the front.',
  },
  {
    key: 'cleanup',
    label: 'Clean-up crew',
    blurb: 'Clearing the hall between sessions and the full reset at the end of the night.',
  },
  {
    key: 'av',
    label: 'Audio, video & streaming',
    blurb: 'Mic checks, the livestream feed and the projection screens in the hall.',
  },
  {
    key: 'youth',
    label: 'Youth programme',
    blurb: 'Shepherding the kolattam and bhajan groups through their slots on time.',
  },
  {
    key: 'security',
    label: 'Doors & safety',
    blurb: 'Entry points, the lost-child protocol and the first-aid corner.',
  },
]

export const ROLE_BY_KEY = new Map(VOLUNTEER_ROLES.map((r) => [r.key, r]))

export const roleLabel = (key: VolunteerSkill) => ROLE_BY_KEY.get(key)?.label ?? key

/** Shift wording the coordinator picks from — a volunteer reads a time, not a timestamp. */
export const VOLUNTEER_SHIFTS = [
  'Morning — 6:00am to 11:00am',
  'Midday — 11:00am to 4:00pm',
  'Evening — 4:00pm to 9:00pm',
  'Full day — 6:00am to 9:00pm',
] as const

/** Volunteers who help out but have never registered as devotees. */
const VOLUNTEER_ONLY_NAMES = [
  'Sekar Palaniappan',
  'Indira Krishnamoorthy',
  'Ashok Varadarajan',
  'Rukmini Balakrishnan',
  'Thiru Murugesan',
  'Saroja Devarajan',
  'Manoj Chakravarthy',
  'Hemalatha Rangarajan',
  'Velan Ponnusamy',
  'Aruna Krishnaswamy',
  'Jagan Mohan Rao',
  'Sudha Lakshmanan',
  'Prabhu Deivanayagam',
  'Vimala Sundararajan',
  'Chandran Ramalingam',
  'Kausalya Venkatachalam',
  'Anand Thirumalai',
  'Nithya Somasundaram',
  'Raghu Chidambaranathan',
  'Brinda Ayyaswamy',
  'Muthu Kumaran',
  'Janaki Perumalsamy',
]

const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

/** Notes the coordinator has jotted against particular people, by pool index. */
const VOLUNTEER_NOTES: Record<number, string> = {
  3: 'Cannot lift heavy vessels — kitchen prep only, please.',
  6: 'Available weekends only. Leaves by 8pm.',
  11: 'Drives the temple van and holds the gate key.',
  19: 'Speaks Telugu and Hindi — good on the registration desk.',
  27: 'Moved to Austin, still drives down for the big festivals.',
}

function buildVolunteers(): Volunteer[] {
  const r = rng(931744)
  const out: Volunteer[] = []

  const skillsFor = (): VolunteerSkill[] => {
    const n = int(r, 1, 3)
    const picked = new Set<VolunteerSkill>()
    while (picked.size < n) picked.add(pick(r, VOLUNTEER_ROLES).key)
    return [...picked]
  }

  // Roughly a third of the pool are registered devotees. Linking by `userId` rather than
  // copying the record means the volunteer sheet and the devotee file cannot drift apart.
  DEVOTEES.filter((_, i) => i % 4 === 0)
    .slice(0, 12)
    .forEach((u) => {
      out.push({
        id: id('vol', out.length + 1),
        name: u.name,
        email: u.email,
        phone: u.phone,
        city: u.city ?? 'Houston',
        skills: skillsFor(),
        userId: u.id,
        status: 'active',
        joinedAt: offsetISO(-int(r, 120, 900), 10),
        avatarInitials: u.avatarInitials,
      })
    })

  VOLUNTEER_ONLY_NAMES.forEach((name) => {
    const loc = pick(r, CITIES)
    out.push({
      id: id('vol', out.length + 1),
      name,
      email: name.toLowerCase().replace(/[^a-z]+/g, '.') + '@gmail.com',
      phone:
        '(' +
        pick(r, ['281', '832', '713', '469', '512']) +
        ') ' +
        int(r, 200, 999) +
        '-' +
        int(r, 1000, 9999),
      city: loc.city,
      skills: skillsFor(),
      status: 'active',
      joinedAt: offsetISO(-int(r, 20, 700), 10),
      avatarInitials: initialsOf(name),
    })
  })

  // Four dormant records, named rather than rolled, so the "active only" filter has
  // something predictable to hide and the directory shows both states on first load.
  out.forEach((v, i) => {
    if (i === 7 || i === 15 || i === 23 || i === 31) v.status = 'paused'
    const note = VOLUNTEER_NOTES[i]
    if (note) v.notes = note
  })

  return out
}

export const VOLUNTEERS: Volunteer[] = buildVolunteers()

/* ------------------------------------------------------------------ campaigns */

interface SendSeed {
  channel: VolunteerChannel
  subject: string
  body: string
  daysAgo: number
  /** Empty means the whole active pool — "anyone who can help". */
  skills: VolunteerSkill[]
  count: number
}

interface CampaignSeed {
  eventTitle: string
  title: string
  description: string
  /** Briefing, as a day offset from today. Negative for a campaign already run. */
  briefingDays: number
  coordinatorId: UUID
  status: VolunteerCampaign['status']
  needs: { key: VolunteerSkill; needed: number }[]
  sends: SendSeed[]
  /** How the invites came back. Any remainder stays `sent` — still waiting. */
  responses: { accepted: number; declined: number; noResponse: number }
  /** Volunteers the coordinator placed straight onto the roster, never invited. */
  directCount: number
  /** A campaign that has already happened: how the roster actually turned out. */
  outcome?: { checkedIn: number; noShow: number }
}

const EMAIL_BODY =
  'Vanakkam {{name}},\n\n' +
  'The temple is preparing for {{festival}}, and we are looking for volunteers to help ' +
  'the day run smoothly. If you can spare a few hours we would be grateful for your seva — ' +
  'the areas we most need help with are {{role}}.\n\n' +
  'Reply to this note and the coordinator will place you on a shift and send the briefing ' +
  'details. There is no obligation, and a "not this time" is always welcome.\n\n' +
  'Om Namah Shivaya,\nSri Meenakshi Devasthanam'

const SMS_BODY =
  'SMDP: Volunteers needed for {{festival}}. Can you help with {{role}}? Reply YES to join.'

const DECLINE_NOTES = [
  'Travelling that week — next festival for certain.',
  'Working the evening shift, sorry.',
  'Recovering from surgery; sending my son instead.',
  'Already committed to the Navaratri kitchen.',
  'Out of town for a wedding.',
]

const SEEDS: CampaignSeed[] = [
  {
    eventTitle: 'Chithirai Festival',
    title: 'Chithirai Festival — volunteer drive',
    description:
      'Ten days of processions, the Thirukalyanam on the eighth night and annadanam every ' +
      'evening. The largest volunteer ask of the year — kitchen and parking carry the load.',
    briefingDays: 9,
    coordinatorId: 'usr_admin',
    status: 'recruiting',
    needs: [
      { key: 'kitchen', needed: 14 },
      { key: 'parking', needed: 8 },
      { key: 'decoration', needed: 6 },
      { key: 'registration', needed: 4 },
      { key: 'crowd', needed: 6 },
    ],
    sends: [
      {
        channel: 'both',
        subject: 'Volunteers needed — Chithirai Festival',
        body: EMAIL_BODY,
        daysAgo: 18,
        skills: [],
        count: 22,
      },
      {
        channel: 'sms',
        subject: 'Chithirai — kitchen and parking still short',
        body: SMS_BODY,
        daysAgo: 6,
        skills: ['kitchen', 'parking'],
        count: 9,
      },
    ],
    responses: { accepted: 12, declined: 5, noResponse: 3 },
    directCount: 2,
  },
  {
    eventTitle: 'Deepavali',
    title: 'Deepavali night — hall and prasadam crew',
    description:
      'Lamp lighting at dusk, the fireworks slot in the back lot and prasadam for roughly ' +
      'six hundred devotees. Fully staffed as of the last briefing.',
    briefingDays: 4,
    coordinatorId: 'stf_0002',
    status: 'staffed',
    needs: [
      { key: 'prasadam', needed: 8 },
      { key: 'security', needed: 4 },
      { key: 'cleanup', needed: 6 },
      { key: 'av', needed: 2 },
    ],
    sends: [
      {
        channel: 'email',
        subject: 'Deepavali volunteers — a few hours on the night',
        body: EMAIL_BODY,
        daysAgo: 24,
        skills: [],
        count: 18,
      },
    ],
    responses: { accepted: 15, declined: 2, noResponse: 1 },
    directCount: 3,
  },
  {
    eventTitle: 'Karthigai Deepam',
    title: 'Karthigai Deepam — lamp crew',
    description:
      'Three thousand agal vilakku along the prakaram wall, lit in sequence after the ' +
      'evening deeparadhanai. Roles drafted; nothing sent out yet.',
    briefingDays: 21,
    coordinatorId: 'stf_0003',
    status: 'draft',
    needs: [
      { key: 'decoration', needed: 12 },
      { key: 'crowd', needed: 5 },
      { key: 'cleanup', needed: 4 },
    ],
    sends: [],
    responses: { accepted: 0, declined: 0, noResponse: 0 },
    directCount: 0,
  },
  {
    eventTitle: 'Navaratri Day 3',
    title: 'Navaratri Day 3 — golu and youth slots',
    description:
      'Golu darshan through the afternoon and kolattam by the youth group at 7pm. A short ' +
      'SMS-only ask, since the same crew helps on every one of the nine nights.',
    briefingDays: 12,
    coordinatorId: 'usr_priest',
    status: 'recruiting',
    needs: [
      { key: 'youth', needed: 6 },
      { key: 'registration', needed: 3 },
      { key: 'av', needed: 2 },
    ],
    sends: [
      {
        channel: 'sms',
        subject: 'Navaratri Day 3 — youth programme help',
        body: SMS_BODY,
        daysAgo: 5,
        skills: ['youth', 'av', 'registration'],
        count: 11,
      },
    ],
    responses: { accepted: 5, declined: 3, noResponse: 0 },
    directCount: 1,
  },
  {
    eventTitle: 'Aadi Perukku',
    title: 'Aadi Perukku — riverside abhishekam',
    description:
      'Kaveri abhishekam at the pond, then annadanam in the hall. Closed out, and kept as ' +
      'the reference for how many of the people who accept actually turn up.',
    briefingDays: -34,
    coordinatorId: 'usr_admin',
    status: 'completed',
    needs: [
      { key: 'kitchen', needed: 10 },
      { key: 'parking', needed: 4 },
      { key: 'prasadam', needed: 5 },
    ],
    sends: [
      {
        channel: 'both',
        subject: 'Aadi Perukku — volunteers for the pond abhishekam',
        body: EMAIL_BODY,
        daysAgo: 62,
        skills: [],
        count: 16,
      },
    ],
    responses: { accepted: 11, declined: 4, noResponse: 1 },
    directCount: 2,
    outcome: { checkedIn: 9, noShow: 2 },
  },
]

interface Seeded {
  campaigns: VolunteerCampaign[]
  messages: VolunteerMessage[]
  invites: VolunteerInvite[]
  assignments: VolunteerAssignment[]
}

function buildCampaigns(): Seeded {
  const r = rng(604318)
  const campaigns: VolunteerCampaign[] = []
  const messages: VolunteerMessage[] = []
  const invites: VolunteerInvite[] = []
  const assignments: VolunteerAssignment[] = []

  const active = VOLUNTEERS.filter((v) => v.status === 'active')
  let cursor = 0

  /** Walks the active pool without repeating anybody already spoken for. */
  const nextBatch = (n: number, taken: Set<UUID>): Volunteer[] => {
    const out: Volunteer[] = []
    for (let guard = 0; out.length < n && guard < active.length * 2; guard++) {
      const v = active[cursor++ % active.length]!
      if (taken.has(v.id)) continue
      taken.add(v.id)
      out.push(v)
    }
    return out
  }

  SEEDS.forEach((s, ci) => {
    const event = EVENTS.find((e) => e.title === s.eventTitle)
    // A renamed festival should cost us one campaign, not the whole module.
    if (!event) return

    const campaignId = id('vcm', ci + 1)
    campaigns.push({
      id: campaignId,
      eventId: event.id,
      title: s.title,
      description: s.description,
      briefingAt: offsetISO(s.briefingDays, 18, 30),
      coordinatorId: s.coordinatorId,
      needs: s.needs.map((n) => ({
        roleKey: n.key,
        label: roleLabel(n.key),
        blurb: ROLE_BY_KEY.get(n.key)?.blurb ?? '',
        needed: n.needed,
      })),
      status: s.status,
      createdAt: offsetISO(s.briefingDays - 45, 9),
    })

    const invitedHere = new Set<UUID>()
    const rosteredHere = new Set<UUID>()

    /* Outreach: one message, then one invite per resolved recipient. */
    s.sends.forEach((send, si) => {
      const pool = send.skills.length
        ? active.filter((v) => v.skills.some((sk) => send.skills.includes(sk)))
        : active

      const recipients: Volunteer[] = []
      for (let guard = 0; recipients.length < send.count && guard < pool.length * 3; guard++) {
        const v = pool[cursor++ % pool.length]!
        // A follow-up may legitimately reach somebody the first send already found. What
        // must not happen is the same person appearing twice inside one broadcast.
        if (recipients.some((x) => x.id === v.id)) continue
        recipients.push(v)
      }

      const messageId = id('vms' + (ci + 1), si + 1)
      messages.push({
        id: messageId,
        campaignId,
        channel: send.channel,
        subject: send.subject,
        body: send.body,
        recipientIds: recipients.map((v) => v.id),
        sentAt: offsetISO(-send.daysAgo, 11, 15),
        sentByName: s.coordinatorId === 'usr_admin' ? 'Meera Sundaram' : 'Sathish Sharma',
        audience: {
          skills: send.skills,
          // A follow-up is by definition aimed at the people who have not answered yet.
          excludeInvited: si > 0,
          excludeRostered: si > 0,
        },
      })

      recipients.forEach((v) => {
        if (invitedHere.has(v.id)) return
        invitedHere.add(v.id)
        invites.push({
          id: id('vin' + (ci + 1), invitedHere.size),
          campaignId,
          volunteerId: v.id,
          messageId,
          channel: send.channel,
          status: 'sent',
          sentAt: offsetISO(-send.daysAgo, 11, 15),
        })
      })
    })

    /* Responses, applied to this campaign's invites in seeded order. */
    const mine = invites.filter((x) => x.campaignId === campaignId)
    const { accepted, declined, noResponse } = s.responses

    mine.forEach((inv, i) => {
      if (i < accepted) {
        inv.status = 'accepted'
        inv.respondedAt = offsetISO(-int(r, 1, 12), int(r, 9, 20))
      } else if (i < accepted + declined) {
        inv.status = 'declined'
        inv.respondedAt = offsetISO(-int(r, 1, 12), int(r, 9, 20))
        inv.note = DECLINE_NOTES[(i + ci) % DECLINE_NOTES.length]
      } else if (i < accepted + declined + noResponse) {
        // The coordinator rang round and closed these off by hand — nothing here
        // expires on its own.
        inv.status = 'no-response'
        inv.respondedAt = offsetISO(-int(r, 1, 4), 17)
      }
    })

    /* Roster: every acceptance becomes an assignment, matched where possible to a role
       the volunteer can actually do. */
    const needKeys = s.needs.map((n) => n.key)
    const roleFor = (v: Volunteer) =>
      v.skills.find((sk) => needKeys.includes(sk)) ?? needKeys[cursor++ % needKeys.length]!
    const countHere = () => assignments.filter((a) => a.campaignId === campaignId).length

    mine
      .filter((inv) => inv.status === 'accepted')
      .forEach((inv, i) => {
        const v = VOLUNTEERS.find((x) => x.id === inv.volunteerId)
        if (!v) return
        rosteredHere.add(v.id)
        assignments.push({
          id: id('vas' + (ci + 1), countHere() + 1),
          campaignId,
          volunteerId: v.id,
          roleKey: roleFor(v),
          shift: VOLUNTEER_SHIFTS[i % VOLUNTEER_SHIFTS.length]!,
          // A fresh acceptance sits `pending` until the coordinator confirms the shift
          // with them, so a live campaign shows both states side by side.
          status: i % 4 === 3 ? 'pending' : 'confirmed',
          source: 'invited',
          inviteId: inv.id,
          addedAt: inv.respondedAt ?? inv.sentAt,
        })
      })

    /* Direct adds: the people the coordinator simply put on the sheet. */
    nextBatch(s.directCount, new Set([...invitedHere, ...rosteredHere])).forEach((v, i) => {
      assignments.push({
        id: id('vas' + (ci + 1), countHere() + 1),
        campaignId,
        volunteerId: v.id,
        roleKey: roleFor(v),
        shift: VOLUNTEER_SHIFTS[(i + 1) % VOLUNTEER_SHIFTS.length]!,
        status: 'confirmed',
        source: 'direct',
        addedAt: offsetISO(-int(r, 2, 9), 15),
        note: i === 0 ? 'Walked in and offered — put straight on the sheet.' : undefined,
      })
    })

    /* Outcome, for a campaign that has already happened. */
    const outcome = s.outcome
    if (outcome) {
      assignments
        .filter((a) => a.campaignId === campaignId)
        .forEach((a, i) => {
          if (i < outcome.checkedIn) a.status = 'checked-in'
          else if (i < outcome.checkedIn + outcome.noShow) a.status = 'no-show'
          else a.status = 'confirmed'
        })
    }
  })

  return { campaigns, messages, invites, assignments }
}

const SEEDED = buildCampaigns()

export const VOLUNTEER_CAMPAIGNS: VolunteerCampaign[] = SEEDED.campaigns
export const VOLUNTEER_MESSAGES: VolunteerMessage[] = SEEDED.messages
export const VOLUNTEER_INVITES: VolunteerInvite[] = SEEDED.invites
export const VOLUNTEER_ASSIGNMENTS: VolunteerAssignment[] = SEEDED.assignments
