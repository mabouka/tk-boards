import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { siteSettings } from '@/db/schema'
import { liveSession } from '@/lib/session'
import { decideEshopVisible } from '@/lib/eshop-decision'

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
 * the contact-only V1 — the global switch OR a per-account override for a signed-in
 * user working ahead of launch.
 *
 * Per request, since it depends on the session; cached so repeated asks within one
 * render are free. Short-circuits on the global switch so a launched shop never
 * pays for the session lookup.
 */
export const eshopVisible = cache(async (): Promise<boolean> => {
  const enabled = await eshopEnabled()
  if (enabled) return true
  const session = await liveSession()
  return decideEshopVisible(enabled, session?.eshopPreview)
})
