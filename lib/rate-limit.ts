import { headers } from 'next/headers'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { rateLimits } from '@/db/schema'

/**
 * Fixed-window rate limiter backed by Neon. The whole increment is a single
 * atomic `INSERT … ON CONFLICT DO UPDATE … RETURNING`, so it is race-safe
 * without a transaction (which neon-http doesn't support).
 *
 * @returns true if allowed, false if the limit is exceeded.
 */
export async function rateLimit(
  name: string,
  id: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  const key = `${name}:${id}`
  const [row] = await db
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

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}
