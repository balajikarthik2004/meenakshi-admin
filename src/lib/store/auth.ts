import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role, User } from '@/lib/data/types'
import { TEMPLE, USERS } from '@/lib/data/mock'

/**
 * Mock auth. There is no credential check anywhere — `signIn` accepts any input and
 * resolves it to a seeded user. Replace this store's bodies with a real session call
 * and every guarded route keeps working unchanged.
 */
interface AuthState {
  user: User | null
  templeId: string
  signIn: (identifier: string, role?: Role) => Promise<void>
  signOut: () => void
  setUser: (user: User) => void
}

const firstDevotee = () => USERS.find((u) => u.role === 'devotee')!

function resolveUser(identifier: string, role?: Role): User {
  if (role) return USERS.find((u) => u.role === role) ?? firstDevotee()
  const q = identifier.trim().toLowerCase()
  if (!q) return firstDevotee()
  const digits = q.replace(/\D/g, '')
  const match = USERS.find(
    (u) =>
      u.email.toLowerCase() === q ||
      u.name.toLowerCase() === q ||
      (digits.length >= 7 && u.phone.replace(/\D/g, '').endsWith(digits.slice(-7))),
  )
  return match ?? firstDevotee()
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      templeId: TEMPLE.id,
      signIn: async (identifier, role) => {
        await new Promise((r) => setTimeout(r, 500))
        set({ user: resolveUser(identifier, role) })
      },
      signOut: () => set({ user: null }),
      setUser: (user) => set({ user }),
    }),
    { name: 'meenakshi-auth' },
  ),
)
