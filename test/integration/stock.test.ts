import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { products, variants } from '@/db/schema'
import { reserveStock, releaseStock } from '@/lib/orders'
import { makeTestDb, truncateAll } from './db'

const { db, pool } = makeTestDb()

beforeEach(() => truncateAll(pool))
afterAll(() => pool.end())

/** A product with one variant per given stock level; returns the variant ids. */
async function seed(stocks: number[]): Promise<string[]> {
  const [p] = await db
    .insert(products)
    .values({ sku: 'TK-T', name: 'Test board', kind: 'board', active: true })
    .returning({ id: products.id })

  const rows = await db
    .insert(variants)
    .values(
      stocks.map((stock, i) => ({
        productId: p.id,
        sku: `TK-T-${i}`,
        priceEur: '100.00',
        stock,
        sortOrder: i,
      }))
    )
    .returning({ id: variants.id })
  return rows.map((r) => r.id)
}

const stockOf = async (ids: string[]): Promise<number[]> => {
  const rows = await db
    .select({ id: variants.id, stock: variants.stock })
    .from(variants)
    .where(inArray(variants.id, ids))
  // Preserve the caller's order rather than the database's.
  return ids.map((id) => rows.find((r) => r.id === id)!.stock)
}

describe('reserveStock', () => {
  it('takes every line when the stock is there', async () => {
    const [a, b] = await seed([3, 2])
    await expect(
      reserveStock([{ variantId: a, qty: 2 }, { variantId: b, qty: 1 }], db)
    ).resolves.toBe(true)
    expect(await stockOf([a, b])).toEqual([1, 1])
  })

  // The regression that matters: the previous implementation looped guarded
  // updates, so a cart failing on its second line had already decremented the
  // first — with no session and no event to ever give it back.
  it('takes nothing at all when one line falls short', async () => {
    const [a, b] = await seed([3, 1])
    await expect(
      reserveStock([{ variantId: a, qty: 1 }, { variantId: b, qty: 5 }], db)
    ).resolves.toBe(false)
    expect(await stockOf([a, b])).toEqual([3, 1])
  })

  it('lets exactly one buyer take the last unit', async () => {
    const [a] = await seed([1])
    const results = await Promise.all([
      reserveStock([{ variantId: a, qty: 1 }], db),
      reserveStock([{ variantId: a, qty: 1 }], db),
    ])
    expect(results.filter(Boolean)).toHaveLength(1)
    expect(await stockOf([a])).toEqual([0])
  })

  it('sums a variant listed twice instead of applying it once', async () => {
    const [a] = await seed([5])
    await expect(
      reserveStock([{ variantId: a, qty: 2 }, { variantId: a, qty: 1 }], db)
    ).resolves.toBe(true)
    expect(await stockOf([a])).toEqual([2])
  })

  it('refuses when the summed quantity exceeds stock, even if each line fits', async () => {
    const [a] = await seed([3])
    await expect(
      reserveStock([{ variantId: a, qty: 2 }, { variantId: a, qty: 2 }], db)
    ).resolves.toBe(false)
    expect(await stockOf([a])).toEqual([3])
  })

  it('refuses an unknown variant rather than silently taking the rest', async () => {
    const [a] = await seed([3])
    await expect(
      reserveStock([{ variantId: a, qty: 1 }, { variantId: 'nope', qty: 1 }], db)
    ).resolves.toBe(false)
    expect(await stockOf([a])).toEqual([3])
  })

  it('exhausts stock exactly to zero', async () => {
    const [a] = await seed([2])
    await expect(reserveStock([{ variantId: a, qty: 2 }], db)).resolves.toBe(true)
    expect(await stockOf([a])).toEqual([0])
  })

  it('is a no-op for empty or non-positive lines', async () => {
    const [a] = await seed([3])
    await expect(reserveStock([], db)).resolves.toBe(true)
    await expect(reserveStock([{ variantId: a, qty: 0 }], db)).resolves.toBe(true)
    expect(await stockOf([a])).toEqual([3])
  })
})

describe('releaseStock', () => {
  it('gives back exactly what was taken', async () => {
    const [a, b] = await seed([4, 4])
    const lines = [{ variantId: a, qty: 2 }, { variantId: b, qty: 3 }]
    await reserveStock(lines, db)
    await releaseStock(lines, db)
    expect(await stockOf([a, b])).toEqual([4, 4])
  })

  it('sums a variant listed twice', async () => {
    const [a] = await seed([1])
    await releaseStock([{ variantId: a, qty: 1 }, { variantId: a, qty: 2 }], db)
    expect(await stockOf([a])).toEqual([4])
  })

  it('ignores empty and non-positive lines', async () => {
    const [a] = await seed([3])
    await releaseStock([], db)
    await releaseStock([{ variantId: a, qty: 0 }], db)
    expect(await stockOf([a])).toEqual([3])
  })

  // The held-stock model leans on this: cancelling an order releases whatever the
  // transition into a held state took, so the two must be mirror images.
  it('round-trips any sequence back to the starting stock', async () => {
    const [a, b] = await seed([6, 6])
    const before = await stockOf([a, b])
    for (const lines of [
      [{ variantId: a, qty: 1 }],
      [{ variantId: a, qty: 2 }, { variantId: b, qty: 3 }],
      [{ variantId: b, qty: 1 }],
    ]) {
      expect(await reserveStock(lines, db)).toBe(true)
      await releaseStock(lines, db)
    }
    expect(await stockOf([a, b])).toEqual(before)
  })
})

describe('stock is never negative', () => {
  it('cannot be driven below zero by an oversized request', async () => {
    const [a] = await seed([2])
    await expect(reserveStock([{ variantId: a, qty: 3 }], db)).resolves.toBe(false)
    const [stock] = await stockOf([a])
    expect(stock).toBe(2)
    expect(stock).toBeGreaterThanOrEqual(0)
  })

  it('keeps the guard after a partial drain', async () => {
    const [a] = await seed([3])
    expect(await reserveStock([{ variantId: a, qty: 2 }], db)).toBe(true)
    expect(await reserveStock([{ variantId: a, qty: 2 }], db)).toBe(false)
    expect(await stockOf([a])).toEqual([1])
  })
})

describe('variant isolation', () => {
  it('leaves other variants untouched', async () => {
    const [a, b, c] = await seed([5, 5, 5])
    await reserveStock([{ variantId: b, qty: 2 }], db)
    expect(await stockOf([a, b, c])).toEqual([5, 3, 5])
    await db.delete(variants).where(eq(variants.id, c)) // unrelated churn
    expect(await stockOf([a, b])).toEqual([5, 3])
  })
})
