'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { variants } from '@/db/schema'
import { requireAdmin } from '@/lib/require-admin'
import { clampStock } from '@/lib/admin/stock-ui'

export async function setStock(variantId: string, value: number) {
  await requireAdmin()
  if (!variantId) return
  const stock = clampStock(Number(value))
  await db.update(variants).set({ stock }).where(eq(variants.id, variantId))
  revalidatePath('/admin/stock')
}
