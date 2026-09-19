import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { variants, units } from '@/db/schema'
import { persistProduct } from '@/lib/admin/products-write'
import type { ProductInput } from '@/lib/admin/schemas'
import { makeTestDb, truncateAll } from './db'

const { db, pool } = makeTestDb()

beforeEach(() => truncateAll(pool))
afterAll(() => pool.end())

// A configurable product with one SIZE axis → stable child SKUs (BX-S, BX-M…).
function boardInput(sizes: string[], id?: string, sku = 'BX'): ProductInput {
  return {
    id: id ?? null,
    name: 'Rocket',
    sku,
    kind: 'board',
    active: true,
    miniConfigurator: false,
    vatRate: 21,
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
      sku: `${sku}-${s}`,
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

describe('persistProduct — NFC unit identity across a re-save', () => {
  async function variantIdBySku(sku: string): Promise<string> {
    const [v] = await db.select({ id: variants.id }).from(variants).where(eq(variants.sku, sku))
    return v.id
  }

  it('keeps a unit linked to its variant when the product is edited (matched SKU)', async () => {
    const id = await persistProduct(db, boardInput(['S', 'M']))
    const vSku = await variantIdBySku('BX-S')
    // A produced, NFC-chipped board assigned to BX-S.
    await db.insert(units).values({ token: 'tok-keep', variantId: vSku, serial: 'SN-1', status: 'registered' })

    // Edit the product (add a size) — the classic re-save.
    await persistProduct(db, boardInput(['S', 'M', 'L'], id))

    const [u] = await db.select({ variantId: units.variantId }).from(units).where(eq(units.token, 'tok-keep'))
    expect(u.variantId).toBe(vSku) // same id preserved…
    expect(u.variantId).toBe(await variantIdBySku('BX-S')) // …and still the current BX-S variant
  })

  it('archives (not deletes) a variant that has a unit when its SKU is removed', async () => {
    const id = await persistProduct(db, boardInput(['S', 'M']))
    const vM = await variantIdBySku('BX-M')
    await db.insert(units).values({ token: 'tok-arch', variantId: vM, serial: 'SN-2', status: 'registered' })

    await persistProduct(db, boardInput(['S'], id)) // drop size M

    const [vMafter] = await db
      .select({ id: variants.id, active: variants.active })
      .from(variants)
      .where(eq(variants.sku, 'BX-M'))
    expect(vMafter).toBeDefined() // still there, not deleted
    expect(vMafter.active).toBe(false) // archived
    const [u] = await db.select({ variantId: units.variantId }).from(units).where(eq(units.token, 'tok-arch'))
    expect(u.variantId).toBe(vM) // unit still linked
  })
})

describe('persistProduct — SKU collision safety (no transactions under neon-http)', () => {
  it('rejects a duplicate SKU within the same product before any write', async () => {
    const input = boardInput(['S', 'M'], undefined, 'BX')
    input.variants[1].sku = 'BX-S' // collide the two variants

    await expect(persistProduct(db, input)).rejects.toThrow()
    // Nothing was created (the throw happened before the product insert).
    expect(await db.select().from(variants)).toHaveLength(0)
  })

  it('rejects a SKU owned by another product WITHOUT wiping the edited one', async () => {
    await persistProduct(db, boardInput(['S'], undefined, 'AX')) // product A owns AX-S
    const bId = await persistProduct(db, boardInput(['S', 'M'], undefined, 'BX'))
    await db.update(variants).set({ stock: 9 }).where(eq(variants.sku, 'BX-S'))

    // Re-save B but collide one of its variants with A's AX-S.
    const collide = boardInput(['S'], bId, 'BX')
    collide.variants[0].sku = 'AX-S'
    await expect(persistProduct(db, collide)).rejects.toThrow()

    // B is untouched: its variants + inventory survived (no destructive delete ran).
    expect(await stockBySku(bId)).toEqual({ 'BX-S': 9, 'BX-M': 0 })
  })
})
