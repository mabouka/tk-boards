'use server'

import type Stripe from 'stripe'
import { desc, eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { variants, products, users, addresses } from '@/db/schema'
import { liveSession } from '@/lib/session'
import { stripe } from '@/lib/stripe'
import { reserveStock, releaseStock } from '@/lib/orders'
import { cartShippingQuotes, shippingForCountry } from '@/lib/shipping'
import { isCountryCode } from '@/lib/countries'
import { vatBreakdown, vatFromTtcCents, SHIPPING_VAT_RATE } from '@/lib/vat'
import { rateLimit } from '@/lib/rate-limit'
import { clientIp } from '@/lib/client-ip'
import { eshopVisible } from '@/lib/eshop'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const LOCALES = ['fr', 'en', 'es']
const loc = (v: unknown) => (LOCALES.includes(String(v)) ? String(v) : 'en')
const SHIP_LABEL: Record<string, string> = { fr: 'Livraison', en: 'Shipping', es: 'Envío' }
const clean = (v: unknown) => String(v ?? '').trim()
// Checkout holds stock the moment the session is created, so we let it lapse
// close to Stripe's 30-minute floor. The extra minute is deliberate: Stripe
// validates expires_at against its own clock, so landing exactly on 1800s means
// any clock skew or request latency gets the session rejected outright.
const SESSION_TTL_SECONDS = 31 * 60

export type CheckoutItem = { sku: string; qty: number }
export type ShipAddress = {
  name: string
  line1: string
  line2?: string
  postalCode: string
  city: string
  country: string
  phone?: string
}
export type CheckoutResult = {
  url?: string
  error?: 'empty' | 'unavailable' | 'stock' | 'failed' | 'shipping_country' | 'address' | 'too_large' | 'rate'
}

type CartLineResolved = {
  sku: string
  name: string
  unitPriceEur: number // TTC (VAT included)
  qty: number
  variantId: string
  productId: string
  vatRate: number
}

// Bounds on a cart, far above anything a real order looks like. Their job is to
// stop a caller asking to hold a whole warehouse: stock is reserved the moment a
// session is created, so an unbounded qty is an unbounded reservation.
const MAX_CART_LINES = 20
const MAX_QTY_PER_LINE = 10

// Re-read every cart line from the DB — the client only supplies variant SKU +
// qty, so price, availability and the owning product are always authoritative.
async function readCartLines(
  items: CheckoutItem[]
): Promise<{ error: 'empty' | 'unavailable' | 'too_large' } | { lines: CartLineResolved[] }> {
  if (!Array.isArray(items) || items.length === 0) return { error: 'empty' }
  if (items.length > MAX_CART_LINES) return { error: 'too_large' }
  const skus = [...new Set(items.map((i) => String(i.sku)))]
  const rows = await db
    .select({
      id: variants.id,
      sku: variants.sku,
      priceEur: variants.priceEur,
      salePriceEur: variants.salePriceEur,
      active: variants.active,
      productId: products.id,
      productName: products.name,
      productActive: products.active,
      vatRate: products.vatRate,
    })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(inArray(variants.sku, skus))
  const bySku = new Map(rows.map((r) => [r.sku, r]))

  const lines: CartLineResolved[] = []
  for (const it of items) {
    const qty = Math.max(1, Math.floor(Number(it.qty) || 0))
    if (qty > MAX_QTY_PER_LINE) return { error: 'too_large' }
    const v = bySku.get(String(it.sku))
    if (!v || !v.active || !v.productActive) return { error: 'unavailable' }
    lines.push({
      sku: v.sku,
      name: v.productName,
      unitPriceEur: Number(v.salePriceEur ?? v.priceEur),
      qty,
      variantId: v.id,
      productId: v.productId,
      vatRate: v.vatRate,
    })
  }
  return { lines }
}

export type CheckoutQuoteLine = { sku: string; name: string; unitPriceEur: number; qty: number }
export type CheckoutQuote =
  | { ok: false; error: 'empty' | 'unavailable' | 'too_large' }
  | {
      ok: true
      subtotalEur: number // TTC (VAT included)
      goodsVatEur: number // VAT in the goods alone, before a country is picked
      lines: CheckoutQuoteLine[]
      // vatEur is the total VAT for that destination (goods + its shipping),
      // computed with the same helper the order and invoice use.
      quotes: { country: string; shippingEur: number; vatEur: number }[]
    }

// Everything the checkout page needs to render: authoritative TTC line prices, the
// subtotal, the VAT included in the goods, and the destinations the whole cart can
// ship to — each with its TTC charge and the total VAT that destination implies.
export async function getCheckoutQuote(items: CheckoutItem[]): Promise<CheckoutQuote> {
  // Server-side gate: the checkout page already redirects when the shop is off, but
  // this action is public, so it refuses on its own too.
  if (!(await eshopVisible())) return { ok: false, error: 'unavailable' }
  const read = await readCartLines(items)
  if ('error' in read) return { ok: false, error: read.error }
  const { lines } = read
  const subtotalEur = lines.reduce((s, l) => s + l.unitPriceEur * l.qty, 0)
  // Extract VAT once per rate, exactly as the order and invoice do — summing it
  // line by line here would show the buyer a figure a cent off the final one.
  //
  // Shipping only ever lands in the standard-rate row, so the goods are broken
  // down once and each destination just re-extracts that single row: O(lines +
  // countries) instead of a full breakdown per country.
  const goods = vatBreakdown(lines, 0)
  const goodsVatEur = goods.vatEur
  const std = goods.buckets.find((b) => b.rate === SHIPPING_VAT_RATE)
  const stdTtcCents = Math.round((std?.totalEur ?? 0) * 100)
  const otherVatCents = Math.round((goods.vatEur - (std?.vatEur ?? 0)) * 100)

  const quotes = (await cartShippingQuotes(lines.map((l) => l.productId))).map((q) => ({
    ...q,
    vatEur:
      (otherVatCents +
        vatFromTtcCents(stdTtcCents + Math.round(q.shippingEur * 100), SHIPPING_VAT_RATE)) /
      100,
  }))
  return {
    ok: true,
    subtotalEur,
    goodsVatEur,
    lines: lines.map((l) => ({ sku: l.sku, name: l.name, unitPriceEur: l.unitPriceEur, qty: l.qty })),
    quotes,
  }
}

// Prefill the checkout address form for a signed-in buyer from their default
// saved address (the name comes from the account; the country is left to the
// shippable-country selector, since saved addresses may store a free-text one).
export type SavedAddress = {
  name: string
  line1: string
  line2: string
  postalCode: string
  city: string
  phone: string
}
export async function getSavedAddress(): Promise<SavedAddress | null> {
  const sess = await liveSession()
  if (!sess) return null
  const [u] = await db
    .select({ name: users.name, firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(eq(users.id, sess.userId))
    .limit(1)
  const [a] = await db
    .select({
      line1: addresses.line1,
      line2: addresses.line2,
      postalCode: addresses.postalCode,
      city: addresses.city,
      phone: addresses.phone,
    })
    .from(addresses)
    .where(eq(addresses.userId, sess.userId))
    .orderBy(desc(addresses.isDefault))
    .limit(1)
  const name = [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.name || ''
  // Still worth returning with no saved address: the account name alone spares the
  // buyer from retyping it.
  if (!a && !name) return null
  return {
    name,
    line1: a?.line1 ?? '',
    line2: a?.line2 ?? '',
    postalCode: a?.postalCode ?? '',
    city: a?.city ?? '',
    phone: a?.phone ?? '',
  }
}

// Create a Stripe Checkout session for a cart shipped to `address`. VAT is ours
// (prices are TTC), so Stripe applies no tax and collects no address: it just
// charges the amounts. Shipping is recomputed server-side as a fixed shipping
// option, and the address travels to the order via session metadata.
export async function createCheckoutSession(
  items: CheckoutItem[],
  localeRaw: string,
  address: ShipAddress
): Promise<CheckoutResult> {
  // Same server-side gate as the quote: refuse to open a Stripe session while the
  // shop is off, even if the action is called directly.
  if (!(await eshopVisible())) return { error: 'failed' }

  const locale = loc(localeRaw)
  const dest = clean(address?.country).toUpperCase()
  if (!isCountryCode(dest)) return { error: 'shipping_country' }

  const name = clean(address.name)
  const line1 = clean(address.line1)
  const line2 = clean(address.line2)
  const postalCode = clean(address.postalCode)
  const city = clean(address.city)
  const phone = clean(address.phone)
  if (!name || !line1 || !postalCode || !city) return { error: 'address' }

  const read = await readCartLines(items)
  if ('error' in read) return { error: read.error }
  const { lines } = read

  // Authoritative shipping — must be deliverable to dest (every product has a rate).
  const shipping = await shippingForCountry(
    lines.map((l) => l.productId),
    dest
  )
  if (shipping === null) return { error: 'shipping_country' }

  // Prices are TTC (VAT included) and we compute VAT ourselves, so Stripe applies
  // no tax — it just charges the amounts.
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = lines.map((l) => ({
    quantity: l.qty,
    price_data: {
      currency: 'eur',
      unit_amount: Math.round(l.unitPriceEur * 100),
      product_data: { name: l.name, metadata: { sku: l.sku } },
    },
  }))
  const reserveLines = lines.map((l) => ({ variantId: l.variantId, qty: l.qty }))

  const sess = await liveSession()
  let email: string | undefined
  if (sess) {
    const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, sess.userId)).limit(1)
    email = u?.email ?? undefined
  }

  // Throttle before reserving. Creating a session costs the caller nothing but
  // takes real stock off the shelf for SESSION_TTL_SECONDS, so without a limit an
  // anonymous loop can keep the whole catalogue showing as sold out. Generous
  // enough that a buyer retrying a declined card never notices.
  if (!(await rateLimit('checkout-session-ip', await clientIp(), 8, 600))) {
    return { error: 'rate' }
  }

  // Hold the stock now (atomic, guarded); the webhook confirms without decrementing
  // again, and an expired/abandoned session releases it.
  if (!(await reserveStock(reserveLines))) return { error: 'stock' }

  try {
    // The address is collected on our page and carried to the order via metadata;
    // Stripe collects no address (we don't use Stripe Tax). Logged-in buyers get
    // their email pre-filled; guests type it on Stripe.
    const shipJson = JSON.stringify({ name, line1, line2, postalCode, city, country: dest, phone })

    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: email,
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: Math.round(shipping * 100), currency: 'eur' },
            display_name: SHIP_LABEL[locale] ?? 'Shipping',
          },
        },
      ],
      expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
      success_url: `${BASE}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE}/${locale}/checkout?checkout=cancel`,
      metadata: { userId: sess?.userId ?? '', locale, ship: shipJson },
    })
    return { url: checkout.url ?? undefined }
  } catch {
    await releaseStock(reserveLines) // Stripe failed — give the held stock back
    return { error: 'failed' }
  }
}
