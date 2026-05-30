import type { TypedObject } from '@portabletext/types'
import type { SanityImageSource } from '@sanity/image-url'

/** A Sanity image value that can be passed to `urlFor()`. */
export type SanityImage = SanityImageSource

/** Portable Text content as returned by Sanity and accepted by `<PortableText>`. */
export type PortableTextValue = TypedObject[]

/** A call-to-action link, resolved to an `href` by GROQ. */
export type Cta = {
  _key?: string
  text?: string
  href?: string
  openInNewTab?: boolean
}
