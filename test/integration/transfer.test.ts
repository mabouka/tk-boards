import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { and, eq } from 'drizzle-orm'
import { users, products, variants, units, registrations, transfers } from '@/db/schema'
import { writeAtomically } from '@/lib/db-write'
import { makeTestDb, truncateAll } from './db'

const { db, pool } = makeTestDb()

beforeEach(() => truncateAll(pool))
afterAll(() => pool.end())

/** Owner holds an active registration on a unit, and has invited `recipient`. */
async function seed() {
  const [owner] = await db
    .insert(users)
    .values({ email: 'owner@example.com' })
    .returning({ id: users.id })
  const [recipient] = await db
    .insert(users)
    .values({ email: 'recipient@example.com' })
    .returning({ id: users.id })
  const [p] = await db
    .insert(products)
    .values({ sku: 'TK-RKT', name: 'Rocket', kind: 'board', active: true, vatRate: 21 })
    .returning({ id: products.id })
  const [v] = await db
    .insert(variants)
    .values({ productId: p.id, sku: 'TK-RKT-1', priceEur: '1749.00', stock: 1 })
    .returning({ id: variants.id })
  const [unit] = await db
    .insert(units)
    .values({ token: 'tok-1', serial: 'SN-1', variantId: v.id, status: 'registered' })
    .returning({ id: units.id })
  await db.insert(registrations).values({ userId: owner.id, unitId: unit.id, status: 'active' })
  const [t] = await db
    .insert(transfers)
    .values({
      unitId: unit.id,
      fromUserId: owner.id,
      toEmail: 'recipient@example.com',
      tokenHash: 'hash-1',
      expiresAt: new Date(Date.now() + 86_400_000),
    })
    .returning({ id: transfers.id })
  return { owner: owner.id, recipient: recipient.id, unitId: unit.id, transferId: t.id }
}

/** The exact statement sequence acceptTransfer hands to writeAtomically. */
const handover = (
  s: { recipient: string; unitId: string; transferId: string },
  recipientId = s.recipient
) =>
  writeAtomically(db, (tx) => [
    tx
      .update(registrations)
      .set({ status: 'transferred' })
      .where(and(eq(registrations.unitId, s.unitId), eq(registrations.status, 'active'))),
    tx.insert(registrations).values({ userId: recipientId, unitId: s.unitId, status: 'active' }),
    tx.update(transfers).set({ status: 'accepted' }).where(eq(transfers.id, s.transferId)),
    tx
      .update(transfers)
      .set({ status: 'expired' })
      .where(and(eq(transfers.unitId, s.unitId), eq(transfers.status, 'pending'))),
  ])

const activeOwner = async (unitId: string) => {
  const rows = await db
    .select({ userId: registrations.userId })
    .from(registrations)
    .where(and(eq(registrations.unitId, unitId), eq(registrations.status, 'active')))
  return rows
}

describe('board handover', () => {
  it('moves ownership to the recipient', async () => {
    const s = await seed()
    await handover(s)

    const active = await activeOwner(s.unitId)
    expect(active).toHaveLength(1)
    expect(active[0].userId).toBe(s.recipient)
  })

  // A partial unique index allows one active registration per unit, so retiring the
  // old one has to happen before inserting the new one. Statements run in order.
  it('never leaves two active registrations on one unit', async () => {
    const s = await seed()
    await handover(s)
    expect(await activeOwner(s.unitId)).toHaveLength(1)
  })

  it('closes the accepted invite and expires the others', async () => {
    const s = await seed()
    // A second outstanding invite from the same owner.
    await db.insert(transfers).values({
      unitId: s.unitId,
      fromUserId: s.owner,
      toEmail: 'someone.else@example.com',
      tokenHash: 'hash-2',
      expiresAt: new Date(Date.now() + 86_400_000),
    })

    await handover(s)

    const rows = await db.select({ hash: transfers.tokenHash, status: transfers.status }).from(transfers)
    const byHash = Object.fromEntries(rows.map((r) => [r.hash, r.status]))
    expect(byHash['hash-1']).toBe('accepted')
    expect(byHash['hash-2']).toBe('expired') // can't fire against the new owner
  })

  // The reason this is one unit at all: a failure between the first two statements
  // would leave the board with NO active registration — owned by nobody, so neither
  // party could transfer it or report it lost.
  it('leaves the original owner in place when a statement fails', async () => {
    const s = await seed()

    await expect(handover(s, 'no-such-user')).rejects.toThrow()

    const active = await activeOwner(s.unitId)
    expect(active).toHaveLength(1)
    expect(active[0].userId).toBe(s.owner) // rolled back, not orphaned

    const [t] = await db.select({ status: transfers.status }).from(transfers)
    expect(t.status).toBe('pending') // the invite is still usable
  })
})
