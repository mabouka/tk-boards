import { and, desc, eq, gte, sql } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import { db } from '@/db'
import { orders, orderLines, users, variants } from '@/db/schema'
import { createEmailToken } from '@/lib/auth-tokens'
import { sendPasswordResetEmail } from '@/lib/email'

export type StockLine = { variantId: string; qty: number }

/** Atomically hold stock for these lines. Each decrement is guarded (stock >= qty)
 *  so two concurrent buyers of the last unit can't both succeed; on any shortfall
 *  the already-held lines are released and it returns false (nothing reserved). */
export async function reserveStock(lines: StockLine[]): Promise<boolean> {
  const held: StockLine[] = []
  for (const l of lines) {
    const res = await db
      .update(variants)
      .set({ stock: sql`${variants.stock} - ${l.qty}` })
      .where(and(eq(variants.id, l.variantId), gte(variants.stock, l.qty)))
      .returning({ id: variants.id })
    if (res.length === 0) {
      await releaseStock(held)
      return false
    }
    held.push(l)
  }
  return true
}

/** Give stock back (session expired, order cancelled/refunded). */
export async function releaseStock(lines: StockLine[]): Promise<void> {
  for (const l of lines) {
    await db
      .update(variants)
      .set({ stock: sql`${variants.stock} + ${l.qty}` })
      .where(eq(variants.id, l.variantId))
  }
}

const LOCALES = ['fr', 'en', 'es']
const loc = (v: string | null | undefined) => (LOCALES.includes(String(v)) ? String(v) : 'fr')

/** Sequential human-readable number, e.g. TK-2026-0001. Low volume; the unique
 *  index on order.number is the backstop against a rare concurrent collision. */
async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `TK-${year}-`
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(orders)
    .where(sql`${orders.number} like ${`${prefix}%`}`)
  return `${prefix}${String(Number(n) + 1).padStart(4, '0')}`
}

/** Find the account for this email, or create a light one (no password) and email
 *  a "set your password" link so the buyer can claim it. Returns the user id. */
export async function resolveOrCreateUser(opts: {
  email: string
  name?: string | null
  locale?: string | null
}): Promise<string> {
  const email = opts.email.toLowerCase()
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (existing) return existing.id

  const [created] = await db
    .insert(users)
    .values({ email, name: opts.name || null, role: 'customer', locale: loc(opts.locale) })
    .returning({ id: users.id })

  // Invite to set a password (reuses the reset flow — the link lets them choose one).
  try {
    const token = await createEmailToken(created.id, 'reset', 60 * 24 * 7) // 7 days
    await sendPasswordResetEmail({ to: email, locale: loc(opts.locale), token })
  } catch {
    /* non-fatal: the account exists; they can use "forgot password" later */
  }
  return created.id
}

export type NewOrderLine = {
  variantId: string | null
  productSku: string
  variantSku: string | null
  productName: string
  variantLabel: string | null
  unitPriceEur: string // '490.00'
  qty: number
  lineShippingEur: string
}

export type NewOrder = {
  userId: string | null
  email: string
  status: string
  paymentMethod: 'stripe' | 'cash' | 'transfer'
  paymentStatus: 'pending' | 'paid'
  subtotalEur: string
  taxEur: string
  shippingEur: string
  totalEur: string
  ship: {
    name?: string | null
    line1?: string | null
    line2?: string | null
    postalCode?: string | null
    city?: string | null
    country?: string | null
    phone?: string | null
  }
  stripeSessionId?: string | null
  stripePaymentIntentId?: string | null
  lines: NewOrderLine[]
}

const isUniqueViolation = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && 'code' in e && (e as { code?: unknown }).code === '23505'

/** Insert an order + its lines atomically. Stock is never touched here — callers
 *  hold it via reserveStock (web checkout, manual paid orders, mark-paid) and give
 *  it back via releaseStock, so takes and returns always stay symmetric. */
export async function createOrder(input: NewOrder): Promise<{ id: string; number: string }> {
  const id = crypto.randomUUID()

  const buildStmts = (number: string): [BatchItem<'pg'>, ...BatchItem<'pg'>[]] => {
    const stmts: BatchItem<'pg'>[] = [
      db.insert(orders).values({
        id,
        number,
        userId: input.userId,
        email: input.email.toLowerCase(),
        status: input.status,
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentStatus,
        subtotalEur: input.subtotalEur,
        taxEur: input.taxEur,
        shippingEur: input.shippingEur,
        totalEur: input.totalEur,
        shipName: input.ship.name ?? null,
        shipLine1: input.ship.line1 ?? null,
        shipLine2: input.ship.line2 ?? null,
        shipPostalCode: input.ship.postalCode ?? null,
        shipCity: input.ship.city ?? null,
        shipCountry: input.ship.country ?? null,
        shipPhone: input.ship.phone ?? null,
        stripeSessionId: input.stripeSessionId ?? null,
        stripePaymentIntentId: input.stripePaymentIntentId ?? null,
        paidAt: input.paymentStatus === 'paid' ? new Date() : null,
      }),
    ]
    if (input.lines.length) {
      stmts.push(db.insert(orderLines).values(input.lines.map((l) => ({ orderId: id, ...l }))))
    }
    return stmts as [BatchItem<'pg'>, ...BatchItem<'pg'>[]]
  }

  // The number is count-derived, so a concurrent order can grab the same one; the
  // unique index rejects the loser and, because the batch is atomic, it writes
  // nothing — so we just recompute and retry.
  for (let attempt = 0; attempt < 5; attempt++) {
    const number = await nextOrderNumber()
    try {
      await db.batch(buildStmts(number))
      return { id, number }
    } catch (e) {
      if (attempt < 4 && isUniqueViolation(e)) continue
      throw e
    }
  }
  throw new Error('order number generation exhausted retries')
}

// ── Account: read a user's orders ──
export async function getUserOrders(userId: string) {
  if (!userId) return []
  return db
    .select({
      number: orders.number,
      status: orders.status,
      totalEur: orders.totalEur,
      createdAt: orders.createdAt,
      itemCount: sql<number>`(select coalesce(sum(${orderLines.qty}), 0) from ${orderLines} where ${orderLines.orderId} = ${orders.id})::int`,
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
}

/** One order (by number) with its lines — scoped to the owner. */
export async function getUserOrder(userId: string, number: string) {
  if (!userId || !number) return null
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.number, number)))
    .limit(1)
  if (!order) return null

  const lines = await db
    .select({
      productName: orderLines.productName,
      variantSku: orderLines.variantSku,
      variantLabel: orderLines.variantLabel,
      unitPriceEur: orderLines.unitPriceEur,
      qty: orderLines.qty,
    })
    .from(orderLines)
    .where(eq(orderLines.orderId, order.id))

  return { order, lines }
}
