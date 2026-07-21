'use server'

import { revalidatePath } from 'next/cache'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { orders, variants, products, users } from '@/db/schema'
import { requireAdmin } from '@/lib/require-admin'
import { createOrder, type NewOrderLine } from '@/lib/orders'

const STATUSES = [
  'pending_payment',
  'paid',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const
export type OrderStatus = (typeof STATUSES)[number]

type Result = { ok: true } | { ok: false; error: string }

function revalidate(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
}

export async function setOrderStatus(orderId: string, status: OrderStatus): Promise<Result> {
  await requireAdmin()
  if (!orderId || !STATUSES.includes(status)) return { ok: false, error: 'Statut invalide.' }

  await db
    .update(orders)
    .set({
      status,
      ...(status === 'shipped' ? { shippedAt: new Date() } : {}),
      ...(status === 'paid' ? { paymentStatus: 'paid' as const, paidAt: new Date() } : {}),
      ...(status === 'refunded' ? { paymentStatus: 'refunded' as const } : {}),
    })
    .where(eq(orders.id, orderId))
  revalidate(orderId)
  return { ok: true }
}

// Cash/transfer orders: the admin confirms the payment was received.
export async function markPaid(orderId: string): Promise<Result> {
  await requireAdmin()
  if (!orderId) return { ok: false, error: 'Commande introuvable.' }

  await db
    .update(orders)
    .set({ paymentStatus: 'paid', paidAt: new Date(), status: 'paid' })
    .where(eq(orders.id, orderId))
  revalidate(orderId)
  return { ok: true }
}

// ── Manual order (admin creates a cash/transfer order for an existing account) ──
export type ManualOrderInput = {
  userId: string
  paymentMethod: 'cash' | 'transfer'
  paid: boolean
  taxEur: string
  shippingEur: string
  ship: {
    name?: string
    line1?: string
    line2?: string
    postalCode?: string
    city?: string
    country?: string
    phone?: string
  }
  lines: { variantId: string; qty: number }[]
}

export async function createManualOrder(
  input: ManualOrderInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireAdmin()

  const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, input.userId)).limit(1)
  if (!u) return { ok: false, error: 'Client introuvable.' }
  if (!input.lines.length) return { ok: false, error: 'Ajoute au moins un article.' }

  // Re-read variants from the DB — never trust a price coming from the client.
  const ids = [...new Set(input.lines.map((l) => l.variantId))]
  const rows = await db
    .select({
      id: variants.id,
      sku: variants.sku,
      priceEur: variants.priceEur,
      salePriceEur: variants.salePriceEur,
      productName: products.name,
    })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(inArray(variants.id, ids))
  const byId = new Map(rows.map((r) => [r.id, r]))

  const lines: NewOrderLine[] = []
  let subtotal = 0
  for (const l of input.lines) {
    const v = byId.get(l.variantId)
    if (!v) return { ok: false, error: 'Article invalide.' }
    const qty = Math.max(1, Math.floor(Number(l.qty) || 0))
    const price = Number(v.salePriceEur ?? v.priceEur)
    subtotal += price * qty
    lines.push({
      variantId: v.id,
      productSku: v.sku,
      variantSku: v.sku,
      productName: v.productName,
      variantLabel: null,
      unitPriceEur: price.toFixed(2),
      qty,
      lineShippingEur: '0.00',
    })
  }

  const tax = Math.max(0, Number(input.taxEur) || 0)
  const ship = Math.max(0, Number(input.shippingEur) || 0)
  const total = subtotal + tax + ship

  const created = await createOrder({
    userId: input.userId,
    email: u.email,
    status: input.paid ? 'paid' : 'pending_payment',
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paid ? 'paid' : 'pending',
    subtotalEur: subtotal.toFixed(2),
    taxEur: tax.toFixed(2),
    shippingEur: ship.toFixed(2),
    totalEur: total.toFixed(2),
    ship: input.ship,
    lines,
  })

  revalidatePath('/admin/orders')
  return { ok: true, id: created.id }
}
