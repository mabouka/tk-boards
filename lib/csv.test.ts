import { describe, expect, it } from 'vitest'
import { csvField, buildCsv } from './csv'

describe('csvField', () => {
  it('wraps plain values in quotes', () => {
    expect(csvField('hello')).toBe('"hello"')
    expect(csvField('with, comma')).toBe('"with, comma"')
  })

  it('doubles embedded quotes', () => {
    expect(csvField('a"b')).toBe('"a""b"')
    expect(csvField('"quoted"')).toBe('"""quoted"""')
  })

  it('coerces null/undefined to an empty cell', () => {
    expect(csvField(null)).toBe('""')
    expect(csvField(undefined)).toBe('""')
  })

  it('stringifies numbers', () => {
    expect(csvField(0)).toBe('"0"')
    expect(csvField(1502.5)).toBe('"1502.5"')
  })

  // Formula-injection defence: a cell starting with = + - @ (or tab / CR) would be
  // executed as a formula by Excel/Sheets, so it must be prefixed with an apostrophe.
  it('neutralises leading formula characters', () => {
    expect(csvField('=SUM(A1)')).toBe(`"'=SUM(A1)"`)
    expect(csvField('+1')).toBe(`"'+1"`)
    expect(csvField('-1')).toBe(`"'-1"`)
    expect(csvField('@cmd')).toBe(`"'@cmd"`)
    expect(csvField('\tx')).toBe(`"'\tx"`)
    expect(csvField('\rx')).toBe(`"'\rx"`)
  })

  it('only guards the FIRST character', () => {
    expect(csvField('a=b')).toBe('"a=b"')
    expect(csvField('total: 5')).toBe('"total: 5"')
  })
})

describe('buildCsv', () => {
  it('joins an escaped header and rows with newlines', () => {
    const csv = buildCsv(
      ['name', 'total'],
      [
        ['Alice', '10'],
        ['Bob', '20'],
      ]
    )
    expect(csv).toBe('"name","total"\n"Alice","10"\n"Bob","20"')
  })

  it('escapes every cell, including injected and mixed-type ones', () => {
    const csv = buildCsv(['label', 'qty'], [['=1+1', 3], [null, undefined]])
    expect(csv).toBe(`"label","qty"\n"'=1+1","3"\n"",""`)
  })

  it('returns just the header for an empty body', () => {
    expect(buildCsv(['a', 'b'], [])).toBe('"a","b"')
  })
})
