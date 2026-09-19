import { describe, expect, it } from 'vitest'
import { modelCodeFromSku, serialPrefix, formatSerial } from './serial'

describe('modelCodeFromSku', () => {
  it('drops the TK- brand prefix', () => {
    expect(modelCodeFromSku('TK-RKT')).toBe('RKT')
    expect(modelCodeFromSku('tk-rkt')).toBe('RKT') // case-insensitive prefix
  })

  it('keeps only alphanumerics from the rest', () => {
    expect(modelCodeFromSku('TK-BAG-01')).toBe('BAG01')
    expect(modelCodeFromSku('RKT')).toBe('RKT') // no prefix → whole SKU
  })

  it('falls back when nothing usable remains', () => {
    expect(modelCodeFromSku('TK-')).toBe('TK')
    expect(modelCodeFromSku('')).toBe('TK')
  })
})

describe('serialPrefix', () => {
  it('builds SN-<model>-<year>-', () => {
    expect(serialPrefix('TK-RKT', 2026)).toBe('SN-RKT-2026-')
  })
})

describe('formatSerial', () => {
  it('zero-pads the sequence to 4 digits', () => {
    expect(formatSerial('SN-RKT-2026-', 1)).toBe('SN-RKT-2026-0001')
    expect(formatSerial('SN-RKT-2026-', 42)).toBe('SN-RKT-2026-0042')
  })

  it('does not truncate a sequence beyond 9999', () => {
    expect(formatSerial('SN-RKT-2026-', 12345)).toBe('SN-RKT-2026-12345')
  })
})
