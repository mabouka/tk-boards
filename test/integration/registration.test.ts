import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { users, units, registrations } from '@/db/schema'
import { makeTestDb, truncateAll } from './db'

const { db, pool } = makeTestDb()

beforeEach(() => truncateAll(pool))
afterAll(() => pool.end())

async function seed() {
  const [u1] = await db.insert(users).values({ email: 'a@x.com' }).returning({ id: users.id })
  const [u2] = await db.insert(users).values({ email: 'b@x.com' }).returning({ id: users.id })
  const [unit] = await db.insert(units).values({ token: 'tok-1' }).returning({ id: units.id })
  return { u1, u2, unit }
}

describe('registration — first-tap-wins', () => {
  it('allows only one active registration per unit', async () => {
    const { u1, u2, unit } = await seed()
    await db.insert(registrations).values({ userId: u1.id, unitId: unit.id })

    // Second tap on the same physical unit must be rejected by the partial unique index.
    await expect(
      db.insert(registrations).values({ userId: u2.id, unitId: unit.id })
    ).rejects.toThrow()
  })

  it('lets a new owner register once the prior registration is no longer active', async () => {
    const { u1, u2, unit } = await seed()
    const [r1] = await db
      .insert(registrations)
      .values({ userId: u1.id, unitId: unit.id })
      .returning({ id: registrations.id })

    // Owner transfers / releases the board → registration is no longer active.
    await db.update(registrations).set({ status: 'transferred' }).where(eq(registrations.id, r1.id))

    // The index only constrains active rows, so a fresh active registration is allowed.
    await expect(
      db.insert(registrations).values({ userId: u2.id, unitId: unit.id })
    ).resolves.toBeDefined()
  })
})
