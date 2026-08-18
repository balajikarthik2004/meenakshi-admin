import type { Project } from '@/lib/data/types'

export const PROJECTS: Project[] = [
  {
    id: 'prj_0001',
    title: 'Sanctum Repainting',
    targetAmount: 22000,
    raisedAmount: 18040,
    spentAmount: 14600,
    progressPct: 82,
    status: 'in-progress',
    notes: [
      'Silpi team from Chennai arrives the second week of the month.',
      'Scaffolding permit approved by City of Pearland.',
      'Vimanam gold leaf quoted separately at $4,200 — not yet in scope.',
    ],
  },
  {
    id: 'prj_0002',
    title: 'Parking Extension',
    targetAmount: 40000,
    raisedAmount: 6000,
    spentAmount: 2150,
    progressPct: 15,
    status: 'in-progress',
    notes: [
      'Adds 48 spaces on the north lot — festival overflow currently parks on McLean Rd.',
      'Civil drawings complete; drainage review pending.',
      'Board approved a matching-gift campaign up to $10,000.',
    ],
  },
  {
    id: 'prj_0003',
    title: 'Kitchen Upgrade',
    targetAmount: 30000,
    raisedAmount: 31200,
    spentAmount: 29450,
    progressPct: 100,
    status: 'completed',
    notes: [
      'Commercial range, walk-in cooler and new exhaust hood commissioned.',
      'Health inspection passed on first visit.',
      'Annadanam capacity up from 250 to 600 plates per weekend.',
    ],
  },
  {
    id: 'prj_0004',
    title: 'New Peacock Sanctuary Enclosure',
    targetAmount: 65000,
    raisedAmount: 4800,
    spentAmount: 0,
    progressPct: 7,
    status: 'planned',
    notes: [
      'Shaded aviary and pond for the temple’s six peacocks, beside the goshala.',
      'Awaiting a lead gift before groundbreaking.',
      'Veterinary consult scheduled with Texas A&M extension.',
    ],
  },
  {
    id: 'prj_0005',
    title: 'Library Digital Catalog',
    targetAmount: 5000,
    raisedAmount: 3000,
    spentAmount: 2400,
    progressPct: 60,
    status: 'in-progress',
    notes: [
      '1,850 of roughly 3,000 titles catalogued by the youth volunteer team.',
      'Barcode scanner and label printer purchased.',
      'Borrowing kiosk goes live once cataloguing crosses 90%.',
    ],
  },
]
