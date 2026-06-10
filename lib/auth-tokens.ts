import { createHash, randomBytes } from 'node:crypto'
import { and, eq, lt, or, sql } from 'drizzle-orm'
import { db } from '@/db'
import { emailTokens, users } from '@/db/schema'
import type { AnyPgDatabase } from '@/lib/db-types'

export type EmailTokenType = 'verify' | 'reset'

const hashToken = (raw: string) => createHash('sha256').update(raw).digest('hex')

/** Create a single-use token, store its hash, return the raw token for the email link. */
export async function createEmailToken(
  userId: string,
  type: EmailTokenType,
  ttlMinutes: number
): Promise<string> {
  // Keep one active token per (user, type), and sweep any expired tokens.
  await db
    .delete(emailTokens)
    .where(
      or(
        and(eq(emailTokens.userId, userId), eq(emailTokens.type, type)),
        lt(emailTokens.expiresAt, new Date())
      )
    )

  const raw = randomBytes(32).toString('hex')
  await db.insert(emailTokens).values({
    userId,
    tokenHash: hashToken(raw),
    type,
    expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
  })
  return raw
}

/** Validate + consume a token (single-use). Returns the userId or null. */
export async function consumeEmailToken(
  raw: string,
  type: EmailTokenType
): Promise<string | null> {
  if (!raw) return null
  const [row] = await db
    .select()
    .from(emailTokens)
    .where(eq(emailTokens.tokenHash, hashToken(raw)))
    .limit(1)

  if (!row || row.type !== type || row.expiresAt.getTime() < Date.now()) return null

  await db.delete(emailTokens).where(eq(emailTokens.id, row.id))
  return row.userId
}

/**
 * Persist a password reset: set the new hash, mark the email verified (a valid
 * reset link proves ownership), and bump tokenVersion so any existing JWT session
 * is invalidated by the auth gates. `database` is injectable for integration tests.
 */
export async function applyPasswordReset(
  database: AnyPgDatabase,
  userId: string,
  passwordHash: string
): Promise<void> {
  await database
    .update(users)
    .set({ passwordHash, emailVerified: new Date(), tokenVersion: sql`${users.tokenVersion} + 1` })
    .where(eq(users.id, userId))
}
