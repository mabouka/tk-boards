import { describe, expect, it } from 'vitest'
import { waLink } from './whatsapp'

describe('waLink', () => {
  it('returns null when there is no usable number', () => {
    expect(waLink(null)).toBeNull()
    expect(waLink(undefined)).toBeNull()
    expect(waLink('')).toBeNull()
    expect(waLink('   ')).toBeNull()
    expect(waLink('abc')).toBeNull()
    expect(waLink('00')).toBeNull()
  })

  it('normalises the three stored formats to the same wa.me link', () => {
    const expected = 'https://wa.me/32499471095'
    expect(waLink('+32 499 47 10 95')).toBe(expected)
    expect(waLink('0032 499 47 10 95')).toBe(expected) // 00 international prefix dropped
    expect(waLink('https://wa.me/32499471095')).toBe(expected)
  })

  it('leaves a single national leading zero alone (country unknown)', () => {
    expect(waLink('0499471095')).toBe('https://wa.me/0499471095')
  })

  it('URL-encodes a prefilled message', () => {
    expect(waLink('+32499471095', 'Bonjour à toi')).toBe(
      'https://wa.me/32499471095?text=Bonjour%20%C3%A0%20toi'
    )
  })
})
