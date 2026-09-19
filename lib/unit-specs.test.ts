import { describe, expect, it } from 'vitest'
import { buildSpecs, describeSpecs, type UnitSpecAxis } from './unit-specs'

const color: UnitSpecAxis = { code: 'COLOR', name: 'Couleur', value: 'MAGENTA', label: 'Magenta' }
const size: UnitSpecAxis = { code: 'SIZE', name: 'Taille', value: '138', label: '138 cm' }

describe('buildSpecs', () => {
  it('keeps the model SKU and the complete axes', () => {
    expect(buildSpecs('TK-RKT', [color, size])).toEqual({
      modelSku: 'TK-RKT',
      axes: [color, size], // already COLOR < SIZE
    })
  })

  it('orders axes by code so the stored JSON is deterministic', () => {
    expect(buildSpecs('TK-RKT', [size, color]).axes).toEqual([color, size])
  })

  it('drops axes missing a code or a value', () => {
    const incomplete: UnitSpecAxis = { code: 'SIZE', name: 'Taille', value: '', label: '' }
    const noCode: UnitSpecAxis = { code: '', name: '', value: 'X', label: 'X' }
    expect(buildSpecs('TK-RKT', [color, incomplete, noCode]).axes).toEqual([color])
  })

  it('handles a product with no axes', () => {
    expect(buildSpecs('TK-BAG', [])).toEqual({ modelSku: 'TK-BAG', axes: [] })
  })
})

describe('describeSpecs', () => {
  it('formats axes as "name : label" joined', () => {
    expect(describeSpecs(buildSpecs('TK-RKT', [color, size]))).toBe('Couleur : Magenta · Taille : 138 cm')
  })

  it('uses a custom separator', () => {
    expect(describeSpecs(buildSpecs('TK-RKT', [color, size]), ', ')).toBe('Couleur : Magenta, Taille : 138 cm')
  })

  it('falls back to the value code when the label is missing', () => {
    const noLabel: UnitSpecAxis = { code: 'SIZE', name: 'Taille', value: '138', label: '' }
    expect(describeSpecs(buildSpecs('TK-RKT', [noLabel]))).toBe('Taille : 138')
  })

  it('returns an empty string for null/empty specs', () => {
    expect(describeSpecs(null)).toBe('')
    expect(describeSpecs(buildSpecs('TK-RKT', []))).toBe('')
  })
})
