'use server'

import { revalidateTag } from 'next/cache'
import { SANITY_TAG } from '@/sanity/lib/fetch'

/**
 * Drop the catch-all Sanity cache tag so the next render refetches fresh content.
 * Called by <LiveRefresh /> on a Live Content API event (the real-time signal),
 * reusing the same tag the publish webhook uses — so client.fetch + the Data
 * Cache stay the data layer.
 */
export async function revalidateSanity() {
  revalidateTag(SANITY_TAG, { expire: 0 })
}
