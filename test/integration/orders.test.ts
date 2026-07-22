import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { eq, sql } from 'drizzle-orm'
import { orders, orderLines, products, variants, webhookEvents } from '@/db/schema'
import { createOrder, type NewOrder, type NewOrderLine } from '@/lib/orders'
import {
  claimWebhookEvent,
  pruneWebhookEvents,
  releaseWebhookEvent,
} from '@/lib/webhook-events'
import { makeTestDb, truncateAll } from './db'

const { db, pool } = makeTestDb()

beforeEach(() => truncateAll(pool))
afterAll(() => pool.end())

async function seedVariant(): Promise<string> {
  const [p] = await db
    .insert(products)
    .values({ sku: 'TK-O', name: 'Rocket', kind: 'board', active: true, vatRate: 21 })
    .returning({ id: products.id })
  const [v] = await db
    .insert(variants)
    .values({ productId: p.id, sku: 'TK-O-1', priceEur: '1000.00', stock: 10 })
    .returning({ id: variants.id })
  return v.id
}

const line = (over: Partial<NewOrderLine> = {}): NewOrderLine => ({
  variantId: null,
  productSku: 'TK-O',
  variantSku: 'TK-O-1',
  productName: 'Rocket',
  variantLabel: null,
  unitPriceEur: '1000.00',
  vatRate: 21,
  qty: 1,
  lineShippingEur: '0.00',
  ...over,
})

const order = (over: Partial<NewOrder> = {}): NewOrder => ({
  userId: null,
  email: 'Buyer@Example.COM',
  locale: 'fr',
  status: 'paid',
  paymentMethod: 'stripe',
  paymentStatus: 'paid',
  subtotalEur: '1000.00',
  taxEur: '173.55',
  shippingEur: '0.00',
  totalEur: '1000.00',
  ship: { name: 'Buyer', line1: '1 rue X', city: 'Tarifa', country: 'ES' },
  lines: [line()],
  ...over,
})

describe('createOrder', () => {
  it('writes the order with its lines', async () => {
    const variantId = await seedVariant()
    const { id, number } = await createOrder(order({ lines: [line({ variantId, qty: 2 })] }), db)

    const [row] = await db.select().from(orders).where(eq(orders.id, id))
    expect(row.number).toBe(number)
    expect(row.totalEur).toBe('1000.00')
    expect(row.paidAt).not.toBeNull() // paid orders get a payment date

    const rows = await db.select().from(orderLines).where(eq(orderLines.orderId, id))
    expect(rows).toHaveLength(1)
    expect(rows[0].qty).toBe(2)
  })

  it('freezes the VAT rate on the line', async () => {
    const { id } = await createOrder(order({ lines: [line({ vatRate: 10 })] }), db)
    const [l] = await db.select().from(orderLines).where(eq(orderLines.orderId, id))
    expect(l.vatRate).toBe(10)
  })

  it('lowercases the email so lookups match', async () => {
    const { id } = await createOrder(order(), db)
    const [row] = await db.select().from(orders).where(eq(orders.id, id))
    expect(row.email).toBe('buyer@example.com')
  })

  it('leaves paidAt empty for an unpaid order', async () => {
    const { id } = await createOrder(
      order({ status: 'pending_payment', paymentStatus: 'pending' }),
      db
    )
    const [row] = await db.select().from(orders).where(eq(orders.id, id))
    expect(row.paidAt).toBeNull()
  })

  // The reason this write is a batch/transaction at all: a half-written order —
  // a row with no lines — would be invoiced and shipped as an empty order.
  it('writes nothing at all when a line is rejected', async () => {
    await expect(
      createOrder(order({ lines: [line(), line({ variantId: 'no-such-variant' })] }), db)
    ).rejects.toThrow()

    expect(await db.select().from(orders)).toHaveLength(0)
    expect(await db.select().from(orderLines)).toHaveLength(0)
  })

  it('numbers orders in sequence', async () => {
    const a = await createOrder(order(), db)
    const b = await createOrder(order(), db)
    const c = await createOrder(order(), db)
    const seq = [a, b, c].map((o) => Number(o.number.slice(-4)))
    expect(seq).toEqual([seq[0], seq[0] + 1, seq[0] + 2])
  })

  // The old count(*) numbering handed back a number that already existed as soon
  // as the series had a hole, then failed five identical retries and wedged.
  it('keeps going after a gap in the series', async () => {
    const first = await createOrder(order(), db)
    const second = await createOrder(order(), db)
    await db.delete(orders).where(eq(orders.id, first.id)) // punch a hole

    const third = await createOrder(order(), db)
    expect(Number(third.number.slice(-4))).toBe(Number(second.number.slice(-4)) + 1)
  })

  it('does not reuse a number already taken', async () => {
    const a = await createOrder(order(), db)
    const b = await createOrder(order(), db)
    expect(b.number).not.toBe(a.number)
    const all = await db.select({ n: orders.number }).from(orders)
    expect(new Set(all.map((r) => r.n)).size).toBe(all.length)
  })

  it('accepts an order with no lines', async () => {
    const { id } = await createOrder(order({ lines: [] }), db)
    expect(await db.select().from(orderLines).where(eq(orderLines.orderId, id))).toHaveLength(0)
  })
})

describe('webhook event claims', () => {
  it('lets the first delivery through and refuses the redelivery', async () => {
    expect(await claimWebhookEvent('evt_1', 'checkout.session.expired', db)).toBe(true)
    expect(await claimWebhookEvent('evt_1', 'checkout.session.expired', db)).toBe(false)
  })

  // Exactly the bug this exists for: a redelivered `expired` used to give the same
  // stock back a second time.
  it('runs the guarded work only once across repeated deliveries', async () => {
    let released = 0
    for (let i = 0; i < 4; i++) {
      if (await claimWebhookEvent('evt_dup', 'checkout.session.expired', db)) released++
    }
    expect(released).toBe(1)
  })

  it('claims different events independently', async () => {
    expect(await claimWebhookEvent('evt_a', 'checkout.session.completed', db)).toBe(true)
    expect(await claimWebhookEvent('evt_b', 'checkout.session.completed', db)).toBe(true)
  })

  // On failure the claim goes back, or Stripe's retry would be answered
  // 'duplicate' and the payment would never become an order.
  it('can be reclaimed after a release', async () => {
    expect(await claimWebhookEvent('evt_retry', 'checkout.session.completed', db)).toBe(true)
    await releaseWebhookEvent('evt_retry', db)
    expect(await claimWebhookEvent('evt_retry', 'checkout.session.completed', db)).toBe(true)
  })

  it('releasing an unknown id is harmless', async () => {
    await expect(releaseWebhookEvent('evt_never', db)).resolves.toBeUndefined()
  })
})

describe('pruneWebhookEvents', () => {
  it('drops claims past the retention window but keeps recent ones', async () => {
    await claimWebhookEvent('evt_fresh', 'checkout.session.completed', db)
    await claimWebhookEvent('evt_stale', 'checkout.session.completed', db)
    await db
      .update(webhookEvents)
      .set({ receivedAt: sql`now() - interval '30 days'` })
      .where(eq(webhookEvents.id, 'evt_stale'))

    await pruneWebhookEvents(db)

    const left = await db.select({ id: webhookEvents.id }).from(webhookEvents)
    expect(left.map((r) => r.id)).toEqual(['evt_fresh'])
  })

  // Pruning must not resurrect an event Stripe could still redeliver.
  it('leaves a pruned event claimable again', async () => {
    await claimWebhookEvent('evt_old', 'checkout.session.expired', db)
    await db
      .update(webhookEvents)
      .set({ receivedAt: sql`now() - interval '30 days'` })
      .where(eq(webhookEvents.id, 'evt_old'))
    await pruneWebhookEvents(db)
    expect(await claimWebhookEvent('evt_old', 'checkout.session.expired', db)).toBe(true)
  })
})
