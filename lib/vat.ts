// VAT is included in every price (TTC). We compute the VAT *portion* of a
// tax-inclusive amount ourselves — Stripe never calculates tax.

// Allowed product VAT rates (Spanish IVA): general / reduced / super-reduced.
export const VAT_RATES = [21, 10, 4] as const
export const DEFAULT_VAT_RATE = 21
// Shipping is always taxed at the standard rate.
export const SHIPPING_VAT_RATE = 21

export function isVatRate(n: number): boolean {
  return (VAT_RATES as readonly number[]).includes(n)
}

/** VAT contained in a TTC amount (in cents) at a given rate, rounded to cents. */
export function vatFromTtcCents(ttcCents: number, ratePct: number): number {
  return Math.round((ttcCents * ratePct) / (100 + ratePct))
}

/** VAT contained in a TTC euro amount at a given rate, as a number of euros. */
export function vatFromTtc(ttcEur: number, ratePct: number): number {
  return vatFromTtcCents(Math.round(ttcEur * 100), ratePct) / 100
}
