'use server'

import type Stripe from 'stripe'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { variants, products, users } from '@/db/schema'
import { liveSession } from '@/lib/session'
import { stripe } from '@/lib/stripe'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const LOCALES = ['fr', 'en', 'es']
const loc = (v: unknown) => (LOCALES.includes(String(v)) ? String(v) : 'en')

// Countries Stripe may collect a shipping address for. P1: a broad list so
// checkout works everywhere; P6 restricts this to countries that have a rate.
const SHIP_COUNTRIES: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection['allowed_countries'] =
  ['FR', 'BE', 'ES', 'DE', 'IT', 'NL', 'LU', 'PT', 'AT', 'IE', 'FI', 'GR', 'SE', 'DK', 'PL', 'CZ',
   'GB', 'CH', 'NO', 'US', 'CA', 'AU', 'NZ']

export type CheckoutItem = { sku: string; qty: number }
export type CheckoutResult = { url?: string; error?: 'empty' | 'unavailable' | 'stock' | 'failed' }

// Turn the (client) cart into a Stripe Checkout session. Prices, availability and
// stock are re-read from the DB — the client only supplies variant SKU + qty, so
// a tampered price or an out-of-stock line can never go through.
export async function createCheckoutSession(
  items: CheckoutItem[],
  localeRaw: string
): Promise<CheckoutResult> {
  const locale = loc(localeRaw)
  if (!Array.isArray(items) || items.length === 0) return { error: 'empty' }

  const skus = [...new Set(items.map((i) => String(i.sku)))]
  const rows = await db
    .select({
      sku: variants.sku,
      priceEur: variants.priceEur,
      salePriceEur: variants.salePriceEur,
      stock: variants.stock,
      active: variants.active,
      productName: products.name,
      productActive: products.active,
    })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(inArray(variants.sku, skus))
  const bySku = new Map(rows.map((r) => [r.sku, r]))

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
  for (const it of items) {
    const qty = Math.max(1, Math.floor(Number(it.qty) || 0))
    const v = bySku.get(String(it.sku))
    if (!v || !v.active || !v.productActive) return { error: 'unavailable' }
    if (v.stock < qty) return { error: 'stock' }
    const unitAmount = Math.round(Number(v.salePriceEur ?? v.priceEur) * 100) // cents
    lineItems.push({
      quantity: qty,
      price_data: {
        currency: 'eur',
        unit_amount: unitAmount,
        tax_behavior: 'exclusive', // price is pre-tax; Stripe Tax adds VAT on top
        product_data: { name: v.productName, metadata: { sku: v.sku } },
      },
    })
  }

  // Logged-in buyers get their email pre-filled; guests type it on Stripe.
  const sess = await liveSession()
  let email: string | undefined
  if (sess) {
    const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, sess.userId)).limit(1)
    email = u?.email ?? undefined
  }

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      automatic_tax: { enabled: true },
      shipping_address_collection: { allowed_countries: SHIP_COUNTRIES },
      customer_email: email,
      success_url: `${BASE}/${locale}?checkout=success`,
      cancel_url: `${BASE}/${locale}?checkout=cancel`,
      metadata: { userId: sess?.userId ?? '', locale },
    })
    return { url: checkout.url ?? undefined }
  } catch {
    return { error: 'failed' }
  }
}
