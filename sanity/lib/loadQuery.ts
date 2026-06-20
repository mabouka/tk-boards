import 'server-only'
import { draftMode } from 'next/headers'
import { client } from './client'
import { sanityCache } from './fetch'

const token = process.env.SANITY_API_READ_TOKEN

/**
 * Draft-aware read used by visual-editing pages.
 *
 * - **Presentation / draft mode** (preview cookie set): reads DRAFTS with a token,
 *   stega-encoded (so overlays map to fields) and uncached, so the iframe shows
 *   live draft content.
 * - **Normal mode**: the exact existing path — published `client.fetch` + Next Data
 *   Cache via `sanityCache(tags)` (webhook revalidation untouched).
 *
 * Keeps `client.fetch` as the data layer; pass the generated `*QueryResult` type.
 */
export async function loadQuery<T>(
  query: string,
  params: Record<string, unknown> = {},
  tags: string[] = []
): Promise<T> {
  const { isEnabled } = await draftMode()

  if (isEnabled) {
    if (!token) {
      throw new Error('Draft mode is enabled but SANITY_API_READ_TOKEN is missing.')
    }
    return client.fetch<T>(query, params, {
      token,
      perspective: 'drafts',
      useCdn: false,
      stega: true,
      next: { revalidate: 0 },
    })
  }

  return client.fetch<T>(query, params, sanityCache(...tags))
}
