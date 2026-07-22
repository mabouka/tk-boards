import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { shippingRates } from '@/db/schema'

/** Countries a whole cart can ship to (every product has a rate there), each with
 *  the one-parcel charge = the highest per-product rate for that country. */
export async function cartShippingQuotes(
  productIds: string[]
): Promise<{ country: string; shippingEur: number }[]> {
  const ids = [...new Set(productIds)]
  if (ids.length === 0) return []
  const rows = await db
    .select({
      country: shippingRates.country,
      productId: shippingRates.productId,
      amountEur: shippingRates.amountEur,
    })
    .from(shippingRates)
    .where(inArray(shippingRates.productId, ids))

  const byCountry = new Map<string, { products: Set<string>; max: number }>()
  for (const r of rows) {
    const e = byCountry.get(r.country) ?? { products: new Set<string>(), max: 0 }
    e.products.add(r.productId)
    e.max = Math.max(e.max, Number(r.amountEur))
    byCountry.set(r.country, e)
  }
  // Only countries where every product in the cart is shippable.
  return [...byCountry.entries()]
    .filter(([, e]) => e.products.size === ids.length)
    .map(([country, e]) => ({ country, shippingEur: e.max }))
}

/** One-parcel shipping charge to a country, or null if any product in the cart
 *  has no rate there (so the cart can't ship to that destination). */
export async function shippingForCountry(
  productIds: string[],
  country: string
): Promise<number | null> {
  const ids = [...new Set(productIds)]
  if (ids.length === 0) return null
  const rows = await db
    .select({ productId: shippingRates.productId, amountEur: shippingRates.amountEur })
    .from(shippingRates)
    .where(and(inArray(shippingRates.productId, ids), eq(shippingRates.country, country.toUpperCase())))

  const covered = new Set(rows.map((r) => r.productId))
  if (covered.size !== ids.length) return null
  return rows.reduce((max, r) => Math.max(max, Number(r.amountEur)), 0)
}
