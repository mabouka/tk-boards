'use client'

import { useEffect, useRef } from 'react'
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
 * The subscription effect runs ONCE per token (router is read through a ref so a
 * new router identity can't re-run the effect and re-open the live stream — that
 * re-subscribe churn was what caused a render loop). Refreshes on `message` and
 * `restart` (events missed → refetch); debounced.
 */
export default function LiveRefresh({ token }: { token?: string }) {
  const router = useRouter()
  const routerRef = useRef(router)
  useEffect(() => {
    routerRef.current = router
  }, [router])

  useEffect(() => {
    const client = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
      apiVersion: '2025-05-25',
      useCdn: false,
      // Viewer token, sent to the browser ONLY inside the preview session (same
      // as next-sanity's defineLive browserToken). Keep it minimal (read drafts).
      token,
      ignoreBrowserTokenWarning: true,
    })

    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (token) routerRef.current.refresh()
        else revalidateSanity().then(() => routerRef.current.refresh()).catch(() => routerRef.current.refresh())
      }, 250)
    }

    const subscription = client.live.events({ includeDrafts: Boolean(token) }).subscribe({
      next: (event) => {
        // `message` = content changed; `restart` = the stream missed events and we
        // must refetch. Safe to refresh on both now that the effect runs once
        // (the render loop came from re-subscribing, not from these events).
        if (event.type === 'message' || event.type === 'restart') refresh()
      },
      error: (err) => {
        if (process.env.NODE_ENV !== 'production') console.warn('[LiveRefresh] live events error', err)
      },
    })

    return () => {
      clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [token])

  return null
}
