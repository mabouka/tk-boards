import { describe, it, expect } from 'vitest'
import { stockStatus, clampStock, matchesStockFilter, matchesStockSearch } from './stock-ui'

describe('stockStatus', () => {
  it('classifies against the low threshold', () => {
    expect(stockStatus(0, 5)).toBe('out')
    expect(stockStatus(3, 5)).toBe('low')
    expect(stockStatus(5, 5)).toBe('low') // boundary is still "low"
    expect(stockStatus(6, 5)).toBe('ok')
  })
})

describe('clampStock', () => {
  it('coerces to a non-negative integer', () => {
    expect(clampStock(7)).toBe(7)
    expect(clampStock(2.9)).toBe(2)
    expect(clampStock(-4)).toBe(0)
    expect(clampStock(0.5)).toBe(0)
    expect(clampStock(Number.NaN)).toBe(0)
  })
})

describe('matchesStockFilter', () => {
  it('"all" matches everything', () => {
    expect(matchesStockFilter(0, 'all', 5)).toBe(true)
    expect(matchesStockFilter(99, 'all', 5)).toBe(true)
  })

  it('"low" is strictly between 0 and the threshold (inclusive)', () => {
    expect(matchesStockFilter(0, 'low', 5)).toBe(false)
    expect(matchesStockFilter(5, 'low', 5)).toBe(true)
    expect(matchesStockFilter(6, 'low', 5)).toBe(false)
  })

  it('"out" matches only zero', () => {
    expect(matchesStockFilter(0, 'out', 5)).toBe(true)
    expect(matchesStockFilter(1, 'out', 5)).toBe(false)
  })
})

describe('matchesStockSearch', () => {
  const row = { productName: 'Rocket Pro', sku: 'BX-138' }

  it('matches an empty query', () => {
    expect(matchesStockSearch(row, '   ')).toBe(true)
  })

  it('matches name or SKU, case-insensitively', () => {
    expect(matchesStockSearch(row, 'rocket')).toBe(true)
    expect(matchesStockSearch(row, 'bx-13')).toBe(true)
    expect(matchesStockSearch(row, 'kite')).toBe(false)
  })
})
