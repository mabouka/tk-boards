import type Stripe from 'stripe'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { orders, variants } from '@/db/schema'
import { stripe } from '@/lib/stripe'
import { createOrder, resolveOrCreateUser, releaseStock, type NewOrderLine } from '@/lib/orders'
import { sendOrderConfirmationEmail } from '@/lib/email'

export const runtime = 'nodejs'

const money = (cents: number | null | undefined) => ((cents ?? 0) / 100).toFixed(2)

// The variant SKU we stashed in the line item's product metadata at checkout.
const skuOf = (item: Stripe.LineItem): string => {
  const p = item.price?.product
  return p && typeof p === 'object' && 'metadata' in p ? (p.metadata?.sku ?? '') : ''
}

// Map a session's line items back to variant ids + quantities (for stock).
async function sessionStockLines(sessionId: string): Promise<{ variantId: string; qty: number }[]> {
  const li = await stripe.checkout.sessions.listLineItems(sessionId, {
    expand: ['data.price.product'],
    limit: 100,
  })
  const skus = [...new Set(li.data.map(skuOf).filter(Boolean))]
  const idBySku = new Map<string, string>()
  if (skus.length) {
    const rows = await db.select({ id: variants.id, sku: variants.sku }).from(variants).where(inArray(variants.sku, skus))
    rows.forEach((r) => idBySku.set(r.sku, r.id))
  }
  return li.data
    .map((it) => ({ variantId: idBySku.get(skuOf(it)) ?? '', qty: it.quantity ?? 1 }))
    .filter((l) => l.variantId !== '')
}

// Stripe payment webhook — the source of truth for turning a paid Checkout
// session into an order. Verifies the signature, is idempotent (one order per
// session), then records the order, decrements stock, resolves the account and
// emails a confirmation.
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !secret) return new Response('Missing signature', { status: 400 })

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  if (
    event.type !== 'checkout.session.completed' &&
    event.type !== 'checkout.session.expired'
  ) {
    return new Response('ignored', { status: 200 })
  }

  const session = event.data.object

  // Abandoned/expired session → give back the stock reserved at checkout.
  if (event.type === 'checkout.session.expired') {
    await releaseStock(await sessionStockLines(session.id))
    return new Response('released', { status: 200 })
  }

  if (session.payment_status !== 'paid') return new Response('unpaid', { status: 200 })

  // Idempotency: the unique index on stripe_session_id backs this too.
  const [existing] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.stripeSessionId, session.id))
    .limit(1)
  if (existing) return new Response('already processed', { status: 200 })

  const locale = session.metadata?.locale || 'fr'
  const email = session.customer_details?.email ?? session.customer_email ?? ''
  if (!email) return new Response('no email', { status: 200 })

  // Line items carry the variant SKU in the product metadata we set at checkout.
  const li = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ['data.price.product'],
    limit: 100,
  })
  const skus = [...new Set(li.data.map(skuOf).filter(Boolean))]
  const variantIdBySku = new Map<string, string>()
  if (skus.length) {
    const rows = await db
      .select({ id: variants.id, sku: variants.sku })
      .from(variants)
      .where(inArray(variants.sku, skus))
    rows.forEach((r) => variantIdBySku.set(r.sku, r.id))
  }

  const lines: NewOrderLine[] = li.data.map((item) => {
    const sku = skuOf(item)
    const qty = item.quantity ?? 1
    const lineSubtotal = item.amount_subtotal ?? 0 // pre-tax, cents
    return {
      variantId: variantIdBySku.get(sku) ?? null,
      productSku: sku,
      variantSku: sku || null,
      productName: item.description ?? sku,
      variantLabel: null,
      unitPriceEur: money(qty > 0 ? Math.round(lineSubtotal / qty) : lineSubtotal),
      qty,
      lineShippingEur: '0.00',
    }
  })

  const userId = await resolveOrCreateUser({
    email,
    name: session.customer_details?.name ?? null,
    locale,
  })

  // Shipping address the customer entered on Stripe (Basil API: under
  // collected_information); fall back to the billing/customer address.
  const shipping = session.collected_information?.shipping_details
  const addr = shipping?.address ?? session.customer_details?.address ?? null
  const shipName = shipping?.name ?? session.customer_details?.name ?? null

  const created = await createOrder({
    userId,
    email,
    status: 'paid',
    paymentMethod: 'stripe',
    paymentStatus: 'paid',
    subtotalEur: money(session.amount_subtotal),
    taxEur: money(session.total_details?.amount_tax),
    shippingEur: money(session.total_details?.amount_shipping),
    totalEur: money(session.amount_total),
    ship: {
      name: shipName,
      line1: addr?.line1 ?? null,
      line2: addr?.line2 ?? null,
      postalCode: addr?.postal_code ?? null,
      city: addr?.city ?? null,
      country: addr?.country ?? null,
      phone: session.customer_details?.phone ?? null,
    },
    stripeSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? null),
    lines,
    // Stock was already reserved when the session was created (checkout action).
  }, { decrementStock: false })

  // Confirmation email — best effort; never fail the webhook on a mail error.
  try {
    const shipTo = [
      shipName,
      addr?.line1,
      addr?.line2,
      [addr?.postal_code, addr?.city].filter(Boolean).join(' '),
      addr?.country,
    ]
      .filter(Boolean)
      .join(', ')
    await sendOrderConfirmationEmail({
      to: email,
      locale,
      orderNumber: created.number,
      lines: lines.map((l) => ({
        name: l.productName,
        qty: l.qty,
        totalEur: (Number(l.unitPriceEur) * l.qty).toFixed(2),
      })),
      subtotalEur: money(session.amount_subtotal),
      taxEur: money(session.total_details?.amount_tax),
      shippingEur: money(session.total_details?.amount_shipping),
      totalEur: money(session.amount_total),
      shipTo,
    })
  } catch {
    /* mail failure is non-fatal */
  }

  return new Response('ok', { status: 200 })
}
