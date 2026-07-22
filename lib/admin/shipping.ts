import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { shippingRates } from '@/db/schema'

export type ShippingRateRow = { country: string; amountEur: string }

/** All per-country shipping rates for a product, sorted by country code. */
export async function getProductShippingRates(productId: string): Promise<ShippingRateRow[]> {
  if (!productId) return []
  const rows = await db
    .select({ country: shippingRates.country, amountEur: shippingRates.amountEur })
    .from(shippingRates)
    .where(eq(shippingRates.productId, productId))
  return rows.sort((a, b) => a.country.localeCompare(b.country))
}
