import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { siteSettings } from '@/db/schema'
import { liveSession } from '@/lib/session'

// The one settings row. Pinned id so there is never more than one.
const SETTINGS_ID = 'default'

/**
 * The global storefront switch. Cached per request (React `cache`), so the layout,
 * header and product pages that each ask don't each hit the DB.
 *
 * No row yet (fresh table before anyone toggles it) → false: V1 is contact-only,
 * so the safe default is shop-off.
 */
export const eshopEnabled = cache(async (): Promise<boolean> => {
  const [row] = await db
    .select({ enabled: siteSettings.eshopEnabled })
    .from(siteSettings)
    .where(eq(siteSettings.id, SETTINGS_ID))
    .limit(1)
  return row?.enabled ?? false
})

/**
 * Whether THIS request should see the real storefront (buy / cart / checkout) or
 * the contact-only V1.
 *
 * The global switch, OR a per-account override for a signed-in user working ahead
 * of launch — the owner and the client can preview the true checkout without it
 * being on for the public. Force-on only: once the global switch is set, everyone
 * sees the shop and the override no longer matters.
 *
 * Per request, since it depends on the session; cached so repeated asks within one
 * render are free.
 */
export const eshopVisible = cache(async (): Promise<boolean> => {
  if (await eshopEnabled()) return true
  const session = await liveSession()
  return session?.eshopPreview ?? false
})
