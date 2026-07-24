import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'

export type LiveSession = { userId: string; role: string; eshopPreview: boolean }

/**
 * The current session, but only if it is still live: the user exists and the
 * JWT's tokenVersion still matches the DB (a password reset / logout-everywhere
 * bumps it). Returns null for no session, a deleted user, or a stale token.
 * Single source of truth for the gate used by requireAdmin, the account layout
 * and the tk-id actions.
 */
export async function liveSession(): Promise<LiveSession | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const [u] = await db
    .select({ role: users.role, tokenVersion: users.tokenVersion, eshopPreview: users.eshopPreview })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!u || (u.tokenVersion ?? 0) !== (session.user.tokenVersion ?? 0)) return null
  return { userId: session.user.id, role: u.role, eshopPreview: u.eshopPreview }
}
