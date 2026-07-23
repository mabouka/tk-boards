'use server'

import { revalidateTag } from 'next/cache'
import { draftMode } from 'next/headers'
import { SANITY_TAG } from '@/sanity/lib/fetch'

/**
 * Drop the catch-all Sanity cache tag so the next render refetches fresh content.
 * Called by <LiveRefresh /> on a Live Content API event (the real-time signal),
 * reusing the same tag the publish webhook uses — so client.fetch + the Data
 * Cache stay the data layer.
 *
 * Draft mode is required. Every exported function in a 'use server' file is a
 * public POST endpoint addressable by its action id, and this one is expensive to
 * serve: the client runs with `useCdn: false`, so each flush sends the renders that
 * follow to the live Sanity API instead of the edge cache — unguarded, a loop turns
 * every page view into an uncached round-trip. The only legitimate caller is
 * <LiveRefresh />, which the site layout mounts solely when `isDraft`, so the real
 * path loses nothing.
 */
export async function revalidateSanity() {
  const { isEnabled } = await draftMode()
  if (!isEnabled) return
  revalidateTag(SANITY_TAG, { expire: 0 })
}
