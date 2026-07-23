import { describe, expect, it } from 'vitest'
import { safeEqual } from './safe-compare'

describe('safeEqual', () => {
  it('accepts an exact match', () => {
    expect(safeEqual('Bearer s3cr3t', 'Bearer s3cr3t')).toBe(true)
  })

  it('rejects a wrong value', () => {
    expect(safeEqual('Bearer wrong', 'Bearer s3cr3t')).toBe(false)
  })

  // The whole point: a guess sharing a long prefix must be no more "right" than one
  // sharing none, and a length mismatch must not blow up (timingSafeEqual throws on
  // buffers of different sizes, which is why both sides are hashed first).
  it('rejects a near-miss and a length mismatch alike, without throwing', () => {
    expect(safeEqual('Bearer s3cr3', 'Bearer s3cr3t')).toBe(false)
    expect(safeEqual('B', 'Bearer s3cr3t')).toBe(false)
    expect(safeEqual('Bearer s3cr3t-and-then-some', 'Bearer s3cr3t')).toBe(false)
  })

  it('treats a missing header as a mismatch', () => {
    expect(safeEqual(null, 'Bearer s3cr3t')).toBe(false)
    expect(safeEqual(undefined, 'Bearer s3cr3t')).toBe(false)
    expect(safeEqual(null, null)).toBe(false)
  })

  it('is case- and whitespace-sensitive', () => {
    expect(safeEqual('bearer s3cr3t', 'Bearer s3cr3t')).toBe(false)
    expect(safeEqual('Bearer s3cr3t ', 'Bearer s3cr3t')).toBe(false)
  })

  it('compares empty strings as equal, so callers must still require a secret', () => {
    expect(safeEqual('', '')).toBe(true)
  })
})
