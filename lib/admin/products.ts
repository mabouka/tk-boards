import { asc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  products,
  productAttributes,
  productAttributeValues,
  variants,
  variantValues,
  productOptions,
  productLinks,
  type I18nText,
} from '@/db/schema'
import type { ProductInput, LinkType } from './schemas'

export type ProductListRow = {
  id: string
  sku: string
  name: string
  kind: string | null
  active: boolean
  variantCount: number
  priceMin: number | null
  priceMax: number | null
}

export async function getProducts(): Promise<ProductListRow[]> {
  const rows = await db.select().from(products).orderBy(asc(products.name))
  if (rows.length === 0) return []

  const agg = await db
    .select({
      productId: variants.productId,
      n: sql<number>`count(*)::int`,
      min: sql<number>`min(${variants.priceEur})::float8`,
      max: sql<number>`max(${variants.priceEur})::float8`,
    })
    .from(variants)
    .groupBy(variants.productId)
  const byId = new Map(agg.map((a) => [a.productId, a]))

  return rows.map((p) => {
    const a = byId.get(p.id)
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      kind: p.kind,
      active: p.active,
      variantCount: a?.n ?? 0,
      priceMin: a?.min ?? null,
      priceMax: a?.max ?? null,
    }
  })
}

const fr = (j: unknown, fallback: string) =>
  (j as I18nText | null)?.fr ?? fallback

/** Full product tree shaped for the editor form. */
export async function getProduct(id: string): Promise<ProductInput | null> {
  const [p] = await db.select().from(products).where(eq(products.id, id)).limit(1)
  if (!p) return null

  const attrs = await db
    .select()
    .from(productAttributes)
    .where(eq(productAttributes.productId, id))
    .orderBy(asc(productAttributes.sortOrder))
  const attrIds = attrs.map((a) => a.id)

  const vals = attrIds.length
    ? await db
        .select()
        .from(productAttributeValues)
        .where(inArray(productAttributeValues.attributeId, attrIds))
        .orderBy(asc(productAttributeValues.sortOrder))
    : []

  const vars = await db
    .select()
    .from(variants)
    .where(eq(variants.productId, id))
    .orderBy(asc(variants.sortOrder))
  const varIds = vars.map((v) => v.id)

  const vvs = varIds.length
    ? await db.select().from(variantValues).where(inArray(variantValues.variantId, varIds))
    : []

  const opts = await db
    .select()
    .from(productOptions)
    .where(eq(productOptions.productId, id))
    .orderBy(asc(productOptions.sortOrder))

  const lnks = await db
    .select()
    .from(productLinks)
    .where(eq(productLinks.productId, id))
    .orderBy(asc(productLinks.sortOrder))

  const attrById = new Map(attrs.map((a) => [a.id, a]))
  const valById = new Map(vals.map((v) => [v.id, v]))

  const options = attrs.map((a) => ({
    code: a.code,
    name: fr(a.nameI18n, a.code),
    inputType: a.inputType as 'swatch' | 'select',
    values: vals
      .filter((v) => v.attributeId === a.id)
      .map((v) => ({ code: v.code, label: fr(v.labelI18n, v.code), hex: v.swatchHex ?? null })),
  }))

  const editorVariants = vars.map((v) => {
    const combo: Record<string, string> = {}
    for (const vv of vvs.filter((x) => x.variantId === v.id)) {
      const a = attrById.get(vv.attributeId)
      const val = valById.get(vv.valueId)
      if (a && val) combo[a.code] = val.code
    }
    return {
      sku: v.sku,
      combo,
      priceEur: v.priceEur ?? '',
      salePriceEur: v.salePriceEur ?? null,
      active: v.active,
    }
  })

  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    kind: (p.kind as 'board' | 'accessory' | null) ?? null,
    active: p.active,
    options,
    variants: editorVariants,
    addons: opts.map((o) => ({
      name: fr(o.nameI18n, ''),
      priceDelta: o.priceDeltaEur ?? '',
      sku: o.sku ?? null,
    })),
    links: lnks.map((l) => ({
      linkedProductId: l.linkedProductId,
      type: l.type as LinkType,
    })),
  }
}
