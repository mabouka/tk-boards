import type { PortableTextBlock } from '@portabletext/types'
import type { SanityImageSource } from '@sanity/image-url'

/** A Sanity image value that can be passed to `urlFor()`. */
export type SanityImage = SanityImageSource

/** Portable Text content (array of blocks) as returned by Sanity. */
export type PortableTextValue = PortableTextBlock[]

/** A call-to-action link, resolved to an `href` by GROQ. */
export type Cta = {
  _key?: string
  text?: string
  href?: string
  openInNewTab?: boolean
}
