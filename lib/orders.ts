import { eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { orders, orderLines, users, variants } from '@/db/schema'
import { createEmailToken } from '@/lib/auth-tokens'
import { sendPasswordResetEmail } from '@/lib/email'

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

/** Insert an order + its lines and decrement stock. Sequential writes (neon-http
 *  has no interactive transaction), so stock is clamped at 0 defensively. */
export async function createOrder(input: NewOrder): Promise<{ id: string; number: string }> {
  const number = await nextOrderNumber()
  const [order] = await db
    .insert(orders)
    .values({
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
    })
    .returning({ id: orders.id })

  if (input.lines.length) {
    await db.insert(orderLines).values(input.lines.map((l) => ({ orderId: order.id, ...l })))
  }

  for (const l of input.lines) {
    if (l.variantId) {
      await db
        .update(variants)
        .set({ stock: sql`greatest(${variants.stock} - ${l.qty}, 0)` })
        .where(eq(variants.id, l.variantId))
    }
  }

  return { id: order.id, number }
}
