import { and, desc, eq, sql } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import { db } from '@/db'
import { orders, orderLines, users } from '@/db/schema'
import { createEmailToken } from '@/lib/auth-tokens'
import { sendPasswordResetEmail } from '@/lib/email'
import { orderItemCountSql } from '@/lib/order-sql'
import { getVariantAttributesFor } from '@/lib/tk-id'
import type { AnyPgDatabase } from '@/lib/db-types'

export type StockLine = { variantId: string; qty: number }

/** Hold stock for these lines, all or nothing. Guarded on stock >= qty, so two
 *  buyers of the last unit can't both succeed; if any line falls short nothing is
 *  taken at all and it returns false. */
export async function reserveStock(
  lines: StockLine[],
  database: AnyPgDatabase = db
): Promise<boolean> {
  const wanted = sumByVariant(lines)
  if (wanted.length === 0) return true

  // One statement, all-or-nothing: the `ok` CTE decides up front whether every
  // line can be satisfied, and the UPDATE only fires when it can. A loop of
  // guarded updates would leave earlier lines decremented if the process died
  // mid-way, with no session and no event to ever give them back.
  const rows = sql.join(
    wanted.map((l) => sql`(${l.variantId}, ${l.qty}::int)`),
    sql`, `
  )
  const res = await database.execute(sql`
    with req(variant_id, qty) as (values ${rows}),
         ok as (
           select count(*) = (select count(*) from req) as all_ok
           from req join "variant" v on v.id = req.variant_id and v.stock >= req.qty
         )
    update "variant" v
       set stock = v.stock - r.qty
      from req r, ok
     where v.id = r.variant_id and ok.all_ok
    returning v.id
  `)
  return affectedRows(res) === wanted.length
}

/** Give stock back (session expired, order cancelled/refunded). */
export async function releaseStock(
  lines: StockLine[],
  database: AnyPgDatabase = db
): Promise<void> {
  const give = sumByVariant(lines)
  if (give.length === 0) return
  const rows = sql.join(
    give.map((l) => sql`(${l.variantId}, ${l.qty}::int)`),
    sql`, `
  )
  await database.execute(sql`
    with req(variant_id, qty) as (values ${rows})
    update "variant" v set stock = v.stock + r.qty
      from req r
     where v.id = r.variant_id
  `)
}

/** Collapse repeated variants so a cart listing one twice moves its stock once. */
function sumByVariant(lines: StockLine[]): StockLine[] {
  const byId = new Map<string, number>()
  for (const l of lines) {
    if (!l.variantId || l.qty <= 0) continue
    byId.set(l.variantId, (byId.get(l.variantId) ?? 0) + l.qty)
  }
  return [...byId].map(([variantId, qty]) => ({ variantId, qty }))
}

const affectedRows = (res: unknown): number => {
  const r = res as { rows?: unknown[]; length?: number }
  return r?.rows?.length ?? r?.length ?? 0
}

const LOCALES = ['fr', 'en', 'es']
const loc = (v: string | null | undefined) => (LOCALES.includes(String(v)) ? String(v) : 'fr')

/** Sequential human-readable number, e.g. TK-2026-0001.
 *
 *  Derived from the highest number already issued this year, not from a row count:
 *  a count silently reuses a number as soon as the series has a gap (a deleted
 *  order), and since the retry below recomputes the same value it would fail five
 *  times and then wedge order creation permanently. The unique index on
 *  order.number remains the backstop for a concurrent collision. */
async function nextOrderNumber(database: AnyPgDatabase = db): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `TK-${year}-`
  // max() on the numeric suffix, not on the text: a plain max would compare
  // 'TK-2026-10000' against 'TK-2026-9999' character by character and pick the
  // latter, handing back a number that already exists once the series passes 9999.
  const [row] = await database
    .select({ last: sql<number | null>`max(cast(substring(${orders.number} from '[0-9]+$') as integer))` })
    .from(orders)
    .where(sql`${orders.number} like ${`${prefix}%`}`)
  const seq = Number(row?.last ?? 0)
  return `${prefix}${String((Number.isFinite(seq) ? seq : 0) + 1).padStart(4, '0')}`
}

/** Find the account for this email, or create a light one (no password) and email
 *  a "set your password" link so the buyer can claim it. Returns the user id. */
export async function resolveOrCreateUser(opts: {
  email: string
  name?: string | null
  locale?: string | null
}): Promise<string> {
  const email = opts.email.toLowerCase()
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (existing) return existing.id

  const [created] = await db
    .insert(users)
    .values({ email, name: opts.name || null, role: 'customer', locale: loc(opts.locale) })
    .returning({ id: users.id })

  // Invite to set a password (reuses the reset flow — the link lets them choose one).
  try {
    const token = await createEmailToken(created.id, 'reset', 60 * 24 * 7) // 7 days
    await sendPasswordResetEmail({ to: email, locale: loc(opts.locale), token })
  } catch {
    /* non-fatal: the account exists; they can use "forgot password" later */
  }
  return created.id
}

/**
 * Human-readable axes for an order line, in the buyer's language — "Taille : 5'10"
 * · Couleur : Rouge".
 *
 * Frozen onto the line at sale time like the name and price: the variant's
 * attributes can be renamed or deleted later, and an order has to keep describing
 * what was actually bought.
 */
export async function variantLabelsFor(
  variantIds: string[],
  locale: string
): Promise<Map<string, string>> {
  const ids = [...new Set(variantIds.filter(Boolean))]
  const out = new Map<string, string>()
  if (ids.length === 0) return out
  const byVariant = await getVariantAttributesFor(ids, locale)
  for (const [variantId, attrs] of byVariant) {
    const label = attrs.map((a) => `${a.name} : ${a.value}`).join(' · ')
    if (label) out.set(variantId, label)
  }
  return out
}

export type NewOrderLine = {
  variantId: string | null
  productSku: string
  variantSku: string | null
  productName: string
  variantLabel: string | null
  unitPriceEur: string // '490.00', TTC
  vatRate: number // frozen at sale time — invoices must not follow later changes
  qty: number
  lineShippingEur: string
}

export type NewOrder = {
  userId: string | null
  email: string
  locale: string
  status: string
  paymentMethod: 'stripe' | 'cash' | 'transfer'
  paymentStatus: 'pending' | 'paid'
  subtotalEur: string
  taxEur: string
  shippingEur: string
  totalEur: string
  ship: {
    name?: string | null
    line1?: string | null
    line2?: string | null
    postalCode?: string | null
    city?: string | null
    country?: string | null
    phone?: string | null
  }
  stripeSessionId?: string | null
  stripePaymentIntentId?: string | null
  lines: NewOrderLine[]
}

/**
 * Postgres unique-violation (23505), looked for down the cause chain.
 *
 * Drivers wrap the driver error rather than throwing it directly, so checking only
 * the top-level object silently misses it — which defeated both callers: the
 * order-number retry never fired, and a redelivered webhook answered 500 instead of
 * "duplicate", leaving Stripe to retry it indefinitely.
 */
export const isUniqueViolation = (e: unknown): boolean => {
  for (let cur = e, depth = 0; cur != null && depth < 5; depth++) {
    if (typeof cur === 'object' && 'code' in cur && (cur as { code?: unknown }).code === '23505') {
      return true
    }
    cur = (cur as { cause?: unknown }).cause
  }
  return false
}

/**
 * Run several statements as one unit on whichever driver we're given.
 *
 * neon-http has no interactive transactions but does have `batch`; node-postgres
 * (used by the integration harness) has `transaction` but no `batch`. Statements
 * are built *from the passed client* rather than pre-built, because a drizzle query
 * builder is bound to the client that created it and can't be replayed inside
 * someone else's transaction.
 */
async function writeAtomically(
  database: AnyPgDatabase,
  build: (client: AnyPgDatabase) => BatchItem<'pg'>[]
): Promise<void> {
  const batchable = database as unknown as {
    batch?: (stmts: [BatchItem<'pg'>, ...BatchItem<'pg'>[]]) => Promise<unknown>
  }
  if (typeof batchable.batch === 'function') {
    await batchable.batch(build(database) as [BatchItem<'pg'>, ...BatchItem<'pg'>[]])
    return
  }
  await database.transaction(async (tx) => {
    for (const stmt of build(tx as unknown as AnyPgDatabase)) await stmt
  })
}

/** Insert an order + its lines atomically. Stock is never touched here — callers
 *  hold it via reserveStock (web checkout, manual paid orders, mark-paid) and give
 *  it back via releaseStock, so takes and returns always stay symmetric. */
export async function createOrder(
  input: NewOrder,
  database: AnyPgDatabase = db
): Promise<{ id: string; number: string }> {
  const id = crypto.randomUUID()

  const buildStmts = (client: AnyPgDatabase, number: string): BatchItem<'pg'>[] => {
    const stmts: BatchItem<'pg'>[] = [
      client.insert(orders).values({
        id,
        number,
        userId: input.userId,
        email: input.email.toLowerCase(),
        locale: loc(input.locale),
        status: input.status,
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentStatus,
        subtotalEur: input.subtotalEur,
        taxEur: input.taxEur,
        shippingEur: input.shippingEur,
        totalEur: input.totalEur,
        shipName: input.ship.name ?? null,
        shipLine1: input.ship.line1 ?? null,
        shipLine2: input.ship.line2 ?? null,
        shipPostalCode: input.ship.postalCode ?? null,
        shipCity: input.ship.city ?? null,
        shipCountry: input.ship.country ?? null,
        shipPhone: input.ship.phone ?? null,
        stripeSessionId: input.stripeSessionId ?? null,
        stripePaymentIntentId: input.stripePaymentIntentId ?? null,
        paidAt: input.paymentStatus === 'paid' ? new Date() : null,
      }),
    ]
    if (input.lines.length) {
      stmts.push(client.insert(orderLines).values(input.lines.map((l) => ({ orderId: id, ...l }))))
    }
    return stmts
  }

  // Two orders can derive the same number concurrently; the unique index rejects
  // the loser and, because the write is atomic, it leaves nothing behind — so we
  // just recompute and retry.
  for (let attempt = 0; attempt < 5; attempt++) {
    const number = await nextOrderNumber(database)
    try {
      await writeAtomically(database, (client) => buildStmts(client, number))
      return { id, number }
    } catch (e) {
      if (attempt < 4 && isUniqueViolation(e)) continue
      throw e
    }
  }
  throw new Error('order number generation exhausted retries')
}

// ── Account: read a user's orders ──
export async function getUserOrders(userId: string) {
  if (!userId) return []
  return db
    .select({
      number: orders.number,
      status: orders.status,
      totalEur: orders.totalEur,
      createdAt: orders.createdAt,
      itemCount: orderItemCountSql,
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
}

/** One order (by number) with its lines — scoped to the owner. */
export async function getUserOrder(userId: string, number: string) {
  if (!userId || !number) return null
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.number, number)))
    .limit(1)
  if (!order) return null

  const lines = await db
    .select({
      productName: orderLines.productName,
      variantSku: orderLines.variantSku,
      variantLabel: orderLines.variantLabel,
      unitPriceEur: orderLines.unitPriceEur,
      qty: orderLines.qty,
    })
    .from(orderLines)
    .where(eq(orderLines.orderId, order.id))

  return { order, lines }
}
