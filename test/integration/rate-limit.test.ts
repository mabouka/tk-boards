import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { eq, sql } from 'drizzle-orm'
import { rateLimits } from '@/db/schema'
import { rateLimit } from '@/lib/rate-limit'
import { makeTestDb, truncateAll } from './db'

const { db, pool } = makeTestDb()

beforeEach(() => truncateAll(pool))
afterAll(() => pool.end())

describe('rateLimit — fixed window', () => {
  it('allows up to the limit, then blocks within the window', async () => {
    const hit = () => rateLimit('login', 'ip1', 3, 60, db)
    expect(await hit()).toBe(true) // 1
    expect(await hit()).toBe(true) // 2
    expect(await hit()).toBe(true) // 3
    expect(await hit()).toBe(false) // 4 — over the limit
  })

  it('tracks each (name, id) key independently', async () => {
    expect(await rateLimit('login', 'A', 1, 60, db)).toBe(true)
    expect(await rateLimit('login', 'A', 1, 60, db)).toBe(false)
    expect(await rateLimit('login', 'B', 1, 60, db)).toBe(true) // different id
    expect(await rateLimit('forgot', 'A', 1, 60, db)).toBe(true) // different name
  })

  it('resets the counter once the window has expired', async () => {
    expect(await rateLimit('w', 'x', 1, 60, db)).toBe(true)
    expect(await rateLimit('w', 'x', 1, 60, db)).toBe(false) // limit reached

    // Force the window into the past — the next hit should start a fresh window.
    await db
      .update(rateLimits)
      .set({ expiresAt: sql`now() - interval '1 second'` })
      .where(eq(rateLimits.key, 'w:x'))

    expect(await rateLimit('w', 'x', 1, 60, db)).toBe(true)
  })
})
