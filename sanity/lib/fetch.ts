/**
 * Cache options for a Sanity `client.fetch(query, params, sanityCache(...))`.
 *
 * Caches the result in Next's Data Cache and tags it so the Sanity webhook →
 * /api/revalidate can drop it on publish (the real-time path). Every entry
 * carries the catch-all `sanity` tag, so a single revalidateTag('sanity')
 * refreshes all content; pass extra `tags` (usually the document `_type`) for
 * finer-grained invalidation.
 *
 * `revalidate` is a time-based **safety net**, not the primary mechanism: if the
 * webhook is down or not yet configured, content still refreshes within this
 * window instead of being stuck stale forever (Next's Data Cache otherwise only
 * clears on redeploy). The webhook makes updates instant; this just bounds the
 * worst case.
 *
 * Returned as an options object — instead of wrapping `client.fetch` in a generic
 * helper — so the typed GROQ→TS inference (the `SanityQueries` map keyed on the
 * query string) is preserved at every call site.
 *
 * Pairs with `useCdn: false` on the client: after revalidation the refetch hits
 * the live API (fresh), not the ~60s-stale CDN.
 */
export const SANITY_TAG = 'sanity'

/** Fallback revalidation window (seconds) — see note above. 1h. */
const FALLBACK_REVALIDATE = 3600

export function sanityCache(...tags: string[]) {
  return {
    next: { revalidate: FALLBACK_REVALIDATE, tags: [SANITY_TAG, ...tags] },
  }
}
