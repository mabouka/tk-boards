// Pure width maths for the full-bleed hero <picture> srcsets — no Sanity client,
// so it's unit-testable offline. sanity/lib/image.ts turns these widths into URLs.

// Candidate widths (cap matches next deviceSizes).
export const HERO_DESKTOP_WIDTHS = [828, 1080, 1200, 1536, 1920]
export const HERO_MOBILE_WIDTHS = [375, 640, 750, 828, 1080, 1200]

/**
 * Pixel dimensions of an image, read from its asset ref (…-WxH-ext) and reduced
 * by the editorial crop fractions if any — i.e. how many pixels actually exist to
 * work with. null when the ref can't be parsed (then no cap is applied).
 */
export function effectiveImageDims(source: unknown): { w: number; h: number } | null {
  const ref = (source as { asset?: { _ref?: string } })?.asset?._ref
  const m = typeof ref === 'string' ? ref.match(/-(\d+)x(\d+)-\w+$/) : null
  if (!m) return null
  const c = (source as { crop?: { top?: number; bottom?: number; left?: number; right?: number } }).crop
  const w = Number(m[1]) * (1 - (c?.left ?? 0) - (c?.right ?? 0))
  const h = Number(m[2]) * (1 - (c?.top ?? 0) - (c?.bottom ?? 0))
  return { w, h }
}

/**
 * Keep candidate widths ≤ max, and make the largest candidate exactly `max` so a
 * high-DPR screen still gets the sharpest size the source can give WITHOUT the CDN
 * upscaling (never request more pixels than the crop holds). Widths are ascending.
 */
export function capHeroWidths(widths: number[], max: number): number[] {
  const m = Math.max(1, Math.floor(max))
  const kept = widths.filter((w) => w <= m)
  if (!kept.length) return [m]
  const top = kept[kept.length - 1]
  return top < m && m < widths[widths.length - 1] ? [...kept, m] : kept
}

/**
 * Capped candidate widths for a hero's mobile + desktop srcsets. The widest
 * non-upscaled crop is min(W, H/mobileRatio) on mobile (the box is `mobileRatio`
 * tall) and W on desktop (width-only, editorial crop kept). `mobileRatio` is the
 * portrait box's height / width.
 */
export function heroWidths(
  source: unknown,
  mobileRatio: number
): { mobileWidths: number[]; desktopWidths: number[] } {
  const dims = effectiveImageDims(source)
  return {
    mobileWidths: dims
      ? capHeroWidths(HERO_MOBILE_WIDTHS, Math.min(dims.w, dims.h / mobileRatio))
      : HERO_MOBILE_WIDTHS,
    desktopWidths: dims ? capHeroWidths(HERO_DESKTOP_WIDTHS, dims.w) : HERO_DESKTOP_WIDTHS,
  }
}
