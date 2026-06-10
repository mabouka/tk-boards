import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { rateLimits } from '@/db/schema'
import type { AnyPgDatabase } from '@/lib/db-types'

/**
 * Fixed-window rate limiter backed by Neon. The whole increment is a single
 * atomic `INSERT … ON CONFLICT DO UPDATE … RETURNING`, so it is race-safe
 * without a transaction (which neon-http doesn't support).
 *
 * `database` is injectable so the window logic can be integration-tested against
 * a real Postgres; the app uses the default neon-http singleton.
 *
 * @returns true if allowed, false if the limit is exceeded.
 */
export async function rateLimit(
  name: string,
  id: string,
  limit: number,
  windowSec: number,
  database: AnyPgDatabase = db
): Promise<boolean> {
  const key = `${name}:${id}`
  const [row] = await database
    .insert(rateLimits)
    .values({ key, count: 1, expiresAt: sql`now() + (${windowSec} * interval '1 second')` })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.expiresAt} <= now() then 1 else ${rateLimits.count} + 1 end`,
        expiresAt: sql`case when ${rateLimits.expiresAt} <= now() then now() + (${windowSec} * interval '1 second') else ${rateLimits.expiresAt} end`,
      },
    })
    .returning({ count: rateLimits.count })

  return (row?.count ?? 0) <= limit
}
