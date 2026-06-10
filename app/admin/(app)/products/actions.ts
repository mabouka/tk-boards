'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { products } from '@/db/schema'
import { requireAdmin } from '@/lib/require-admin'
import { productInputSchema, type ProductInput } from '@/lib/admin/schemas'
import { persistProduct } from '@/lib/admin/products-write'

type SaveResult = { ok: true; id: string } | { ok: false; error: string }

export async function saveProduct(raw: ProductInput): Promise<SaveResult> {
  await requireAdmin()

  const parsed = productInputSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Données invalides.' }
  }

  try {
    const id = await persistProduct(db, parsed.data)
    revalidatePath('/admin/products')
    return { ok: true, id }
  } catch (e) {
    const msg = e instanceof Error && /unique|duplicate/i.test(e.message)
      ? 'Un SKU est déjà utilisé (produit ou variante).'
      : 'Échec de l’enregistrement.'
    return { ok: false, error: msg }
  }
}

export async function deleteProduct(id: string) {
  await requireAdmin()
  if (id) await db.delete(products).where(eq(products.id, id))
  revalidatePath('/admin/products')
}
