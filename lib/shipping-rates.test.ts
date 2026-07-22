import { describe, expect, it } from 'vitest'
import { chargeFromRates, quotesFromRates, type RateRow } from './shipping-rates'

const rate = (country: string, productId: string, amountEur: string): RateRow => ({
  country,
  productId,
  amountEur,
})

describe('quotesFromRates', () => {
  it('bills the highest rate in the cart, not the sum (one parcel)', () => {
    const rows = [rate('ES', 'board', '60.00'), rate('ES', 'bag', '25.00')]
    expect(quotesFromRates(rows, 2)).toEqual([{ country: 'ES', shippingEur: 60 }])
  })

  it('drops countries where some product has no rate', () => {
    const rows = [
      rate('ES', 'board', '60.00'),
      rate('ES', 'bag', '25.00'),
      rate('BE', 'board', '120.00'), // bag can't ship to BE
    ]
    expect(quotesFromRates(rows, 2)).toEqual([{ country: 'ES', shippingEur: 60 }])
  })

  it('keeps every country that covers the whole cart', () => {
    const rows = [
      rate('ES', 'board', '60.00'),
      rate('ES', 'bag', '25.00'),
      rate('BE', 'board', '120.00'),
      rate('BE', 'bag', '25.00'),
    ]
    const quotes = quotesFromRates(rows, 2).sort((a, b) => a.country.localeCompare(b.country))
    expect(quotes).toEqual([
      { country: 'BE', shippingEur: 120 },
      { country: 'ES', shippingEur: 60 },
    ])
  })

  it('handles a single-product cart', () => {
    expect(quotesFromRates([rate('FR', 'bag', '25.00')], 1)).toEqual([
      { country: 'FR', shippingEur: 25 },
    ])
  })

  it('supports a free destination (0 €)', () => {
    expect(quotesFromRates([rate('ES', 'bag', '0.00')], 1)).toEqual([
      { country: 'ES', shippingEur: 0 },
    ])
  })

  it('returns nothing when there are no rates or no products', () => {
    expect(quotesFromRates([], 2)).toEqual([])
    expect(quotesFromRates([rate('ES', 'bag', '25.00')], 0)).toEqual([])
  })
})

describe('chargeFromRates', () => {
  it('charges the dearest product for that destination', () => {
    const rows = [
      { productId: 'board', amountEur: '60.00' },
      { productId: 'bag', amountEur: '25.00' },
    ]
    expect(chargeFromRates(rows, 2)).toBe(60)
  })

  it('refuses the destination when a product has no rate there', () => {
    expect(chargeFromRates([{ productId: 'board', amountEur: '60.00' }], 2)).toBeNull()
    expect(chargeFromRates([], 1)).toBeNull()
  })

  it('returns 0 for a genuinely free destination, not null', () => {
    expect(chargeFromRates([{ productId: 'bag', amountEur: '0.00' }], 1)).toBe(0)
  })

  it('returns null when the cart has no products', () => {
    expect(chargeFromRates([], 0)).toBeNull()
  })
})
