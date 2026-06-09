import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'

/** Throws unless the caller is a logged-in admin. Returns the user id. */
export async function requireAdmin(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('unauthorized')

  const [u] = await db
    .select({ role: users.role, tokenVersion: users.tokenVersion })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (u?.role !== 'admin') throw new Error('forbidden')
  if ((u.tokenVersion ?? 0) !== (session.user.tokenVersion ?? 0)) throw new Error('stale-session')
  return session.user.id
}
