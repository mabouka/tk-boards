import { createClient } from 'next-sanity'

// App-specific enum/logic fields whose VALUES drive layout or branching (not
// display text). Stega's default filter can't know they aren't display, so it
// would append invisible chars and break comparisons like `imagePosition === 'right'`
// or `theme === 'dark'`. We skip stega on these (slugs/refs/urls keep the default).
const NON_DISPLAY_FIELDS = new Set([
  'imagePosition',
  'layout',
  'theme',
  'cardSide',
  'mediaType',
  'size',
  'aspectRatio',
  'style',
  'language',
  'tagVariant',
  'inputType',
  'swatchHex',
])

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2025-05-25',
  // CDN off on purpose. Freshness is handled by Next's Data Cache + on-publish
  // revalidation (Sanity webhook → /api/revalidate → revalidateTag). With the
  // CDN on, a refetch right after revalidation could still hit the ~60s-stale
  // edge cache, so menu/content edits would lag. Reads go through `sanityCache()`
  // (see sanity/lib/fetch.ts), which caches them in Next so we don't pay the
  // uncached API latency on every request.
  useCdn: false,
  // Stega stays OFF by default (no invisible chars in production output); it's
  // enabled per-fetch only in draft/Presentation mode (see sanity/lib/loadQuery.ts).
  // `studioUrl` lets visual-editing overlays build "open in Studio" links.
  stega: {
    studioUrl: '/studio',
    // Keep Sanity's default behaviour (handles slugs/refs/urls) but never encode
    // our enum/logic fields — see NON_DISPLAY_FIELDS above.
    filter: (props) => {
      const last = props.sourcePath[props.sourcePath.length - 1]
      if (typeof last === 'string' && NON_DISPLAY_FIELDS.has(last)) return false
      return props.filterDefault(props)
    },
  },
})
