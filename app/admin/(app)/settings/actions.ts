'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { siteSettings, users } from '@/db/schema'
import { requireAdmin } from '@/lib/require-admin'

export type Result = { ok: true } | { ok: false; error: string }

const SETTINGS_ID = 'default'

/**
 * Flip the global storefront switch. Upsert, because the row doesn't exist until
 * the first toggle — a fresh table reads as false (shop off), and this creates the
 * row the first time it's turned on.
 *
 * Revalidates layout-deep: the switch changes the header (cart), the product pages
 * (buy vs contact) and the account tabs, so the whole tree has to re-render.
 */
export async function setEshopEnabled(enabled: boolean): Promise<Result> {
  await requireAdmin()
  await db
    .insert(siteSettings)
    .values({ id: SETTINGS_ID, eshopEnabled: enabled })
    .onConflictDoUpdate({ target: siteSettings.id, set: { eshopEnabled: enabled } })
  revalidatePath('/', 'layout')
  revalidatePath('/admin/settings')
  return { ok: true }
}

/**
 * Force-show the storefront to one account while the shop is globally off, so the
 * owner and the client can work on the real checkout before launch. Force-on only.
 */
export async function setEshopPreview(userId: string, preview: boolean): Promise<Result> {
  await requireAdmin()
  if (!userId) return { ok: false, error: 'Requête invalide.' }
  await db.update(users).set({ eshopPreview: preview }).where(eq(users.id, userId))
  revalidatePath('/', 'layout')
  revalidatePath(`/admin/accounts/${userId}`)
  return { ok: true }
}
