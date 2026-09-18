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
