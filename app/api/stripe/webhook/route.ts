import type Stripe from 'stripe'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { orders, variants, products, users } from '@/db/schema'
import { stripe } from '@/lib/stripe'
import { createOrder, resolveOrCreateUser, releaseStock, type NewOrderLine } from '@/lib/orders'
import {
  claimWebhookEvent,
  releaseWebhookEvent,
  pruneWebhookEvents,
} from '@/lib/webhook-events'
import { sendOrderConfirmationEmail } from '@/lib/email'
import { vatBreakdown, DEFAULT_VAT_RATE } from '@/lib/vat'

export const runtime = 'nodejs'

const money = (cents: number | null | undefined) => ((cents ?? 0) / 100).toFixed(2)

const HANDLED_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
] as const
type HandledEvent = Extract<Stripe.Event, { type: (typeof HANDLED_EVENTS)[number] }>
const isHandled = (e: Stripe.Event): e is HandledEvent =>
  (HANDLED_EVENTS as readonly string[]).includes(e.type)

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

  // Async methods (Bancontact, SEPA…) complete the session before the money
  // clears, so the order is created on async_payment_succeeded — a *different*
  // event — and the stock goes back on async_payment_failed.
  if (!isHandled(event)) {
    return new Response('ignored', { status: 200 })
  }

  // Claim before doing anything with side effects, so a redelivery can't repeat
  // them — notably the expired branch's stock release.
  if (!(await claimWebhookEvent(event.id, event.type))) {
    return new Response('duplicate', { status: 200 })
  }
  await pruneWebhookEvents()

  try {
    return await handleEvent(event)
  } catch (e) {
    // Hand the claim back so Stripe's retry isn't answered with 'duplicate'.
    await releaseWebhookEvent(event.id)
    throw e
  }
}

async function handleEvent(event: HandledEvent): Promise<Response> {
  const session = event.data.object

  // Abandoned, expired, or an async payment that never cleared → give back the
  // stock reserved at checkout.
  if (
    event.type === 'checkout.session.expired' ||
    event.type === 'checkout.session.async_payment_failed'
  ) {
    await releaseStock(await sessionStockLines(session.id))
    return new Response('released', { status: 200 })
  }

  // A session can complete before an async payment clears; the order is written
  // when async_payment_succeeded arrives.
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
  const vatBySku = new Map<string, number>()
  if (skus.length) {
    const rows = await db
      .select({ id: variants.id, sku: variants.sku, vatRate: products.vatRate })
      .from(variants)
      .innerJoin(products, eq(products.id, variants.productId))
      .where(inArray(variants.sku, skus))
    rows.forEach((r) => {
      variantIdBySku.set(r.sku, r.id)
      vatBySku.set(r.sku, r.vatRate)
    })
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
      vatRate: vatBySku.get(sku) ?? DEFAULT_VAT_RATE,
      qty,
      lineShippingEur: '0.00',
    }
  })

  // VAT is ours to compute (prices are TTC). Extracted once per rate — the same
  // helper the invoice uses — so the stored tax matches the invoice exactly.
  const shippingEur = money(session.total_details?.amount_shipping)
  const vat = vatBreakdown(lines, shippingEur)

  // Prefer the signed-in buyer's account (stashed in metadata at checkout, and
  // re-checked here); fall back to resolving/creating an account by email for
  // guests.
  let userId: string | null = null
  const metaUserId = session.metadata?.userId
  if (metaUserId) {
    const [u] = await db.select({ id: users.id }).from(users).where(eq(users.id, metaUserId)).limit(1)
    userId = u?.id ?? null
  }
  if (!userId) {
    userId = await resolveOrCreateUser({ email, name: session.customer_details?.name ?? null, locale })
  }

  // Shipping address we collected on our checkout page (carried in session
  // metadata); fall back to anything Stripe collected, for safety.
  let ship: {
    name: string | null
    line1: string | null
    line2: string | null
    postalCode: string | null
    city: string | null
    country: string | null
    phone: string | null
  } = { name: null, line1: null, line2: null, postalCode: null, city: null, country: null, phone: null }

  if (session.metadata?.ship) {
    try {
      const p = JSON.parse(session.metadata.ship)
      ship = {
        name: p.name || null,
        line1: p.line1 || null,
        line2: p.line2 || null,
        postalCode: p.postalCode || null,
        city: p.city || null,
        country: p.country || null,
        phone: p.phone || null,
      }
    } catch {
      /* fall through to Stripe-collected below */
    }
  }
  if (!ship.line1) {
    const sd = session.collected_information?.shipping_details
    const addr = sd?.address ?? session.customer_details?.address ?? null
    ship = {
      name: sd?.name ?? session.customer_details?.name ?? null,
      line1: addr?.line1 ?? null,
      line2: addr?.line2 ?? null,
      postalCode: addr?.postal_code ?? null,
      city: addr?.city ?? null,
      country: addr?.country ?? null,
      phone: session.customer_details?.phone ?? null,
    }
  }

  const created = await createOrder({
    userId,
    email,
    locale,
    status: 'paid',
    paymentMethod: 'stripe',
    paymentStatus: 'paid',
    subtotalEur: money(session.amount_subtotal),
    taxEur: vat.vatEur.toFixed(2),
    shippingEur,
    totalEur: money(session.amount_total),
    ship: {
      name: ship.name,
      line1: ship.line1,
      line2: ship.line2,
      postalCode: ship.postalCode,
      city: ship.city,
      country: ship.country,
      phone: ship.phone,
    },
    stripeSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? null),
    // Stock was already reserved when the session was created (checkout action).
    lines,
  })

  // Confirmation email — best effort; never fail the webhook on a mail error.
  try {
    const shipTo = [
      ship.name,
      ship.line1,
      ship.line2,
      [ship.postalCode, ship.city].filter(Boolean).join(' '),
      ship.country,
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
      taxEur: vat.vatEur.toFixed(2),
      shippingEur,
      totalEur: money(session.amount_total),
      shipTo,
    })
  } catch {
    /* mail failure is non-fatal */
  }

  return new Response('ok', { status: 200 })
}
