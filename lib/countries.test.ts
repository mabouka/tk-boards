import { describe, expect, it } from 'vitest'
import {
  COUNTRY_CODES,
  countryLabel,
  countryName,
  countryOptions,
  isCountryCode,
} from './countries'

describe('COUNTRY_CODES', () => {
  it('is a non-empty list of unique ISO 3166-1 alpha-2 codes', () => {
    expect(COUNTRY_CODES.length).toBeGreaterThan(100)
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length)
    for (const code of COUNTRY_CODES) expect(code).toMatch(/^[A-Z]{2}$/)
  })

  // Stripe won't ship to these, so offering them would create rates that can never
  // be used and a checkout that fails at session creation.
  it('excludes sanctioned / Stripe-unsupported destinations', () => {
    for (const code of ['CU', 'IR', 'KP', 'SY', 'RU']) {
      expect(COUNTRY_CODES).not.toContain(code)
    }
  })

  it('includes the markets that actually have rates', () => {
    for (const code of ['ES', 'BE', 'FR', 'US']) {
      expect(COUNTRY_CODES).toContain(code)
    }
  })
})

describe('isCountryCode', () => {
  it('accepts known codes in any case', () => {
    expect(isCountryCode('FR')).toBe(true)
    expect(isCountryCode('fr')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isCountryCode('XX')).toBe(false)
    expect(isCountryCode('')).toBe(false)
    expect(isCountryCode('FRA')).toBe(false)
  })
})

describe('countryName', () => {
  it('localises the country name', () => {
    expect(countryName('ES', 'fr')).toBe('Espagne')
    expect(countryName('ES', 'en')).toBe('Spain')
    expect(countryName('ES', 'es')).toBe('España')
  })

  it('falls back to the code when Intl rejects it', () => {
    // A structurally invalid subtag makes Intl throw; the helper must not blow up.
    expect(countryName('ZZZ', 'fr')).toBe('ZZZ')
    expect(countryName('', 'fr')).toBe('')
  })

  it('never returns an empty label for a supported country', () => {
    for (const code of COUNTRY_CODES) {
      expect(countryName(code, 'fr')).toBeTruthy()
    }
  })
})

describe('countryLabel', () => {
  it('spells the country out in the reading language', () => {
    expect(countryLabel('BE', 'fr')).toBe('Belgique')
    expect(countryLabel('BE', 'en')).toBe('Belgium')
    expect(countryLabel('BE', 'es')).toBe('Bélgica')
  })

  // Address builders concatenate then .filter(Boolean); returning '' or 'null'
  // here would print a stray separator on an order with no country stored.
  it('returns null when there is no country, so the line drops out', () => {
    expect(countryLabel(null, 'fr')).toBeNull()
    expect(countryLabel(undefined, 'fr')).toBeNull()
    expect(countryLabel('', 'fr')).toBeNull()
  })
})

describe('countryOptions', () => {
  it('covers every code exactly once', () => {
    const opts = countryOptions('fr')
    expect(opts).toHaveLength(COUNTRY_CODES.length)
    expect(new Set(opts.map((o) => o.code)).size).toBe(COUNTRY_CODES.length)
  })

  it('is sorted by localised name, so the picker reads alphabetically', () => {
    const names = countryOptions('fr').map((o) => o.name)
    const sorted = [...names].sort((a, b) => a.localeCompare(b, 'fr'))
    expect(names).toEqual(sorted)
  })

  it('resolves names rather than echoing codes', () => {
    const fr = countryOptions('fr').find((o) => o.code === 'FR')
    expect(fr?.name).toBe('France')
  })
})
