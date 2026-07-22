'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import { db } from '@/db'
import { shippingRates, products } from '@/db/schema'
import { requireAdmin } from '@/lib/require-admin'
import { isCountryCode } from '@/lib/countries'

type Result = { ok: true } | { ok: false; error: string }

/** Replace a product's whole shipping-rate matrix in one atomic write. */
export async function saveShippingRates(
  productId: string,
  rates: { country: string; amountEur: string }[]
): Promise<Result> {
  await requireAdmin()
  if (!productId) return { ok: false, error: 'Produit invalide.' }

  // Validate + normalise: known country code, non-negative amount, no duplicates.
  const seen = new Set<string>()
  const clean: { country: string; amountEur: string }[] = []
  for (const r of rates) {
    const country = String(r.country || '').toUpperCase()
    if (!isCountryCode(country)) return { ok: false, error: `Pays invalide : ${r.country}` }
    if (seen.has(country)) return { ok: false, error: `Pays en double : ${country}` }
    const amount = Number(r.amountEur)
    if (!Number.isFinite(amount) || amount < 0) {
      return { ok: false, error: `Montant invalide pour ${country}` }
    }
    seen.add(country)
    clean.push({ country, amountEur: amount.toFixed(2) })
  }

  const [p] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1)
  if (!p) return { ok: false, error: 'Produit introuvable.' }

  const del = db.delete(shippingRates).where(eq(shippingRates.productId, productId))
  if (clean.length) {
    const ins = db
      .insert(shippingRates)
      .values(clean.map((r) => ({ productId, country: r.country, amountEur: r.amountEur })))
    await db.batch([del, ins] as [BatchItem<'pg'>, BatchItem<'pg'>])
  } else {
    await del
  }

  revalidatePath(`/admin/products/${productId}`)
  return { ok: true }
}
