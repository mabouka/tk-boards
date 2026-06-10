import { describe, it, expect } from 'vitest'
import { buildVariants, type Override } from './variant-build'

const SIZE = {
  code: 'SIZE',
  values: [{ code: 'S' }, { code: 'M' }],
}

describe('buildVariants — simple product (no axes)', () => {
  it('emits a single variant whose SKU is the parent SKU', () => {
    const out = buildVariants({ sku: 'BX', options: [], overrides: {}, basePrice: '1699', discount: '' })
    expect(out).toEqual([
      { sku: 'BX', combo: {}, priceEur: '1699', salePriceEur: null, active: true },
    ])
  })

  it('carries the base discount through as the sale price', () => {
    const out = buildVariants({ sku: 'BX', options: [], overrides: {}, basePrice: '1699', discount: '1399' })
    expect(out[0].salePriceEur).toBe('1399')
  })
})

describe('buildVariants — configurable product', () => {
  it('builds child SKUs PARENT-CODE and applies the base price/sale', () => {
    const out = buildVariants({
      sku: 'BX',
      options: [SIZE],
      overrides: {},
      basePrice: '1699',
      discount: '1399',
    })
    expect(out.map((v) => v.sku)).toEqual(['BX-S', 'BX-M'])
    expect(out.every((v) => v.priceEur === '1699' && v.salePriceEur === '1399' && v.active)).toBe(true)
    expect(out[0].combo).toEqual({ SIZE: 'S' })
  })

  it('joins every axis code into the SKU', () => {
    const out = buildVariants({
      sku: 'BX',
      options: [SIZE, { code: 'COLOR', values: [{ code: 'RED' }, { code: 'BLU' }] }],
      overrides: {},
      basePrice: '10',
      discount: '',
    })
    expect(out.map((v) => v.sku)).toEqual(['BX-S-RED', 'BX-S-BLU', 'BX-M-RED', 'BX-M-BLU'])
    expect(out.every((v) => v.salePriceEur === null)).toBe(true)
  })

  it('lets a per-combo override win over the base values', () => {
    const overrides: Record<string, Override> = {
      'SIZE:M': { price: '1599', sale: '1299', active: false },
    }
    const out = buildVariants({ sku: 'BX', options: [SIZE], overrides, basePrice: '1699', discount: '' })
    const m = out.find((v) => v.sku === 'BX-M')!
    expect(m).toMatchObject({ priceEur: '1599', salePriceEur: '1299', active: false })
    // The non-overridden combo keeps the base values.
    expect(out.find((v) => v.sku === 'BX-S')).toMatchObject({ priceEur: '1699', active: true })
  })

  it('falls back to the base when an override field is empty', () => {
    const overrides: Record<string, Override> = {
      'SIZE:S': { price: '', sale: '', active: true },
    }
    const out = buildVariants({ sku: 'BX', options: [SIZE], overrides, basePrice: '1699', discount: '1399' })
    expect(out.find((v) => v.sku === 'BX-S')).toMatchObject({ priceEur: '1699', salePriceEur: '1399' })
  })
})
