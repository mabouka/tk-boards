import { describe, expect, it } from 'vitest'
import { fullName, fmtDate } from './format'

describe('fullName', () => {
  it('joins first and last name', () => {
    expect(fullName('Jean', 'Dupont', null)).toBe('Jean Dupont')
  })

  it('uses whichever of first/last is present', () => {
    expect(fullName('Jean', null, null)).toBe('Jean')
    expect(fullName(null, 'Dupont', null)).toBe('Dupont')
  })

  it('prefers first/last over the legacy name field', () => {
    expect(fullName('Jean', 'Dupont', 'Ancien Nom')).toBe('Jean Dupont')
  })

  it('falls back to the legacy name when there is no first/last', () => {
    expect(fullName(null, null, 'Ancien Nom')).toBe('Ancien Nom')
    expect(fullName('', '', 'Ancien Nom')).toBe('Ancien Nom') // empty strings are dropped
  })

  it('returns an em-dash when nothing is available', () => {
    expect(fullName(null, null, null)).toBe('—')
    expect(fullName('', '', '')).toBe('—')
  })

  it('does not leave a trailing space when only one part exists', () => {
    expect(fullName('Jean', '', null)).toBe('Jean')
    expect(fullName('', 'Dupont', null)).toBe('Dupont')
  })
})

describe('fmtDate', () => {
  it('returns an em-dash for null/undefined', () => {
    expect(fmtDate(null)).toBe('—')
    expect(fmtDate(undefined)).toBe('—')
  })

  it('formats a real date to a non-empty label', () => {
    const out = fmtDate(new Date('2026-03-15T12:00:00Z'))
    expect(out).not.toBe('—')
    expect(out).toContain('2026')
  })
})
