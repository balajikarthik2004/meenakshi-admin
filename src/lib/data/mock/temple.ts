import type { Temple } from '@/lib/data/types'

export const TEMPLE: Temple = {
  id: 'temple_0001',
  name: 'Sri Meenakshi Temple Society',
  address: '17130 McLean Road',
  city: 'Pearland',
  state: 'TX',
  zip: '77584',
  country: 'US',
  phone: '(281) 489-0358',
  email: 'office@smdpearland.org',
  timezone: 'America/Chicago',
  timings: { morning: '8:00 AM – 12:00 PM', evening: '5:00 PM – 8:30 PM' },
  logoUrl: '/logo.svg',
  deities: [
    'Meenakshi',
    'Sundareswarar',
    'Venkateshwara',
    'Lakshmi',
    'Ganesha',
    'Murugan',
    'Ayyappan',
    'Durga',
  ],
}

/** Placeholder EIN shown in the footer and on tax receipts. */
export const TEMPLE_EIN = '74-1234567'

export const DAILY_SCHEDULE = [
  { label: 'Suprabhatam', time: '8:00 AM', detail: 'Morning awakening of the deities' },
  { label: 'Archana', time: '11:30 AM', detail: 'Names offered at each sannidhi' },
  { label: 'Sandhya Aarti', time: '6:30 PM', detail: 'Evening lamp offering' },
]
