import { createClient } from 'next-sanity'

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
  stega: { studioUrl: '/studio' },
})
