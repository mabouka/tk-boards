'use server'

import { revalidatePath } from 'next/cache'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { orders, orderLines, variants, products, users } from '@/db/schema'
import { requireAdmin } from '@/lib/require-admin'
import {
  createOrder,
  releaseStock,
  reserveStock,
  variantLabelsFor,
  type NewOrderLine,
} from '@/lib/orders'
import {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderCanceledEmail,
  sendOrderRefundedEmail,
} from '@/lib/email'
import { trackingUrlFor } from '@/lib/carriers'
import { stripe } from '@/lib/stripe'
import { vatBreakdown } from '@/lib/vat'

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

const LOCALES = ['fr', 'en', 'es']

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
    .select({
      status: orders.status,
      email: orders.email,
      number: orders.number,
      locale: orders.locale,
      paidAt: orders.paidAt,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (!current) return { ok: false, error: 'Commande introuvable.' }

  // A refund is final: letting an order climb back out of it would re-take stock
  // and re-flag it paid after Stripe already sent the money back.
  if (current.status === 'refunded' && status !== 'refunded') {
    return { ok: false, error: 'Commande remboursée — son statut ne peut plus changer.' }
  }

  const wasHeld = HELD_STATES.includes(current.status)
  const willHold = HELD_STATES.includes(status)
  if (wasHeld !== willHold) {
    const rows = await db
      .select({ variantId: orderLines.variantId, qty: orderLines.qty })
      .from(orderLines)
      .where(eq(orderLines.orderId, orderId))
    const held = rows.filter((l): l is { variantId: string; qty: number } => l.variantId !== null)
    // Refuse rather than record a held order backed by no stock: the later
    // release would invent units that were never taken.
    if (willHold) {
      if (!(await reserveStock(held))) return { ok: false, error: 'Stock insuffisant.' }
    } else {
      await releaseStock(held)
    }
  }

  await db
    .update(orders)
    .set({
      status,
      ...(status === 'shipped' ? { shippedAt: new Date() } : {}),
      // Keep the first payment date — the invoice is dated from it.
      ...(status === 'paid'
        ? { paymentStatus: 'paid' as const, ...(current.paidAt ? {} : { paidAt: new Date() }) }
        : {}),
      ...(status === 'refunded' ? { paymentStatus: 'refunded' as const } : {}),
    })
    .where(eq(orders.id, orderId))

  // Notify the buyer when the order is cancelled (best-effort). The refund email
  // is sent by refundOrder, not here, so 'refunded' isn't handled in this branch.
  if (status === 'cancelled' && current.status !== 'cancelled') {
    try {
      await sendOrderCanceledEmail({
        to: current.email,
        locale: current.locale,
        orderNumber: current.number,
      })
    } catch {
      /* email non-fatal */
    }
  }

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
      locale: orders.locale,
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
    if (!(await reserveStock(held))) return { ok: false, error: 'Stock insuffisant.' }
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
      locale: order.locale,
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

// ── Refund an order ──
// Stripe orders are refunded through the Stripe API (the money actually goes
// back); cash/transfer refunds happen outside the system, so we only record them.
// Either way the order is moved to "refunded", which releases the held stock.
export async function refundOrder(orderId: string): Promise<Result> {
  await requireAdmin()

  const [order] = await db
    .select({
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      stripePaymentIntentId: orders.stripePaymentIntentId,
      email: orders.email,
      number: orders.number,
      totalEur: orders.totalEur,
      locale: orders.locale,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  if (!order) return { ok: false, error: 'Commande introuvable.' }
  if (order.status === 'refunded' || order.paymentStatus === 'refunded') {
    return { ok: false, error: 'Commande déjà remboursée.' }
  }
  if (order.paymentStatus !== 'paid') {
    return { ok: false, error: 'Seule une commande payée peut être remboursée.' }
  }

  if (order.paymentMethod === 'stripe') {
    if (!order.stripePaymentIntentId) {
      return { ok: false, error: 'Aucun paiement Stripe associé à cette commande.' }
    }
    try {
      await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId })
    } catch (e) {
      return {
        ok: false,
        error: `Remboursement Stripe échoué : ${e instanceof Error ? e.message : 'erreur inconnue'}`,
      }
    }
  }

  // Records status + paymentStatus='refunded' and releases the held stock.
  const res = await setOrderStatus(orderId, 'refunded')
  if (!res.ok) {
    // The money is already back with the customer. Record that no matter what,
    // so the order can't be refunded a second time, and say so plainly.
    await db
      .update(orders)
      .set({ status: 'refunded', paymentStatus: 'refunded' })
      .where(eq(orders.id, orderId))
    return {
      ok: false,
      error: `Remboursement effectué, mais la mise à jour a échoué (${res.error}). Vérifie le stock.`,
    }
  }

  // Notify the buyer of the refund (best-effort — never fails the refund itself).
  try {
    await sendOrderRefundedEmail({
      to: order.email,
      locale: order.locale,
      orderNumber: order.number,
      amountEur: order.totalEur,
    })
  } catch {
    /* email non-fatal */
  }
  return res
}

// ── Manual order (admin creates a cash/transfer order for an existing account) ──
export type ManualOrderInput = {
  userId: string
  locale: string
  paymentMethod: 'cash' | 'transfer'
  paid: boolean
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
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1)
  if (!u) return { ok: false, error: 'Client introuvable.' }
  if (!input.lines.length) return { ok: false, error: 'Ajoute au moins un article.' }

  const locale = LOCALES.includes(input.locale) ? input.locale : 'fr'

  // Re-read variants from the DB — never trust a price coming from the client.
  const ids = [...new Set(input.lines.map((l) => l.variantId))]
  const rows = await db
    .select({
      id: variants.id,
      sku: variants.sku,
      priceEur: variants.priceEur,
      salePriceEur: variants.salePriceEur,
      productName: products.name,
      vatRate: products.vatRate,
    })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(inArray(variants.id, ids))
  const byId = new Map(rows.map((r) => [r.id, r]))

  // Prices are TTC. Subtotal is TTC goods; VAT is the portion included at each
  // product's rate (plus the standard rate on shipping) — see vatBreakdown below.
  // Same frozen axes the web flow records, in the customer's language.
  const labelByVariant = await variantLabelsFor(ids, locale)

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
      variantLabel: labelByVariant.get(v.id) ?? null,
      unitPriceEur: price.toFixed(2),
      vatRate: v.vatRate,
      qty,
      lineShippingEur: '0.00',
    })
  }

  const ship = Math.max(0, Number(input.shippingEur) || 0)
  const tax = vatBreakdown(lines, ship).vatEur
  const total = subtotal + ship

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
      locale,
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
      locale,
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
