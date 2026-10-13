import { createImageUrlBuilder } from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url'
import { client } from './client'

const builder = createImageUrlBuilder(client)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

/**
 * True only when the image field actually has an uploaded asset. urlFor() throws
 * ("Unable to resolve image URL from source") on an image object that carries alt
 * text but no asset — an easy state to leave a field in from the Studio — so every
 * caller must gate on this, not just on the field being present, or the throw 500s
 * the whole server render.
 */
export function hasAsset<T>(source: T): source is NonNullable<T> {
  return Boolean(
    source && typeof source === 'object' && 'asset' in source && (source as { asset?: unknown }).asset
  )
}

/**
 * Full-bleed hero / section image preset: 1920w, q85, auto-format.
 * Returns null when the field has no uploaded asset (callers add their own
 * placeholder fallback where needed).
 */
export function resolveHeroImage(image: { asset?: unknown } | null | undefined): string | null {
  return image?.asset
    ? urlFor(image as SanityImageSource).width(1920).quality(85).auto('format').url()
    : null
}

// Candidate widths for full-bleed hero <picture> srcsets (cap matches deviceSizes).
const HERO_DESKTOP_WIDTHS = [828, 1080, 1200, 1536, 1920]
const HERO_MOBILE_WIDTHS = [375, 640, 750, 828, 1080, 1200]

export type HeroSrcSets = { fallbackSrc: string; desktopSrcSet: string; mobileSrcSet: string }

/**
 * Build the two srcsets a full-bleed hero needs for <picture> art direction:
 * - desktop: width-only, so the editorial crop is kept and no aspect is forced.
 * - mobile: width + height + fit=crop, so a portrait box is cropped around the
 *   HOTSPOT (the builder emits the crop rect + focal point) instead of the browser
 *   upscaling a landscape via object-fit:cover.
 * `mobileRatio` is the portrait box's height / width (e.g. 466/375 for BasicHero,
 * 812/375 for the full-screen homepage hero). Pass a source that has an asset.
 */
export function heroImageSrcSets(source: SanityImageSource, mobileRatio: number): HeroSrcSets {
  const desktop = (w: number) => urlFor(source).width(w).quality(85).auto('format').url()
  const mobile = (w: number) =>
    urlFor(source)
      .width(w)
      .height(Math.round(w * mobileRatio))
      .fit('crop')
      .quality(85)
      .auto('format')
      .url()
  return {
    fallbackSrc: desktop(1920),
    desktopSrcSet: HERO_DESKTOP_WIDTHS.map((w) => `${desktop(w)} ${w}w`).join(', '),
    mobileSrcSet: HERO_MOBILE_WIDTHS.map((w) => `${mobile(w)} ${w}w`).join(', '),
  }
}
