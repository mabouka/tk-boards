'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from 'next-sanity'
import { revalidateSanity } from './revalidate'

/**
 * Real-time signal via the Sanity Live Content API. Keeps `client.fetch` + the
 * Data Cache as the data layer:
 *  - **preview** (token present): subscribes to draft changes → `router.refresh()`
 *    (draft reads are uncached, so the refresh shows fresh drafts as you type).
 *  - **production** (no token): subscribes to published changes → revalidate the
 *    `sanity` cache tag, then refresh.
 *
 * The read token is only passed here inside the preview session (draft mode).
 */
export default function LiveRefresh({ token }: { token?: string }) {
  const router = useRouter()

  useEffect(() => {
    const client = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
      apiVersion: '2025-05-25',
      useCdn: false,
      token,
    })

    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (token) router.refresh()
        else revalidateSanity().then(() => router.refresh()).catch(() => router.refresh())
      }, 250)
    }

    const subscription = client.live.events({ includeDrafts: Boolean(token) }).subscribe({
      next: (event) => {
        if (event.type === 'message' || event.type === 'restart') refresh()
      },
      error: () => {},
    })

    return () => {
      clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [token, router])

  return null
}
