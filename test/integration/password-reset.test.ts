import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { users } from '@/db/schema'
import { applyPasswordReset } from '@/lib/auth-tokens'
import { makeTestDb, truncateAll } from './db'

const { db, pool } = makeTestDb()

beforeEach(() => truncateAll(pool))
afterAll(() => pool.end())

async function seedUser() {
  const [u] = await db
    .insert(users)
    .values({ email: 'r@x.com', passwordHash: 'OLD' })
    .returning({ id: users.id })
  return u.id
}

async function getUser(id: string) {
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return u
}

describe('applyPasswordReset — session invalidation', () => {
  it('sets the new hash, verifies the email, and bumps tokenVersion', async () => {
    const id = await seedUser()
    const before = await getUser(id)
    expect(before.tokenVersion).toBe(0)
    expect(before.emailVerified).toBeNull()

    await applyPasswordReset(db, id, 'NEW')

    const after = await getUser(id)
    expect(after.passwordHash).toBe('NEW')
    expect(after.tokenVersion).toBe(1) // old JWTs (v=0) are now stale
    expect(after.emailVerified).not.toBeNull()
  })

  it('bumps tokenVersion on every reset (each one invalidates prior sessions)', async () => {
    const id = await seedUser()
    await applyPasswordReset(db, id, 'a')
    await applyPasswordReset(db, id, 'b')
    expect((await getUser(id)).tokenVersion).toBe(2)
  })
})
