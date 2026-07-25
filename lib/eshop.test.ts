import { describe, expect, it } from 'vitest'
import { decideEshopVisible } from './eshop-decision'

describe('decideEshopVisible', () => {
  it('shows the shop when the global switch is on, whatever the account', () => {
    expect(decideEshopVisible(true, false)).toBe(true)
    expect(decideEshopVisible(true, true)).toBe(true)
    expect(decideEshopVisible(true, null)).toBe(true)
  })

  it("shows the shop when the account's preview override is on and the global is off", () => {
    expect(decideEshopVisible(false, true)).toBe(true)
  })

  it('hides the shop when neither the global switch nor the override is on', () => {
    expect(decideEshopVisible(false, false)).toBe(false)
  })

  // A signed-out visitor has no preview; the missing value must read as "off",
  // never accidentally reveal the shop.
  it('treats a missing override as off', () => {
    expect(decideEshopVisible(false, null)).toBe(false)
    expect(decideEshopVisible(false, undefined)).toBe(false)
  })

  // Force-on only: the override never hides a shop the global switch turned on.
  it('never lets the override hide a globally-enabled shop', () => {
    expect(decideEshopVisible(true, false)).toBe(true)
  })
})
