import { createImageUrlBuilder } from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url'
import { client } from './client'

const builder = createImageUrlBuilder(client)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
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
