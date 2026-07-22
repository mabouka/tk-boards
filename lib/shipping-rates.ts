// Pure shipping-rate folding, kept free of the db import so it stays unit-testable.

export type RateRow = { country: string; productId: string; amountEur: string }

/**
 * Fold rate rows into the destinations a cart can actually ship to.
 *
 * A country only qualifies if *every* product in the cart has a rate there
 * (full-matrix model: there is no fallback rate). The charge is the highest of
 * those rates — everything travels in one parcel, so we bill the dearest item's
 * shipping rather than the sum.
 */
export function quotesFromRates(
  rows: RateRow[],
  productCount: number
): { country: string; shippingEur: number }[] {
  if (productCount <= 0) return []
  const byCountry = new Map<string, { products: Set<string>; max: number }>()
  for (const r of rows) {
    const e = byCountry.get(r.country) ?? { products: new Set<string>(), max: 0 }
    e.products.add(r.productId)
    e.max = Math.max(e.max, Number(r.amountEur))
    byCountry.set(r.country, e)
  }
  return [...byCountry.entries()]
    .filter(([, e]) => e.products.size === productCount)
    .map(([country, e]) => ({ country, shippingEur: e.max }))
}

/** One-parcel charge for a single destination, or null if any product lacks a rate. */
export function chargeFromRates(
  rows: { productId: string; amountEur: string }[],
  productCount: number
): number | null {
  if (productCount <= 0) return null
  const covered = new Set(rows.map((r) => r.productId))
  if (covered.size !== productCount) return null
  return rows.reduce((max, r) => Math.max(max, Number(r.amountEur)), 0)
}
