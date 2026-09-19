import { and, eq, inArray, ne } from 'drizzle-orm'
import {
  products,
  productAttributes,
  productAttributeValues,
  variants,
  variantValues,
  productOptions,
  productLinks,
  units,
  orderLines,
} from '@/db/schema'
import type { ProductInput } from './schemas'
import { i18n } from '@/lib/i18n-text'
import { planVariantReconciliation } from './variant-reconcile'
import type { AnyPgDatabase } from '@/lib/db-types'

/**
 * Persist the full product tree (product → attributes → values → variants → links
 * + paid add-ons). Attributes/values are fully replaced, but VARIANTS are upserted
 * by SKU so each keeps its id — NFC units (units.variantId) and order history stay
 * linked across an edit. A variant whose SKU is dropped is archived (active=false)
 * when it still has units/orders, else hard-deleted. Stock is owned by /admin/stock:
 * matched SKUs keep theirs, new SKUs start at 0. Returns the product id; throws on
 * DB errors (caller maps the message).
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
      .set({ name: input.name, sku: input.sku, kind: input.kind, active: input.active, miniConfigurator: input.miniConfigurator, vatRate: input.vatRate })
      .where(eq(products.id, productId))
  } else {
    const [created] = await db
      .insert(products)
      .values({ name: input.name, sku: input.sku, kind: input.kind, active: input.active, miniConfigurator: input.miniConfigurator, vatRate: input.vatRate })
      .returning({ id: products.id })
    productId = created.id
  }

  // 2. Read existing variants — we upsert them by SKU (never blanket-delete) so a
  //    re-save keeps each variant's id, and with it its NFC units and order history.
  const existing = await db
    .select({ id: variants.id, sku: variants.sku })
    .from(variants)
    .where(eq(variants.productId, productId))

  // Attributes + values are rebuilt wholesale each save; deleting them cascades to
  // variant_value, clearing every variant's axis links (the variants themselves stay).
  await db.delete(productAttributes).where(eq(productAttributes.productId, productId)) // cascades values + variant_value

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

  // 4. Reconcile variants by SKU (preserve identity → keep NFC units linked). The
  //    reuse/insert/archive/delete decision is the pure planVariantReconciliation.
  const existingIds = existing.map((v) => v.id)
  const referenced = new Set<string>()
  if (existingIds.length) {
    for (const r of await db
      .select({ v: units.variantId })
      .from(units)
      .where(inArray(units.variantId, existingIds))) {
      if (r.v) referenced.add(r.v)
    }
    for (const r of await db
      .select({ v: orderLines.variantId })
      .from(orderLines)
      .where(inArray(orderLines.variantId, existingIds))) {
      if (r.v) referenced.add(r.v)
    }
  }
  const plan = planVariantReconciliation(existing, input.variants.map((v) => v.sku), referenced)

  // 4a. Drop unwanted SKUs: archive those still referenced (never orphan a produced
  //     board), hard-delete the rest.
  if (plan.archive.length) {
    await db.update(variants).set({ active: false }).where(inArray(variants.id, plan.archive))
  }
  if (plan.delete.length) await db.delete(variants).where(inArray(variants.id, plan.delete))

  // 4b. Upsert wanted variants: reuse the matched id (UPDATE in place → units stay
  //     linked) or insert a new one (stock 0; inventory is owned by /admin/stock).
  for (let i = 0; i < input.variants.length; i++) {
    const ev = input.variants[i]
    const reuseId = plan.reuseIdBySku.get(ev.sku)
    let variantId: string
    if (reuseId) {
      await db
        .update(variants)
        .set({ priceEur: ev.priceEur, salePriceEur: ev.salePriceEur, active: ev.active, sortOrder: i })
        .where(eq(variants.id, reuseId))
      variantId = reuseId
    } else {
      const [v] = await db
        .insert(variants)
        .values({
          productId,
          sku: ev.sku,
          priceEur: ev.priceEur,
          salePriceEur: ev.salePriceEur,
          stock: 0,
          active: ev.active,
          sortOrder: i,
        })
        .returning({ id: variants.id })
      variantId = v.id
    }

    const links = Object.entries(ev.combo)
      .map(([optCode, valCode]) => ({
        variantId,
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
