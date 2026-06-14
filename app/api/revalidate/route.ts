import { type NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { parseBody } from 'next-sanity/webhook'
import { SANITY_TAG } from '@/sanity/lib/fetch'

/**
 * Sanity webhook → on-publish cache invalidation.
 *
 * Set up a webhook in manage.sanity.io (dataset: production) that POSTs to
 * https://<your-domain>/api/revalidate with a projection that includes `_type`
 * (the default document body does), and the same secret you put in the
 * SANITY_REVALIDATE_SECRET env var. `parseBody` verifies the signature and waits
 * out Content Lake eventual consistency.
 *
 * We expire the catch-all `sanity` tag — which every `sanityCache()` read carries,
 * so this refreshes the whole site on the next visit — plus the document's own
 * `_type` tag for anything that opts into finer-grained tags later. `{ expire: 0 }`
 * forces immediate expiry, the recommended form for external (webhook) callers.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret) {
    return new NextResponse('Missing SANITY_REVALIDATE_SECRET', { status: 500 })
  }

  const { isValidSignature, body } = await parseBody<{ _type?: string }>(req, secret)

  if (!isValidSignature) {
    return new NextResponse('Invalid signature', { status: 401 })
  }
  if (!body?._type) {
    return new NextResponse('Bad request: missing _type in webhook payload', { status: 400 })
  }

  revalidateTag(SANITY_TAG, { expire: 0 })
  revalidateTag(body._type, { expire: 0 })

  return NextResponse.json({ revalidated: true, type: body._type, now: Date.now() })
}
