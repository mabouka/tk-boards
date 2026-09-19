// Decide, on a product save, what happens to each existing variant so identity is
// preserved: a variant is reused (UPDATE in place) when its SKU is still wanted, an
// unwanted SKU is archived if it still has NFC units or order lines (never orphan a
// produced board) and hard-deleted otherwise. Pure so it's unit-testable without a DB.

export type ExistingVariant = { id: string; sku: string }

export type VariantPlan = {
  /** Wanted SKU → existing variant id to update in place. Absent SKU = insert new. */
  reuseIdBySku: Map<string, string>
  /** Gone variant ids that are still referenced (units/orders): keep, set active=false. */
  archive: string[]
  /** Gone variant ids with no references: safe to hard-delete. */
  delete: string[]
}

export function planVariantReconciliation(
  existing: ExistingVariant[],
  desiredSkus: string[],
  referencedIds: Set<string>
): VariantPlan {
  const desired = new Set(desiredSkus)
  const reuseIdBySku = new Map<string, string>()
  const archive: string[] = []
  const del: string[] = []

  for (const v of existing) {
    if (desired.has(v.sku)) reuseIdBySku.set(v.sku, v.id)
    else if (referencedIds.has(v.id)) archive.push(v.id)
    else del.push(v.id)
  }

  return { reuseIdBySku, archive, delete: del }
}
