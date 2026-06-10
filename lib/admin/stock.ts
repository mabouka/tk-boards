import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { variants, products } from '@/db/schema'

export type StockRow = {
  variantId: string
  productName: string
  kind: string | null
  sku: string
  priceEur: number | null
  salePriceEur: number | null
  stock: number
  active: boolean
}

export async function getStockRows(): Promise<StockRow[]> {
  const rows = await db
    .select({
      variantId: variants.id,
      productName: products.name,
      kind: products.kind,
      sku: variants.sku,
      priceEur: variants.priceEur,
      salePriceEur: variants.salePriceEur,
      stock: variants.stock,
      active: variants.active,
    })
    .from(variants)
    .innerJoin(products, eq(variants.productId, products.id))
    .orderBy(asc(products.name), asc(variants.sku))

  return rows.map((r) => ({
    ...r,
    priceEur: r.priceEur != null ? Number(r.priceEur) : null,
    salePriceEur: r.salePriceEur != null ? Number(r.salePriceEur) : null,
  }))
}
