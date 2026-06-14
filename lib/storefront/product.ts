import { cache } from 'react'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import {
  products,
  productAttributes,
  productAttributeValues,
  variants,
  variantValues,
} from '@/db/schema'
import { localized } from '@/lib/i18n-text'

export type StorefrontAttributeValue = {
  code: string
  label: string
  swatchHex: string | null
}

export type StorefrontAttribute = {
  code: string
  name: string
  inputType: 'swatch' | 'select'
  values: StorefrontAttributeValue[]
}

export type StorefrontVariant = {
  sku: string
  price: number
  salePrice: number | null
  stock: number
  combo: Record<string, string> // attributeCode -> valueCode
}

export type StorefrontProduct = {
  sku: string
  hasVariants: boolean
  fromPrice: number | null // min effective price across active variants
  attributes: StorefrontAttribute[]
  variants: StorefrontVariant[]
}

/**
 * Storefront read: resolves a board's `skuCode` to its DB product, with the
 * option axes (attributes/values, ordered by sortOrder) and active variants —
 * everything the board page + configurator need. Returns null when no product
 * is linked yet (board has a skuCode but nothing in the admin).
 *
 * Memoized per request (React cache) so it's safe to call more than once.
 */
export const getStorefrontProduct = cache(
  async (sku: string, locale: string): Promise<StorefrontProduct | null> => {
    const [product] = await db
      .select({ id: products.id, sku: products.sku })
      .from(products)
      .where(eq(products.sku, sku))
      .limit(1)
    if (!product) return null

    // Two independent chains — fetch the heads in parallel.
    const [attrRows, variantRows] = await Promise.all([
      db
        .select()
        .from(productAttributes)
        .where(eq(productAttributes.productId, product.id))
        .orderBy(productAttributes.sortOrder),
      db
        .select()
        .from(variants)
        .where(and(eq(variants.productId, product.id), eq(variants.active, true)))
        .orderBy(variants.sortOrder),
    ])

    const attrIds = attrRows.map((a) => a.id)
    const variantIds = variantRows.map((v) => v.id)
    const [valueRows, vvRows] = await Promise.all([
      attrIds.length
        ? db
            .select()
            .from(productAttributeValues)
            .where(inArray(productAttributeValues.attributeId, attrIds))
            .orderBy(productAttributeValues.sortOrder)
        : Promise.resolve([]),
      variantIds.length
        ? db.select().from(variantValues).where(inArray(variantValues.variantId, variantIds))
        : Promise.resolve([]),
    ])

    // Resolve internal ids -> stable codes so combos are keyed by attribute/value code.
    const attrCodeById = new Map(attrRows.map((a) => [a.id, a.code]))
    const valueCodeById = new Map(valueRows.map((v) => [v.id, v.code]))

    const comboByVariant = new Map<string, Record<string, string>>()
    for (const vv of vvRows) {
      const attrCode = attrCodeById.get(vv.attributeId)
      const valueCode = valueCodeById.get(vv.valueId)
      if (!attrCode || !valueCode) continue
      const combo = comboByVariant.get(vv.variantId) ?? {}
      combo[attrCode] = valueCode
      comboByVariant.set(vv.variantId, combo)
    }

    const attributes: StorefrontAttribute[] = attrRows.map((a) => ({
      code: a.code,
      name: localized(a.nameI18n, locale, a.code),
      inputType: a.inputType === 'swatch' ? 'swatch' : 'select',
      values: valueRows
        .filter((v) => v.attributeId === a.id)
        .map((v) => ({
          code: v.code,
          label: localized(v.labelI18n, locale, v.code),
          swatchHex: v.swatchHex,
        })),
    }))

    const storefrontVariants: StorefrontVariant[] = variantRows.map((v) => {
      const sale = v.salePriceEur != null ? Number(v.salePriceEur) : null
      return {
        sku: v.sku,
        price: Number(v.priceEur),
        // Treat a 0 (or negative) sale price as "no sale" — almost always bad data.
        salePrice: sale != null && sale > 0 ? sale : null,
        stock: v.stock,
        combo: comboByVariant.get(v.id) ?? {},
      }
    })

    const effectivePrices = storefrontVariants.map((v) => v.salePrice ?? v.price)
    const fromPrice = effectivePrices.length ? Math.min(...effectivePrices) : null

    return {
      sku: product.sku,
      // Configurable only when there are axes AND at least one active variant to pick.
      hasVariants: attributes.length > 0 && storefrontVariants.length > 0,
      fromPrice,
      attributes,
      variants: storefrontVariants,
    }
  }
)
