import { describe, expect, it } from 'vitest'
import {
  effectiveImageDims,
  capHeroWidths,
  heroWidths,
  HERO_MOBILE_WIDTHS,
  HERO_DESKTOP_WIDTHS,
} from './hero-srcset'

const ref = (w: number, h: number) => ({ asset: { _ref: `image-abc123-${w}x${h}-jpg` } })

describe('effectiveImageDims', () => {
  it('parses WxH from the asset ref', () => {
    expect(effectiveImageDims(ref(1920, 1080))).toEqual({ w: 1920, h: 1080 })
  })

  it('reduces by the editorial crop fractions', () => {
    const d = effectiveImageDims({ ...ref(1920, 1080), crop: { top: 0.25, bottom: 0, left: 0.1, right: 0 } })
    expect(d!.w).toBeCloseTo(1728) // 1920 * 0.9
    expect(d!.h).toBeCloseTo(810) // 1080 * 0.75
  })

  it('returns null for an unparseable or missing ref', () => {
    expect(effectiveImageDims({ asset: { _ref: 'nope' } })).toBeNull()
    expect(effectiveImageDims(null)).toBeNull()
    expect(effectiveImageDims('string')).toBeNull()
  })
})

describe('capHeroWidths', () => {
  const widths = [375, 640, 750, 828, 1080, 1200]

  it('drops widths above max and makes the largest candidate exactly max', () => {
    expect(capHeroWidths(widths, 918)).toEqual([375, 640, 750, 828, 918])
  })

  it('keeps the list untouched when a listed width equals max', () => {
    expect(capHeroWidths(widths, 828)).toEqual([375, 640, 750, 828])
  })

  it('does not append past the predefined maximum', () => {
    expect(capHeroWidths(widths, 1300)).toEqual(widths)
  })

  it('falls back to a single max width when even the smallest is too big', () => {
    expect(capHeroWidths(widths, 300)).toEqual([300])
  })
})

describe('heroWidths', () => {
  it('caps a landscape source behind a tall (full-screen) mobile box', () => {
    // 1920×1080, ratio 812/375 → widest non-upscaled crop ≈ 1080*375/812 ≈ 498
    const { mobileWidths, desktopWidths } = heroWidths(ref(1920, 1080), 812 / 375)
    expect(mobileWidths).toEqual([375, 498])
    expect(desktopWidths).toEqual(HERO_DESKTOP_WIDTHS) // width fits (≤1920)
  })

  it('leaves a tall source mostly uncapped on mobile', () => {
    // 5967×1987, ratio 812/375 → crop width ≈ 1987*375/812 ≈ 917
    const { mobileWidths } = heroWidths(ref(5967, 1987), 812 / 375)
    expect(mobileWidths).toEqual([375, 640, 750, 828, 917])
  })

  it('applies no cap when dimensions are unknown', () => {
    const { mobileWidths, desktopWidths } = heroWidths('unknown', 812 / 375)
    expect(mobileWidths).toEqual(HERO_MOBILE_WIDTHS)
    expect(desktopWidths).toEqual(HERO_DESKTOP_WIDTHS)
  })
})
