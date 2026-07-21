import { createHash, randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { transfers, units, variants, products } from '@/db/schema'

const hashToken = (raw: string) => createHash('sha256').update(raw).digest('hex')

const TRANSFER_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/** Create a pending transfer; returns the raw token to embed in the email link. */
export async function createTransfer(
  unitId: string,
  fromUserId: string,
  toEmail: string
): Promise<string> {
  const raw = randomBytes(32).toString('hex')
  await db.insert(transfers).values({
    unitId,
    fromUserId,
    toEmail: toEmail.toLowerCase(),
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + TRANSFER_TTL_MS),
  })
  return raw
}

export type PendingTransfer = {
  id: string
  unitId: string
  token: string
  toEmail: string
  boardName: string | null
  serial: string | null
  sku: string | null
  variantId: string | null
}

/** A still-valid pending transfer for this raw token, or null (unknown/expired/used). */
export async function getPendingTransfer(raw: string): Promise<PendingTransfer | null> {
  if (!raw) return null
  const [row] = await db
    .select({
      id: transfers.id,
      unitId: transfers.unitId,
      token: units.token,
      toEmail: transfers.toEmail,
      status: transfers.status,
      expiresAt: transfers.expiresAt,
      boardName: products.name,
      serial: units.serial,
      sku: products.sku,
      variantId: units.variantId,
    })
    .from(transfers)
    .innerJoin(units, eq(units.id, transfers.unitId))
    .leftJoin(variants, eq(variants.id, units.variantId))
    .leftJoin(products, eq(products.id, variants.productId))
    .where(eq(transfers.tokenHash, hashToken(raw)))
    .limit(1)

  if (!row || row.status !== 'pending' || row.expiresAt.getTime() < Date.now()) return null
  return {
    id: row.id,
    unitId: row.unitId,
    token: row.token,
    toEmail: row.toEmail,
    boardName: row.boardName,
    serial: row.serial,
    sku: row.sku,
    variantId: row.variantId,
  }
}
