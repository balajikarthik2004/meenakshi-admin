/**
 * Browser-side persistence for the few records a devotee edits about themselves.
 *
 * The mock arrays live in memory and reset on reload. That is fine for seeded data
 * nobody touches, but a family tree the devotee typed in is their own work, and
 * losing it on refresh reads as a bug rather than as a demo limitation. The user
 * object already survives — the auth store is wrapped in zustand's `persist` — so
 * this file covers what that store does not.
 *
 * Every access is wrapped: a private window, cleared site data, a storage quota
 * error or a browser configured to block site data must degrade to the seeded
 * value, never throw into a render.
 */

const NS = 'meenakshi-admin'

export const LOCAL_KEYS = {
  familyTrees: `${NS}:family-trees`,
  emailPrefs: `${NS}:email-prefs`,
} as const

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    // Unreadable or malformed — the seed is a better answer than a crash.
    return fallback
  }
}

export function writeLocal(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    // Quota exceeded or storage denied. The in-memory copy still holds for this
    // session, so the save is not lost until the tab closes.
    return false
  }
}

export function clearLocal(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* nothing to do — the key is already unreachable */
  }
}
