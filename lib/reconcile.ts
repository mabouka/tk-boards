import { inArray } from 'drizzle-orm'
import { db } from '@/db'
import { orders } from '@/db/schema'
import { stripe } from '@/lib/stripe'

export type UnreconciledPayment = {
  sessionId: string
  paymentIntentId: string | null
  amountEur: string
  email: string
  createdAt: Date
}

/** How far back to look, and how long to let a webhook still be in flight. */
const DEFAULT_WINDOW_HOURS = 48
const DEFAULT_GRACE_MINUTES = 10
/** Bounds the Stripe paging on a runaway window. */
const MAX_SESSIONS = 500

/**
 * Paid Stripe sessions with no order to show for them.
 *
 * The webhook is the single point where money becomes an order, and its failure is
 * otherwise silent: three paid sessions once sat unrecorded for hours because a
 * schema change made every delivery 500, and nothing said so — it surfaced only
 * because a customer looked at "my orders". This is the check that would have
 * caught it in minutes.
 *
 * Sessions younger than the grace period are skipped: a webhook may legitimately
 * still be in flight, and Stripe retries for days, so flagging those would be noise.
 */
export async function unreconciledPayments(opts?: {
  windowHours?: number
  graceMinutes?: number
}): Promise<UnreconciledPayment[]> {
  const windowHours = opts?.windowHours ?? DEFAULT_WINDOW_HOURS
  const graceMinutes = opts?.graceMinutes ?? DEFAULT_GRACE_MINUTES
  const now = Date.now()

  const sessions = await stripe.checkout.sessions
    .list({ created: { gte: Math.floor((now - windowHours * 3_600_000) / 1000) }, limit: 100 })
    .autoPagingToArray({ limit: MAX_SESSIONS })

  const settledBefore = Math.floor((now - graceMinutes * 60_000) / 1000)
  const paid = sessions.filter(
    (s) => s.payment_status === 'paid' && s.created <= settledBefore
  )
  if (paid.length === 0) return []

  const known = new Set(
    (
      await db
        .select({ id: orders.stripeSessionId })
        .from(orders)
        .where(inArray(orders.stripeSessionId, paid.map((s) => s.id)))
    ).map((r) => r.id)
  )

  return paid
    .filter((s) => !known.has(s.id))
    .map((s) => ({
      sessionId: s.id,
      paymentIntentId:
        typeof s.payment_intent === 'string' ? s.payment_intent : (s.payment_intent?.id ?? null),
      amountEur: ((s.amount_total ?? 0) / 100).toFixed(2),
      email: s.customer_details?.email ?? s.customer_email ?? '—',
      createdAt: new Date(s.created * 1000),
    }))
}
