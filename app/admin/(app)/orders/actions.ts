'use server'

import { revalidatePath } from 'next/cache'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { orders, orderLines, variants, products, users } from '@/db/schema'
import { requireAdmin } from '@/lib/require-admin'
import { createOrder, releaseStock, reserveStock, type NewOrderLine } from '@/lib/orders'
import { sendOrderConfirmationEmail, sendOrderShippedEmail } from '@/lib/email'
import { trackingUrlFor } from '@/lib/carriers'

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

// Stock is "held" for these statuses (paid onward); pending_payment and
// cancelled/refunded hold none. Crossing the boundary takes or returns stock, so
// a manual order that starts unpaid only reserves stock once it's marked paid.
const HELD_STATES = ['paid', 'preparing', 'shipped', 'delivered']

export async function setOrderStatus(orderId: string, status: OrderStatus): Promise<Result> {
  await requireAdmin()
  if (!orderId || !STATUSES.includes(status)) return { ok: false, error: 'Statut invalide.' }

  const [current] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (!current) return { ok: false, error: 'Commande introuvable.' }

  const wasHeld = HELD_STATES.includes(current.status)
  const willHold = HELD_STATES.includes(status)
  if (wasHeld !== willHold) {
    const rows = await db
      .select({ variantId: orderLines.variantId, qty: orderLines.qty })
      .from(orderLines)
      .where(eq(orderLines.orderId, orderId))
    const held = rows.filter((l): l is { variantId: string; qty: number } => l.variantId !== null)
    if (willHold) await reserveStock(held) // now committed → take stock
    else await releaseStock(held) // released → give it back
  }

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

// Cash/transfer orders: the admin confirms the payment was received. Routed
// through setOrderStatus so the pending→paid transition also takes the stock.
export async function markPaid(orderId: string): Promise<Result> {
  return setOrderStatus(orderId, 'paid')
}

// ── Ship an order: record carrier + tracking, move to "shipped", email the buyer ──
export async function shipOrder(input: {
  orderId: string
  carrier: string
  trackingNumber: string
  trackingUrl?: string
}): Promise<Result> {
  await requireAdmin()
  const carrier = input.carrier.trim()
  const trackingNumber = input.trackingNumber.trim()
  if (!carrier || !trackingNumber) {
    return { ok: false, error: 'Transporteur et numéro de suivi requis.' }
  }

  const [order] = await db
    .select({
      status: orders.status,
      number: orders.number,
      email: orders.email,
      userId: orders.userId,
      shipName: orders.shipName,
      shipLine1: orders.shipLine1,
      shipLine2: orders.shipLine2,
      shipPostalCode: orders.shipPostalCode,
      shipCity: orders.shipCity,
      shipCountry: orders.shipCountry,
    })
    .from(orders)
    .where(eq(orders.id, input.orderId))
    .limit(1)
  if (!order) return { ok: false, error: 'Commande introuvable.' }
  if (order.status === 'cancelled' || order.status === 'refunded') {
    return { ok: false, error: 'Commande annulée — expédition impossible.' }
  }

  // Admin URL wins; otherwise derive it for known carriers, else no link.
  const trackingUrl = input.trackingUrl?.trim() || trackingUrlFor(carrier, trackingNumber) || null

  // Move to "shipped" unless already delivered (never downgrade). Crossing into a
  // held state takes stock via the shared helper — same rule as setOrderStatus.
  const nextStatus = order.status === 'delivered' ? 'delivered' : 'shipped'
  if (!HELD_STATES.includes(order.status) && HELD_STATES.includes(nextStatus)) {
    const rows = await db
      .select({ variantId: orderLines.variantId, qty: orderLines.qty })
      .from(orderLines)
      .where(eq(orderLines.orderId, input.orderId))
    const held = rows.filter((l): l is { variantId: string; qty: number } => l.variantId !== null)
    await reserveStock(held)
  }

  await db
    .update(orders)
    .set({
      carrier,
      trackingNumber,
      trackingUrl,
      status: nextStatus,
      ...(nextStatus === 'shipped' && order.status !== 'shipped' ? { shippedAt: new Date() } : {}),
    })
    .where(eq(orders.id, input.orderId))

  // Notify the buyer (best-effort — a mail failure never fails the shipment).
  try {
    const [u] = order.userId
      ? await db.select({ locale: users.locale }).from(users).where(eq(users.id, order.userId)).limit(1)
      : []
    const lineRows = await db
      .select({ productName: orderLines.productName, qty: orderLines.qty })
      .from(orderLines)
      .where(eq(orderLines.orderId, input.orderId))
    const shipTo = [
      order.shipName,
      order.shipLine1,
      order.shipLine2,
      [order.shipPostalCode, order.shipCity].filter(Boolean).join(' '),
      order.shipCountry,
    ]
      .filter(Boolean)
      .join(', ')
    await sendOrderShippedEmail({
      to: order.email,
      locale: u?.locale ?? 'fr',
      orderNumber: order.number,
      carrier,
      trackingNumber,
      trackingUrl,
      lines: lineRows.map((l) => ({ name: l.productName, qty: l.qty })),
      shipTo,
    })
  } catch {
    /* email non-fatal */
  }

  revalidate(input.orderId)
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

  const [u] = await db
    .select({ email: users.email, locale: users.locale })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1)
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

  // Hold the stock now only if the order is already paid (a pending cash/transfer
  // order reserves nothing until "Marquer payée"). Guarded so it can't oversell.
  const stockLines = lines
    .filter((l): l is NewOrderLine & { variantId: string } => l.variantId !== null)
    .map((l) => ({ variantId: l.variantId, qty: l.qty }))
  if (input.paid && !(await reserveStock(stockLines))) {
    return { ok: false, error: 'Stock insuffisant.' }
  }

  let created: { id: string; number: string }
  try {
    created = await createOrder({
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
  } catch (e) {
    if (input.paid) await releaseStock(stockLines) // creation failed — give it back
    throw e
  }

  // Same branded confirmation the web flow sends.
  try {
    const shipTo = [
      input.ship.name,
      input.ship.line1,
      input.ship.line2,
      [input.ship.postalCode, input.ship.city].filter(Boolean).join(' '),
      input.ship.country,
    ]
      .filter(Boolean)
      .join(', ')
    await sendOrderConfirmationEmail({
      to: u.email,
      locale: u.locale,
      orderNumber: created.number,
      lines: lines.map((l) => ({
        name: l.productName,
        qty: l.qty,
        totalEur: (Number(l.unitPriceEur) * l.qty).toFixed(2),
      })),
      subtotalEur: subtotal.toFixed(2),
      taxEur: tax.toFixed(2),
      shippingEur: ship.toFixed(2),
      totalEur: total.toFixed(2),
      shipTo,
    })
  } catch {
    /* email non-fatal */
  }

  revalidatePath('/admin/orders')
  return { ok: true, id: created.id }
}
