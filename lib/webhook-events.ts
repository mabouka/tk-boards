import { eq, lt } from 'drizzle-orm'
import { db } from '@/db'
import { webhookEvents } from '@/db/schema'
import { isUniqueViolation } from '@/lib/orders'
import type { AnyPgDatabase } from '@/lib/db-types'

/** Stripe only retries for three days, so a claim older than that protects nothing. */
export const CLAIM_RETENTION_DAYS = 7

/**
 * Take exclusive ownership of a Stripe event, returning false if it was already
 * handled.
 *
 * Stripe delivers at-least-once and retries every non-2xx, so a handler with side
 * effects must be able to recognise a redelivery. Without this, a repeated
 * `checkout.session.expired` gave the same stock back twice.
 *
 * The claim is taken *before* the work, not after: two deliveries racing each other
 * would both pass a prior "have I seen this?" read, whereas only one can win the
 * insert.
 */
export async function claimWebhookEvent(
  id: string,
  type: string,
  database: AnyPgDatabase = db
): Promise<boolean> {
  try {
    await database.insert(webhookEvents).values({ id, type })
    return true
  } catch (e) {
    if (isUniqueViolation(e)) return false
    throw e
  }
}

/**
 * Give a claim back so Stripe's retry gets another chance.
 *
 * Called when handling failed. Never throws: losing the original error to a
 * cleanup failure would hide why the event failed in the first place.
 */
export async function releaseWebhookEvent(
  id: string,
  database: AnyPgDatabase = db
): Promise<void> {
  try {
    await database.delete(webhookEvents).where(eq(webhookEvents.id, id))
  } catch {
    /* the row survives; the prune below reclaims it */
  }
}

/** Keep the table bounded. Best-effort — never fail a webhook over housekeeping. */
export async function pruneWebhookEvents(
  database: AnyPgDatabase = db,
  olderThanDays = CLAIM_RETENTION_DAYS
): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - olderThanDays * 86_400_000)
    await database.delete(webhookEvents).where(lt(webhookEvents.receivedAt, cutoff))
  } catch {
    /* housekeeping only */
  }
}
