import type { FamilyMember, FamilyTree, User } from '@/lib/data/types'
import { chance, id, int, pick, rng } from './seed'

export const NAKSHATRAS = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Moola',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
] as const

export const GOTHRAS = [
  'Bharadwaja',
  'Kashyapa',
  'Vashishta',
  'Atri',
  'Vishwamitra',
  'Gautama',
  'Jamadagni',
  'Agastya',
  'Srivatsa',
  'Kaundinya',
  'Harita',
  'Sandilya',
] as const

export const CITIES: { city: string; zip: string }[] = [
  { city: 'Houston', zip: '77096' },
  { city: 'Sugar Land', zip: '77479' },
  { city: 'Katy', zip: '77494' },
  { city: 'Pearland', zip: '77584' },
  { city: 'Dallas', zip: '75248' },
  { city: 'Frisco', zip: '75035' },
  { city: 'Austin', zip: '78750' },
]

const STREETS = [
  'Shadow Creek Pkwy',
  'Highway 6',
  'Cinco Ranch Blvd',
  'Braeswood Blvd',
  'Preston Rd',
  'Legacy Dr',
  'Parmer Ln',
  'Bissonnet St',
  'Eldridge Pkwy',
  'Sienna Ranch Rd',
]

/** 47 devotee names — Tamil, Telugu, Kannada and Malayali households in the Houston metro. */
const DEVOTEE_NAMES = [
  'Balaji Krishnan',
  'Lakshmi Raghavan',
  'Suresh Venkatesan',
  'Priya Balasubramanian',
  'Karthik Narayanan',
  'Divya Srinivasan',
  'Ravi Chandrasekar',
  'Anitha Muthusamy',
  'Vignesh Rajagopal',
  'Shanthi Sivakumar',
  'Prakash Ramamurthy',
  'Gayathri Subramanian',
  'Mohan Doraiswamy',
  'Revathi Padmanabhan',
  'Sundar Ranganathan',
  'Kavitha Natarajan',
  'Arun Gopalakrishnan',
  'Deepa Viswanathan',
  'Srikanth Reddy',
  'Padmini Chidambaram',
  'Hari Prasad Iyengar',
  'Uma Maheswari',
  'Balaji Thiagarajan',
  'Nandini Ramakrishnan',
  'Ganesh Swaminathan',
  'Vidya Parthasarathy',
  'Rajesh Kumaraswamy',
  'Sowmya Venugopal',
  'Murali Shankar',
  'Latha Ravindran',
  'Sanjay Anantharaman',
  'Meenal Kalyanaraman',
  'Vasanth Kumar',
  'Bhavani Seshadri',
  'Naveen Ramaswamy',
  'Jayanthi Nagarajan',
  'Dinesh Karthikeyan',
  'Sarita Menon',
  'Aravind Pillai',
  'Chitra Vaidyanathan',
  'Ramanathan Sethuraman',
  'Vaishnavi Ganapathy',
  'Kishore Bhaskaran',
  'Malathi Sridharan',
  'Venkat Rangaswamy',
  'Kalpana Iyer',
  'Selvam Arumugam',
]

const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

const emailOf = (name: string, n: number) =>
  `${name.toLowerCase().replace(/[^a-z]+/g, '.')}${n % 7 === 0 ? n : ''}@example.com`

function buildUsers(): User[] {
  const r = rng(20260817)
  const users: User[] = []

  DEVOTEE_NAMES.forEach((name, i) => {
    const loc = CITIES[i % CITIES.length]!
    users.push({
      id: id('usr', i + 1),
      role: 'devotee',
      name,
      email: emailOf(name, i),
      phone: `(${pick(r, ['281', '832', '713', '469', '512'])}) ${int(r, 200, 999)}-${String(
        int(r, 1000, 9999),
      )}`,
      address: `${int(r, 100, 9899)} ${pick(r, STREETS)}`,
      city: loc.city,
      state: 'TX',
      zip: loc.zip,
      country: 'US',
      nakshatra: pick(r, NAKSHATRAS),
      gothra: pick(r, GOTHRAS),
      dob: new Date(int(r, 1958, 1996), int(r, 0, 11), int(r, 1, 28)).toISOString(),
      familyTreeId: chance(r, 62) ? id('fam', i + 1) : undefined,
      createdAt: new Date(int(r, 2014, 2025), int(r, 0, 11), int(r, 1, 28)).toISOString(),
      avatarInitials: initialsOf(name),
    })
  })

  users.push(
    {
      id: 'usr_admin',
      role: 'admin',
      name: 'Meera Sundaram',
      email: 'meera@smdpearland.org',
      phone: '(281) 489-0358',
      address: '17130 McLean Road',
      city: 'Pearland',
      state: 'TX',
      zip: '77584',
      country: 'US',
      nakshatra: 'Rohini',
      gothra: 'Bharadwaja',
      createdAt: new Date(2016, 2, 14).toISOString(),
      avatarInitials: 'MS',
    },
    {
      id: 'usr_board',
      role: 'board',
      name: 'Perumal Annamalai',
      email: 'perumal@smdpearland.org',
      phone: '(281) 489-0361',
      address: '17130 McLean Road',
      city: 'Pearland',
      state: 'TX',
      zip: '77584',
      country: 'US',
      nakshatra: 'Uttara Phalguni',
      gothra: 'Kashyapa',
      createdAt: new Date(2013, 8, 2).toISOString(),
      avatarInitials: 'PA',
    },
    {
      id: 'usr_priest',
      role: 'priest',
      name: 'Ramesh Iyer',
      email: 'ramesh@smdpearland.org',
      phone: '(281) 489-0359',
      address: '17130 McLean Road',
      city: 'Pearland',
      state: 'TX',
      zip: '77584',
      country: 'US',
      nakshatra: 'Pushya',
      gothra: 'Srivatsa',
      createdAt: new Date(2011, 5, 20).toISOString(),
      avatarInitials: 'RI',
    },
  )

  return users
}

export const USERS: User[] = buildUsers()

export const DEVOTEES: User[] = USERS.filter((u) => u.role === 'devotee')

const SPOUSE_NAMES = ['Latha', 'Ramesh', 'Sudha', 'Ganesan', 'Kamala', 'Srinivas', 'Vijaya']
const CHILD_NAMES = ['Aditya', 'Ananya', 'Rohan', 'Meera', 'Nikhil', 'Shreya', 'Arjun', 'Diya']
const PARENT_NAMES = ['Rajam', 'Natesan', 'Saroja', 'Kuppuswamy']

function buildFamilyTrees(): FamilyTree[] {
  const r = rng(770042)
  return DEVOTEES.filter((u) => u.familyTreeId).map((u) => {
    const surname = u.name.split(' ').slice(-1)[0]!
    const members: FamilyMember[] = [
      {
        name: `${pick(r, SPOUSE_NAMES)} ${surname}`,
        relation: 'spouse',
        nakshatra: pick(r, NAKSHATRAS),
        gothra: u.gothra,
      },
    ]
    const kids = int(r, 0, 2)
    for (let k = 0; k < kids; k++) {
      members.push({
        name: `${pick(r, CHILD_NAMES)} ${surname}`,
        relation: r() > 0.5 ? 'son' : 'daughter',
        nakshatra: pick(r, NAKSHATRAS),
        gothra: u.gothra,
      })
    }
    if (chance(r, 35)) {
      members.push({
        name: `${pick(r, PARENT_NAMES)} ${surname}`,
        relation: 'parent',
        nakshatra: pick(r, NAKSHATRAS),
        gothra: u.gothra,
        isAdultBranch: true,
      })
    }
    return { id: u.familyTreeId!, primaryUserId: u.id, members }
  })
}

export const FAMILY_TREES: FamilyTree[] = buildFamilyTrees()
