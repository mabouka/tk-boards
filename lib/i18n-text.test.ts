import { describe, it, expect } from 'vitest'
import { i18n, part, primary } from './i18n-text'

describe('i18n', () => {
  it('always sets en as the primary locale', () => {
    expect(i18n('Size')).toEqual({ en: 'Size' })
  })

  it('adds fr/es only when provided', () => {
    expect(i18n('Size', 'Taille')).toEqual({ en: 'Size', fr: 'Taille' })
    expect(i18n('Size', undefined, 'Talla')).toEqual({ en: 'Size', es: 'Talla' })
    expect(i18n('Size', 'Taille', 'Talla')).toEqual({ en: 'Size', fr: 'Taille', es: 'Talla' })
  })

  it('ignores empty translations', () => {
    expect(i18n('Size', '', '')).toEqual({ en: 'Size' })
  })
})

describe('part', () => {
  it('reads a locale value', () => {
    expect(part({ en: 'Size', fr: 'Taille' }, 'fr')).toBe('Taille')
  })

  it('is safe on null/undefined/missing keys', () => {
    expect(part(null, 'en')).toBe('')
    expect(part(undefined, 'en')).toBe('')
    expect(part({}, 'en')).toBe('')
    expect(part({ en: 'x' }, 'fr')).toBe('')
  })
})

describe('primary', () => {
  it('returns the en value when present', () => {
    expect(primary({ en: 'Color', fr: 'Couleur' }, 'CODE')).toBe('Color')
  })

  it('falls back when en is absent or empty', () => {
    expect(primary({ fr: 'Couleur' }, 'CODE')).toBe('CODE')
    expect(primary({ en: '' }, 'CODE')).toBe('CODE')
    expect(primary(null, 'CODE')).toBe('CODE')
  })
})
