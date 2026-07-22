import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { shippingRates } from '@/db/schema'
import { chargeFromRates, quotesFromRates } from '@/lib/shipping-rates'

/** Countries a whole cart can ship to, each with its one-parcel charge. */
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
  return quotesFromRates(rows, ids.length)
}

/** One-parcel shipping charge to a country, or null if the cart can't ship there. */
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
  return chargeFromRates(rows, ids.length)
}
