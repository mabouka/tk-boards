import { describe, expect, it } from 'vitest'
import {
  DEFAULT_VAT_RATE,
  SHIPPING_VAT_RATE,
  VAT_RATES,
  isVatRate,
  vatBreakdown,
  vatFromTtc,
  vatFromTtcCents,
} from './vat'

// Prices are TTC: VAT is the portion *contained* in the amount, never added on top.
describe('vatFromTtcCents', () => {
  it('extracts the VAT contained in a TTC amount', () => {
    expect(vatFromTtcCents(12100, 21)).toBe(2100) // 121,00 € TTC @21% → 21,00 €
    expect(vatFromTtcCents(11000, 10)).toBe(1000) // 110,00 € TTC @10% → 10,00 €
    expect(vatFromTtcCents(10400, 4)).toBe(400) //  104,00 € TTC @4%  →  4,00 €
  })

  it('leaves the net amount intact (ttc − vat = ht)', () => {
    for (const [ttc, rate] of [
      [12100, 21],
      [11000, 10],
      [10400, 4],
    ] as const) {
      const vat = vatFromTtcCents(ttc, rate)
      const ht = ttc - vat
      // Re-applying the rate to the net amount gives back the TTC amount.
      expect(Math.round(ht * (1 + rate / 100))).toBe(ttc)
    }
  })

  it('always returns whole cents', () => {
    for (const ttc of [1, 7, 99, 4999, 49000, 167900]) {
      const vat = vatFromTtcCents(ttc, 21)
      expect(Number.isInteger(vat)).toBe(true)
    }
  })

  it('never exceeds the amount it is extracted from', () => {
    for (const ttc of [0, 1, 100, 49000, 167900]) {
      for (const rate of VAT_RATES) {
        const vat = vatFromTtcCents(ttc, rate)
        expect(vat).toBeGreaterThanOrEqual(0)
        expect(vat).toBeLessThan(ttc + 1)
      }
    }
  })

  it('is zero for a zero amount (free shipping)', () => {
    expect(vatFromTtcCents(0, 21)).toBe(0)
  })

  it('rounds to the nearest cent rather than truncating', () => {
    // 100 cents @21% → 100*21/121 = 17.355… → 17
    expect(vatFromTtcCents(100, 21)).toBe(17)
    // 1000 cents @21% → 1000*21/121 = 173.55… → 174 (rounds up)
    expect(vatFromTtcCents(1000, 21)).toBe(174)
  })
})

describe('vatFromTtc', () => {
  it('works in euros and returns euros', () => {
    expect(vatFromTtc(121, 21)).toBeCloseTo(21, 2)
    expect(vatFromTtc(110, 10)).toBeCloseTo(10, 2)
  })

  it('matches the cent-based helper', () => {
    for (const eur of [25, 490, 1679]) {
      expect(vatFromTtc(eur, 21)).toBeCloseTo(vatFromTtcCents(eur * 100, 21) / 100, 10)
    }
  })

  it('is computed per line, so summing lines can drift a cent from taxing the total', () => {
    // Rounding happens per line — that's what the checkout and webhook both do.
    // Compared in whole cents to keep float noise out of the assertion.
    const perLine = vatFromTtcCents(10, 21) + vatFromTtcCents(10, 21)
    const onTotal = vatFromTtcCents(20, 21)
    expect(perLine).not.toBe(onTotal) // the drift is real…
    expect(Math.abs(perLine - onTotal)).toBeLessThanOrEqual(1) // …but bounded by a cent per line
  })
})

// What an invoice must print: taxable base and VAT amount per rate.
describe('vatBreakdown', () => {
  // Amounts chosen to divide exactly, so the expected figures are unambiguous.
  const mixed = () =>
    vatBreakdown(
      [
        { unitPriceEur: 121, qty: 1, vatRate: 21 },
        { unitPriceEur: 110, qty: 1, vatRate: 10 },
      ],
      24.2 // shipping, taxed at the standard rate
    )

  it('splits one row per rate, highest first', () => {
    expect(mixed().buckets.map((b) => b.rate)).toEqual([21, 10])
  })

  it('folds shipping into the standard-rate row', () => {
    const [standard] = mixed().buckets
    expect(standard).toEqual({ rate: 21, baseEur: 120, vatEur: 25.2, totalEur: 145.2 })
  })

  it('keeps a reduced-rate row on its own base', () => {
    const reduced = mixed().buckets.find((b) => b.rate === 10)
    expect(reduced).toEqual({ rate: 10, baseEur: 100, vatEur: 10, totalEur: 110 })
  })

  it('totals the rows', () => {
    const bd = mixed()
    expect(bd.baseEur).toBe(220)
    expect(bd.vatEur).toBe(35.2)
    expect(bd.totalEur).toBe(255.2)
  })

  it('reconciles: base + vat = total, on every row and overall', () => {
    const bd = mixed()
    for (const b of bd.buckets) {
      expect(b.baseEur + b.vatEur).toBeCloseTo(b.totalEur, 2)
      // …and re-applying the rate to the base gives the row total back.
      expect(b.baseEur * (1 + b.rate / 100)).toBeCloseTo(b.totalEur, 2)
    }
    expect(bd.baseEur + bd.vatEur).toBeCloseTo(bd.totalEur, 2)
  })

  it('multiplies by quantity', () => {
    const bd = vatBreakdown([{ unitPriceEur: 121, qty: 2, vatRate: 21 }])
    expect(bd.buckets).toEqual([{ rate: 21, baseEur: 200, vatEur: 42, totalEur: 242 }])
  })

  it('adds no shipping row when shipping is free', () => {
    const bd = vatBreakdown([{ unitPriceEur: 110, qty: 1, vatRate: 10 }], 0)
    expect(bd.buckets).toEqual([{ rate: 10, baseEur: 100, vatEur: 10, totalEur: 110 }])
  })

  it('accepts the string amounts that come back from the database', () => {
    const bd = vatBreakdown([{ unitPriceEur: '121.00', qty: 1, vatRate: 21 }], '24.20')
    expect(bd.totalEur).toBe(145.2)
  })

  it('is empty for an empty order', () => {
    expect(vatBreakdown([])).toEqual({ buckets: [], baseEur: 0, vatEur: 0, totalEur: 0 })
  })
})

describe('rates', () => {
  it('accepts only the three Spanish IVA rates', () => {
    expect(isVatRate(21)).toBe(true)
    expect(isVatRate(10)).toBe(true)
    expect(isVatRate(4)).toBe(true)
    expect(isVatRate(0)).toBe(false)
    expect(isVatRate(20)).toBe(false)
    expect(isVatRate(5.5)).toBe(false)
  })

  it('defaults to the standard rate, including for shipping', () => {
    expect(DEFAULT_VAT_RATE).toBe(21)
    expect(SHIPPING_VAT_RATE).toBe(21)
    expect(VAT_RATES).toContain(DEFAULT_VAT_RATE)
  })
})
