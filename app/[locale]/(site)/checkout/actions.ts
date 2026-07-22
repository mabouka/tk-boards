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

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const LOCALES = ['fr', 'en', 'es']
const loc = (v: unknown) => (LOCALES.includes(String(v)) ? String(v) : 'en')
const SHIP_LABEL: Record<string, string> = { fr: 'Livraison', en: 'Shipping', es: 'Envío' }
const clean = (v: unknown) => String(v ?? '').trim()

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
  error?: 'empty' | 'unavailable' | 'stock' | 'failed' | 'shipping_country' | 'address'
}

type CartLineResolved = {
  sku: string
  name: string
  unitPriceEur: number
  qty: number
  variantId: string
  productId: string
}

// Re-read every cart line from the DB — the client only supplies variant SKU +
// qty, so price, availability and the owning product are always authoritative.
async function readCartLines(
  items: CheckoutItem[]
): Promise<{ error: 'empty' | 'unavailable' } | { lines: CartLineResolved[] }> {
  if (!Array.isArray(items) || items.length === 0) return { error: 'empty' }
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
    })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(inArray(variants.sku, skus))
  const bySku = new Map(rows.map((r) => [r.sku, r]))

  const lines: CartLineResolved[] = []
  for (const it of items) {
    const qty = Math.max(1, Math.floor(Number(it.qty) || 0))
    const v = bySku.get(String(it.sku))
    if (!v || !v.active || !v.productActive) return { error: 'unavailable' }
    lines.push({
      sku: v.sku,
      name: v.productName,
      unitPriceEur: Number(v.salePriceEur ?? v.priceEur),
      qty,
      variantId: v.id,
      productId: v.productId,
    })
  }
  return { lines }
}

export type CheckoutQuoteLine = { sku: string; name: string; unitPriceEur: number; qty: number }
export type CheckoutQuote =
  | { ok: false; error: 'empty' | 'unavailable' }
  | {
      ok: true
      subtotalEur: number
      lines: CheckoutQuoteLine[]
      quotes: { country: string; shippingEur: number }[]
    }

// Everything the checkout page needs to render: authoritative line prices, the
// subtotal, and the destinations the whole cart can ship to (with their charge).
export async function getCheckoutQuote(items: CheckoutItem[]): Promise<CheckoutQuote> {
  const read = await readCartLines(items)
  if ('error' in read) return { ok: false, error: read.error }
  const { lines } = read
  const subtotalEur = lines.reduce((s, l) => s + l.unitPriceEur * l.qty, 0)
  const quotes = await cartShippingQuotes(lines.map((l) => l.productId))
  return {
    ok: true,
    subtotalEur,
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
  if (!a) return null
  const name = [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.name || ''
  return {
    name,
    line1: a.line1 ?? '',
    line2: a.line2 ?? '',
    postalCode: a.postalCode ?? '',
    city: a.city ?? '',
    phone: a.phone ?? '',
  }
}

// Create a Stripe Checkout session for a cart shipped to `address`. The address
// is collected on our page: we attach it to a Stripe Customer so Stripe Tax bills
// VAT on the destination (correct for physical goods) and Stripe never re-collects
// it. Shipping is recomputed server-side and passed as a fixed shipping option;
// the address travels to the order via session metadata (read by the webhook).
export async function createCheckoutSession(
  items: CheckoutItem[],
  localeRaw: string,
  address: ShipAddress
): Promise<CheckoutResult> {
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

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = lines.map((l) => ({
    quantity: l.qty,
    price_data: {
      currency: 'eur',
      unit_amount: Math.round(l.unitPriceEur * 100),
      tax_behavior: 'exclusive', // price is pre-tax; Stripe Tax adds VAT on top
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

  // Hold the stock now (atomic, guarded); the webhook confirms without decrementing
  // again, and an expired/abandoned session releases it.
  if (!(await reserveStock(reserveLines))) return { error: 'stock' }

  try {
    const stripeAddress = {
      line1,
      line2: line2 || undefined,
      postal_code: postalCode,
      city,
      country: dest,
    }
    // The customer carries the address so Stripe Tax uses it and Checkout doesn't
    // ask for one again (customer_update: never).
    const customer = await stripe.customers.create({
      ...(email ? { email } : {}),
      name,
      phone: phone || undefined,
      address: stripeAddress,
      shipping: { name, phone: phone || undefined, address: stripeAddress },
    })

    const shipJson = JSON.stringify({ name, line1, line2, postalCode, city, country: dest, phone })

    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      automatic_tax: { enabled: true },
      customer: customer.id,
      customer_update: { address: 'never', shipping: 'never' },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: Math.round(shipping * 100), currency: 'eur' },
            display_name: SHIP_LABEL[locale] ?? 'Shipping',
            tax_behavior: 'exclusive',
          },
        },
      ],
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
