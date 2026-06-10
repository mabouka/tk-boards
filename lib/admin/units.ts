import { asc, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { units, variants, products } from '@/db/schema'

export type UnitRow = {
  id: string
  token: string
  serial: string | null
  status: string
  createdAt: Date
  variantId: string | null
  variantSku: string | null
  productName: string | null
}

export async function getUnits(): Promise<UnitRow[]> {
  return db
    .select({
      id: units.id,
      token: units.token,
      serial: units.serial,
      status: units.status,
      createdAt: units.createdAt,
      variantId: units.variantId,
      variantSku: variants.sku,
      productName: products.name,
    })
    .from(units)
    .leftJoin(variants, eq(variants.id, units.variantId))
    .leftJoin(products, eq(products.id, variants.productId))
    .orderBy(desc(units.createdAt))
}

export type BoardVariant = { id: string; sku: string; productName: string }

/** Variants of board products only — accessories are excluded from NFC pairing. */
export async function getBoardVariants(): Promise<BoardVariant[]> {
  return db
    .select({ id: variants.id, sku: variants.sku, productName: products.name })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(eq(products.kind, 'board'))
    .orderBy(asc(products.name), asc(variants.sku))
}

export type MintedUnit = { id: string; token: string }

/** Minted (unassigned) tokens — selectable in the one-by-one flow. */
export async function getMintedUnits(): Promise<MintedUnit[]> {
  return db
    .select({ id: units.id, token: units.token })
    .from(units)
    .where(eq(units.status, 'minted'))
    .orderBy(desc(units.createdAt))
}
