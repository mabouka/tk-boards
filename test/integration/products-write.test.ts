import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { variants } from '@/db/schema'
import { persistProduct } from '@/lib/admin/products-write'
import type { ProductInput } from '@/lib/admin/schemas'
import { makeTestDb, truncateAll } from './db'

const { db, pool } = makeTestDb()

beforeEach(() => truncateAll(pool))
afterAll(() => pool.end())

// A configurable product with one SIZE axis → stable child SKUs (BX-S, BX-M…).
function boardInput(sizes: string[], id?: string): ProductInput {
  return {
    id: id ?? null,
    name: 'Rocket',
    sku: 'BX',
    kind: 'board',
    active: true,
    options: [
      {
        code: 'SIZE',
        name: 'Size',
        nameFr: undefined,
        nameEs: undefined,
        inputType: 'select',
        values: sizes.map((s) => ({
          code: s,
          label: s,
          labelFr: undefined,
          labelEs: undefined,
          hex: null,
        })),
      },
    ],
    variants: sizes.map((s) => ({
      sku: `BX-${s}`,
      combo: { SIZE: s },
      priceEur: '1699',
      salePriceEur: null,
      active: true,
    })),
    addons: [],
    links: [],
  }
}

async function stockBySku(productId: string) {
  const rows = await db
    .select({ sku: variants.sku, stock: variants.stock })
    .from(variants)
    .where(eq(variants.productId, productId))
  return Object.fromEntries(rows.map((r) => [r.sku, r.stock]))
}

describe('persistProduct — inventory preservation', () => {
  it('keeps stock per SKU across a re-save and starts new SKUs at 0', async () => {
    const id = await persistProduct(db, boardInput(['S', 'M']))

    // Inventory is owned by /admin/stock — simulate stock being set there.
    await db.update(variants).set({ stock: 7 }).where(eq(variants.sku, 'BX-S'))
    await db.update(variants).set({ stock: 3 }).where(eq(variants.sku, 'BX-M'))

    // Re-save the same product with an added size L (full catalog replace).
    await persistProduct(db, boardInput(['S', 'M', 'L'], id))

    expect(await stockBySku(id)).toEqual({ 'BX-S': 7, 'BX-M': 3, 'BX-L': 0 })
  })

  it('drops inventory for a SKU that no longer exists after re-save', async () => {
    const id = await persistProduct(db, boardInput(['S', 'M']))
    await db.update(variants).set({ stock: 5 }).where(eq(variants.sku, 'BX-M'))

    await persistProduct(db, boardInput(['S'], id)) // size M removed

    expect(await stockBySku(id)).toEqual({ 'BX-S': 0 })
  })
})
