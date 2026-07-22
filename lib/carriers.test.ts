import { describe, expect, it } from 'vitest'
import { CARRIERS, trackingUrlFor } from './carriers'

describe('trackingUrlFor', () => {
  it('builds a tracking URL for a known carrier', () => {
    expect(trackingUrlFor('Colissimo', '6A12345678901')).toBe(
      'https://www.laposte.fr/outils/suivre-vos-envois?code=6A12345678901'
    )
    expect(trackingUrlFor('UPS', '1Z999')).toBe('https://www.ups.com/track?tracknum=1Z999')
  })

  it('matches the carrier regardless of case or surrounding spaces', () => {
    const expected = trackingUrlFor('DHL', 'X1')
    expect(expected).not.toBeNull()
    expect(trackingUrlFor('dhl', 'X1')).toBe(expected)
    expect(trackingUrlFor('DHL', 'X1')).toBe(expected)
    expect(trackingUrlFor('  DhL  ', 'X1')).toBe(expected)
  })

  it('trims and URL-encodes the tracking number', () => {
    expect(trackingUrlFor('UPS', '  1Z999  ')).toBe('https://www.ups.com/track?tracknum=1Z999')
    expect(trackingUrlFor('UPS', 'A B/C')).toBe('https://www.ups.com/track?tracknum=A%20B%2FC')
  })

  it('returns null for an unknown carrier, so the UI shows plain text', () => {
    expect(trackingUrlFor('Pigeon Express', '123')).toBeNull()
    expect(trackingUrlFor('', '123')).toBeNull()
  })

  it('returns null when there is no tracking number', () => {
    expect(trackingUrlFor('Colissimo', '')).toBeNull()
    expect(trackingUrlFor('Colissimo', '   ')).toBeNull()
  })
})

describe('CARRIERS suggestions', () => {
  it('offers a non-empty, duplicate-free list', () => {
    expect(CARRIERS.length).toBeGreaterThan(0)
    expect(new Set(CARRIERS).size).toBe(CARRIERS.length)
  })

  // The datalist would be misleading if picking a suggestion produced no link.
  it('every suggested carrier resolves to a tracking URL', () => {
    for (const carrier of CARRIERS) {
      expect(trackingUrlFor(carrier, 'TEST123'), `${carrier} has no URL template`).not.toBeNull()
    }
  })
})
