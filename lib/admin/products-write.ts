import { and, eq, inArray, ne } from 'drizzle-orm'
import {
  products,
  productAttributes,
  productAttributeValues,
  variants,
  variantValues,
  productOptions,
  productLinks,
} from '@/db/schema'
import type { ProductInput } from './schemas'
import { i18n } from '@/lib/i18n-text'
import type { AnyPgDatabase } from '@/lib/db-types'

/**
 * Persist the full product tree (product → attributes → values → variants → links
 * + paid add-ons) as a full replace, while preserving inventory: stock is owned by
 * /admin/stock, not the product model, so it's carried over by SKU. New SKUs start
 * at 0. Returns the product id; throws on DB errors (caller maps the message).
 */
export async function persistProduct(db: AnyPgDatabase, input: ProductInput): Promise<string> {
  // 0. Pre-flight, BEFORE any write. neon-http has no transactions and step 2 below
  //    full-replaces the catalog subtree, so a mid-way insert failure would otherwise
  //    leave the product's variants/attributes half-destroyed. Reject SKU clashes up
  //    front: variant SKUs must be unique within the input and not already owned by a
  //    *different* product (variant.sku is globally unique). The product row's own SKU
  //    is guarded by its own insert/update in step 1, which runs before the delete.
  const skus = input.variants.map((v) => v.sku)
  if (new Set(skus).size !== skus.length) throw new Error('duplicate variant SKU in input')
  const [clash] = await db
    .select({ sku: variants.sku })
    .from(variants)
    .where(
      input.id
        ? and(inArray(variants.sku, skus), ne(variants.productId, input.id))
        : inArray(variants.sku, skus)
    )
    .limit(1)
  if (clash) throw new Error('duplicate variant SKU')

  // 1. Upsert the product row.
  let productId = input.id ?? null
  if (productId) {
    await db
      .update(products)
      .set({ name: input.name, sku: input.sku, kind: input.kind, active: input.active, miniConfigurator: input.miniConfigurator })
      .where(eq(products.id, productId))
  } else {
    const [created] = await db
      .insert(products)
      .values({ name: input.name, sku: input.sku, kind: input.kind, active: input.active, miniConfigurator: input.miniConfigurator })
      .returning({ id: products.id })
    productId = created.id
  }

  // 2. Wipe the catalog subtree (full replace), but preserve inventory:
  //    stock is owned by /admin/stock, not by the product model — carry it over by SKU.
  const existing = await db
    .select({ id: variants.id, sku: variants.sku, stock: variants.stock })
    .from(variants)
    .where(eq(variants.productId, productId))
  const stockBySku = new Map(existing.map((v) => [v.sku, v.stock]))
  const existingIds = existing.map((v) => v.id)
  if (existingIds.length) {
    await db.delete(variantValues).where(inArray(variantValues.variantId, existingIds))
  }
  await db.delete(variants).where(eq(variants.productId, productId))
  await db.delete(productAttributes).where(eq(productAttributes.productId, productId)) // cascades values

  // 3. Recreate attributes + values, tracking generated ids.
  const attrIdByCode = new Map<string, string>()
  const valIdByKey = new Map<string, string>() // `${optCode}|${valCode}`
  for (let i = 0; i < input.options.length; i++) {
    const opt = input.options[i]
    const [a] = await db
      .insert(productAttributes)
      .values({
        productId,
        code: opt.code,
        nameI18n: i18n(opt.name, opt.nameFr, opt.nameEs),
        inputType: opt.inputType,
        sortOrder: i,
      })
      .returning({ id: productAttributes.id })
    attrIdByCode.set(opt.code, a.id)

    for (let j = 0; j < opt.values.length; j++) {
      const val = opt.values[j]
      const [v] = await db
        .insert(productAttributeValues)
        .values({
          attributeId: a.id,
          code: val.code,
          labelI18n: i18n(val.label, val.labelFr, val.labelEs),
          swatchHex: val.hex,
          sortOrder: j,
        })
        .returning({ id: productAttributeValues.id })
      valIdByKey.set(`${opt.code}|${val.code}`, v.id)
    }
  }

  // 4. Recreate variants + their value links.
  for (let i = 0; i < input.variants.length; i++) {
    const ev = input.variants[i]
    const [v] = await db
      .insert(variants)
      .values({
        productId,
        sku: ev.sku,
        priceEur: ev.priceEur,
        salePriceEur: ev.salePriceEur,
        stock: stockBySku.get(ev.sku) ?? 0, // preserved from inventory, default 0 for new SKUs
        active: ev.active,
        sortOrder: i,
      })
      .returning({ id: variants.id })

    const links = Object.entries(ev.combo)
      .map(([optCode, valCode]) => ({
        variantId: v.id,
        attributeId: attrIdByCode.get(optCode),
        valueId: valIdByKey.get(`${optCode}|${valCode}`),
      }))
      .filter((r): r is { variantId: string; attributeId: string; valueId: string } =>
        Boolean(r.attributeId && r.valueId)
      )
    if (links.length) await db.insert(variantValues).values(links)
  }

  // 5. Replace paid add-ons (product_option).
  await db.delete(productOptions).where(eq(productOptions.productId, productId))
  for (let i = 0; i < input.addons.length; i++) {
    const ad = input.addons[i]
    await db.insert(productOptions).values({
      productId,
      nameI18n: i18n(ad.name),
      priceDeltaEur: ad.priceDelta,
      sku: ad.sku,
      sortOrder: i,
    })
  }

  // 6. Replace related products (product_link), skipping self-links and duplicates.
  await db.delete(productLinks).where(eq(productLinks.productId, productId))
  const seenLink = new Set<string>()
  let li = 0
  for (const ln of input.links) {
    if (ln.linkedProductId === productId) continue
    const k = `${ln.linkedProductId}|${ln.type}`
    if (seenLink.has(k)) continue
    seenLink.add(k)
    await db.insert(productLinks).values({
      productId,
      linkedProductId: ln.linkedProductId,
      type: ln.type,
      sortOrder: li++,
    })
  }

  return productId
}
