'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { variants } from '@/db/schema'
import { requireAdmin } from '@/lib/require-admin'

export async function setStock(variantId: string, value: number) {
  await requireAdmin()
  if (!variantId) return
  const stock = Math.max(0, Math.trunc(Number(value)) || 0)
  await db.update(variants).set({ stock }).where(eq(variants.id, variantId))
  revalidatePath('/admin/stock')
}
