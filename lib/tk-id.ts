import { and, desc, eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import {
  units,
  variants,
  products,
  registrations,
  productAttributes,
  productAttributeValues,
  variantValues,
} from '@/db/schema'
import { localized } from '@/lib/i18n-text'

export type TkId = {
  unitId: string
  token: string
  serial: string | null
  status: string
  variantId: string | null
  productName: string | null
  variantSku: string | null
  /** Parent product SKU — matches the Sanity board's `skuCode` (for its image). */
  productSku: string | null
  ownerUserId: string | null
  contactPublic: boolean
  /** Owner-provided lost/stolen report (shown publicly while status is 'stolen'). */
  lostNote: string | null
  lostEmail: string | null
  lostPhone: string | null
}

export async function getUnitByToken(token: string): Promise<TkId | null> {
  if (!token) return null

  const [u] = await db
    .select({
      unitId: units.id,
      token: units.token,
      serial: units.serial,
      status: units.status,
      variantId: units.variantId,
      productName: products.name,
      variantSku: variants.sku,
      productSku: products.sku,
      lostNote: units.lostNote,
      lostEmail: units.lostEmail,
      lostPhone: units.lostPhone,
    })
    .from(units)
    .leftJoin(variants, eq(variants.id, units.variantId))
    .leftJoin(products, eq(products.id, variants.productId))
    .where(eq(units.token, token))
    .limit(1)

  if (!u) return null

  const [reg] = await db
    .select({ userId: registrations.userId, contactPublic: registrations.contactPublic })
    .from(registrations)
    .where(and(eq(registrations.unitId, u.unitId), eq(registrations.status, 'active')))
    .limit(1)

  return {
    ...u,
    ownerUserId: reg?.userId ?? null,
    contactPublic: reg?.contactPublic ?? false,
  }
}

export type VariantAttribute = { name: string; value: string; swatchHex: string | null }

/**
 * Resolved attribute values for a variant (e.g. Couleur → Bleu, Taille → 5'10"),
 * localized, ordered by the attribute's sort order. Empty when the variant has
 * no axes (simple product) or the variant is unknown.
 */
/** Resolved axes for many variants at once, grouped by variantId (one query). */
export async function getVariantAttributesFor(
  variantIds: string[],
  locale: string
): Promise<Map<string, VariantAttribute[]>> {
  const byVariant = new Map<string, VariantAttribute[]>()
  if (variantIds.length === 0) return byVariant

  const rows = await db
    .select({
      variantId: variantValues.variantId,
      name: productAttributes.nameI18n,
      label: productAttributeValues.labelI18n,
      swatchHex: productAttributeValues.swatchHex,
    })
    .from(variantValues)
    .innerJoin(productAttributes, eq(productAttributes.id, variantValues.attributeId))
    .innerJoin(productAttributeValues, eq(productAttributeValues.id, variantValues.valueId))
    .where(inArray(variantValues.variantId, variantIds))
    .orderBy(productAttributes.sortOrder)

  for (const r of rows) {
    const list = byVariant.get(r.variantId) ?? []
    list.push({ name: localized(r.name, locale), value: localized(r.label, locale), swatchHex: r.swatchHex })
    byVariant.set(r.variantId, list)
  }
  return byVariant
}

export async function getVariantAttributes(
  variantId: string,
  locale: string
): Promise<VariantAttribute[]> {
  if (!variantId) return []
  return (await getVariantAttributesFor([variantId], locale)).get(variantId) ?? []
}

export type UserBoard = {
  token: string
  serial: string | null
  status: string
  /** Product (marketing) name. */
  name: string | null
  /** Parent SKU — matches the Sanity board's skuCode (for its image). */
  sku: string | null
  variantId: string | null
  attributes: VariantAttribute[]
}

/**
 * Every board actively registered to a user (newest first), with its variant
 * axes resolved. The Sanity photo is fetched separately by SKU in the page.
 */
export async function getUserBoards(userId: string, locale: string): Promise<UserBoard[]> {
  if (!userId) return []

  const rows = await db
    .select({
      token: units.token,
      serial: units.serial,
      status: units.status,
      name: products.name,
      sku: products.sku,
      variantId: units.variantId,
    })
    .from(registrations)
    .innerJoin(units, eq(units.id, registrations.unitId))
    .leftJoin(variants, eq(variants.id, units.variantId))
    .leftJoin(products, eq(products.id, variants.productId))
    .where(and(eq(registrations.userId, userId), eq(registrations.status, 'active')))
    .orderBy(desc(registrations.createdAt))

  // Resolve every board's variant axes in one query, then attach (avoids N+1).
  const variantIds = [...new Set(rows.map((r) => r.variantId).filter((v): v is string => Boolean(v)))]
  const attrsByVariant = await getVariantAttributesFor(variantIds, locale)

  return rows.map((r) => ({
    ...r,
    attributes: r.variantId ? (attrsByVariant.get(r.variantId) ?? []) : [],
  }))
}
