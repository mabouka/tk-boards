import { describe, it, expect } from 'vitest'
import {
  productInputSchema,
  editorVariantSchema,
  optionSchema,
  optionValueSchema,
} from './schemas'

const baseVariant = { sku: 'PRO-1', combo: {}, priceEur: '1699', active: true }

describe('editorVariantSchema', () => {
  it('normalizes decimal comma to a dot on prices', () => {
    const v = editorVariantSchema.parse({ ...baseVariant, priceEur: '19,99', salePriceEur: '9,50' })
    expect(v.priceEur).toBe('19.99')
    expect(v.salePriceEur).toBe('9.50')
  })

  it('coerces empty/missing sale price to null', () => {
    expect(editorVariantSchema.parse({ ...baseVariant, salePriceEur: '' }).salePriceEur).toBeNull()
    expect(editorVariantSchema.parse({ ...baseVariant }).salePriceEur).toBeNull()
  })

  it('rejects an empty or non-numeric price', () => {
    expect(editorVariantSchema.safeParse({ ...baseVariant, priceEur: '' }).success).toBe(false)
    expect(editorVariantSchema.safeParse({ ...baseVariant, priceEur: 'abc' }).success).toBe(false)
  })
})

describe('optionValueSchema', () => {
  it('coerces empty/missing hex to null', () => {
    expect(optionValueSchema.parse({ code: 'RED', label: 'Red', hex: '' }).hex).toBeNull()
    expect(optionValueSchema.parse({ code: 'RED', label: 'Red' }).hex).toBeNull()
    expect(optionValueSchema.parse({ code: 'RED', label: 'Red', hex: '#f00' }).hex).toBe('#f00')
  })

  it('requires a label', () => {
    expect(optionValueSchema.safeParse({ code: 'RED', label: '' }).success).toBe(false)
  })
})

describe('optionSchema', () => {
  it('treats blank translations as undefined', () => {
    const o = optionSchema.parse({
      code: 'SIZE',
      name: 'Size',
      nameFr: '   ',
      inputType: 'select',
      values: [{ code: 'M', label: 'M' }],
    })
    expect(o.nameFr).toBeUndefined()
    expect(o.nameEs).toBeUndefined()
  })

  it('requires at least one value', () => {
    const r = optionSchema.safeParse({ code: 'SIZE', name: 'Size', inputType: 'select', values: [] })
    expect(r.success).toBe(false)
  })
})

describe('productInputSchema', () => {
  const valid = {
    name: 'Pro Board',
    sku: 'pro-1',
    active: true,
    options: [],
    variants: [baseVariant],
  }

  it('uppercases the product SKU and defaults addons/links', () => {
    const p = productInputSchema.parse(valid)
    expect(p.sku).toBe('PRO-1')
    expect(p.addons).toEqual([])
    expect(p.links).toEqual([])
  })

  it('coerces a blank/absent kind to null but keeps a real one', () => {
    expect(productInputSchema.parse(valid).kind).toBeNull()
    expect(productInputSchema.parse({ ...valid, kind: 'board' }).kind).toBe('board')
  })

  it('requires a name and at least one variant', () => {
    expect(productInputSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
    const r = productInputSchema.safeParse({ ...valid, variants: [] })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toBe('Au moins une variante')
  })
})
