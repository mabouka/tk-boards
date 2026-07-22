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

const cents = (eur: number) => Math.round(eur * 100)

/**
 * Force the per-rate rows to add up to the amounts actually charged.
 *
 * The rows are rebuilt from the stored order lines while the headline figures come
 * from the order itself; any residual cent (a unit price that had to be rounded)
 * is absorbed by the highest-rate row, so an invoice can never print rates that
 * fail to sum to its own total.
 */
export function reconcileBuckets(
  buckets: VatBucket[],
  totalEur: number,
  vatEur: number
): VatBucket[] {
  if (buckets.length === 0) return buckets
  const dTotal = cents(totalEur) - buckets.reduce((s, b) => s + cents(b.totalEur), 0)
  const dVat = cents(vatEur) - buckets.reduce((s, b) => s + cents(b.vatEur), 0)
  if (dTotal === 0 && dVat === 0) return buckets
  // buckets are sorted highest rate first — absorb into that one.
  return buckets.map((b, i) =>
    i === 0
      ? {
          ...b,
          totalEur: (cents(b.totalEur) + dTotal) / 100,
          vatEur: (cents(b.vatEur) + dVat) / 100,
          baseEur: (cents(b.baseEur) + dTotal - dVat) / 100,
        }
      : b
  )
}

export type BreakdownLine = { unitPriceEur: string | number; qty: number; vatRate: number }
export type VatBucket = { rate: number; baseEur: number; vatEur: number; totalEur: number }
export type VatBreakdown = {
  buckets: VatBucket[] // one row per rate, highest first
  baseEur: number
  vatEur: number
  totalEur: number
}

/**
 * Group an order into the per-rate rows an invoice has to show: taxable base and
 * VAT amount for each rate, plus the totals. Shipping folds into the standard-rate
 * bucket.
 *
 * The VAT is extracted once per rate from that rate's TTC subtotal — not per line
 * and summed — so `base × rate` reconciles with the printed VAT amount. Everything
 * is kept in cents until the end to avoid float drift.
 */
export function vatBreakdown(
  lines: BreakdownLine[],
  shippingTtcEur: string | number = 0
): VatBreakdown {
  const ttcByRate = new Map<number, number>()
  const add = (rate: number, cents: number) => {
    if (cents === 0) return
    ttcByRate.set(rate, (ttcByRate.get(rate) ?? 0) + cents)
  }

  for (const l of lines) {
    const qty = Math.max(0, Math.floor(Number(l.qty) || 0))
    add(l.vatRate, Math.round(Number(l.unitPriceEur) * 100) * qty)
  }
  add(SHIPPING_VAT_RATE, Math.round(Number(shippingTtcEur) * 100))

  let totalTtc = 0
  let totalVat = 0
  const buckets: VatBucket[] = [...ttcByRate.entries()]
    .sort(([a], [b]) => b - a)
    .map(([rate, ttc]) => {
      const vat = vatFromTtcCents(ttc, rate)
      totalTtc += ttc
      totalVat += vat
      return { rate, baseEur: (ttc - vat) / 100, vatEur: vat / 100, totalEur: ttc / 100 }
    })

  return {
    buckets,
    baseEur: (totalTtc - totalVat) / 100,
    vatEur: totalVat / 100,
    totalEur: totalTtc / 100,
  }
}
