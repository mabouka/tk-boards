import { liveSession } from '@/lib/session'

/** Throws unless the caller is a logged-in admin with a live session. Returns the user id. */
export async function requireAdmin(): Promise<string> {
  const s = await liveSession()
  if (!s) throw new Error('unauthorized') // no session, deleted user, or stale token
  if (s.role !== 'admin') throw new Error('forbidden')
  return s.userId
}
