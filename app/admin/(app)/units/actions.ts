'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { asc, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { units, variants, products } from '@/db/schema'
import { requireAdmin } from '@/lib/require-admin'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const tagUrl = (token: string) => `${BASE}/tk-id/${token}`
const newToken = () => randomBytes(12).toString('base64url') // ~16 chars, URL-safe, unguessable

async function isBoardVariant(variantId: string): Promise<boolean> {
  const [v] = await db
    .select({ kind: products.kind })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(eq(variants.id, variantId))
    .limit(1)
  return v?.kind === 'board'
}

// ── Mode 1: mint a batch of tokens (status = minted) ──
export type BatchResult =
  | { ok: true; units: { token: string; url: string }[] }
  | { ok: false; error: string }

export async function generateBatch(quantity: number): Promise<BatchResult> {
  await requireAdmin()
  const qty = Math.min(500, Math.max(1, Math.trunc(Number(quantity)) || 0))
  if (qty < 1) return { ok: false, error: 'Quantité invalide.' }

  const rows = Array.from({ length: qty }, () => ({ token: newToken() }))
  try {
    await db.insert(units).values(rows)
  } catch {
    return { ok: false, error: 'Échec de la génération.' }
  }
  revalidatePath('/admin/units')
  return { ok: true, units: rows.map((r) => ({ token: r.token, url: tagUrl(r.token) })) }
}

// ── Mode 2 / assignment: link a unit to a board variant + serial ──
export type AssignResult = { ok: true } | { ok: false; error: string }

type AddInput = {
  tokenMode: 'new' | 'existing'
  existingUnitId?: string
  variantId: string
  serial: string
}

export async function addUnit(input: AddInput): Promise<AssignResult> {
  await requireAdmin()
  const serial = input.serial?.trim()
  if (!input.variantId || !serial) return { ok: false, error: 'Variante et série requises.' }
  if (!(await isBoardVariant(input.variantId))) return { ok: false, error: 'Variante non-board.' }

  try {
    if (input.tokenMode === 'existing') {
      if (!input.existingUnitId) return { ok: false, error: 'Token manquant.' }
      await db
        .update(units)
        .set({ variantId: input.variantId, serial, status: 'provisioned' })
        .where(eq(units.id, input.existingUnitId))
    } else {
      await db
        .insert(units)
        .values({ token: newToken(), variantId: input.variantId, serial, status: 'provisioned' })
    }
  } catch (e) {
    const msg = e instanceof Error && /unique|duplicate/i.test(e.message)
      ? 'Cette série est déjà utilisée.'
      : 'Échec de l’enregistrement.'
    return { ok: false, error: msg }
  }
  revalidatePath('/admin/units')
  return { ok: true }
}

export async function assignUnit(
  unitId: string,
  variantId: string,
  serial: string
): Promise<AssignResult> {
  await requireAdmin()
  const s = serial?.trim()
  if (!unitId || !variantId || !s) return { ok: false, error: 'Variante et série requises.' }
  if (!(await isBoardVariant(variantId))) return { ok: false, error: 'Variante non-board.' }
  try {
    await db
      .update(units)
      .set({ variantId, serial: s, status: 'provisioned' })
      .where(eq(units.id, unitId))
  } catch (e) {
    const msg = e instanceof Error && /unique|duplicate/i.test(e.message)
      ? 'Cette série est déjà utilisée.'
      : 'Échec de l’assignation.'
    return { ok: false, error: msg }
  }
  revalidatePath('/admin/units')
  return { ok: true }
}

// ── CSV export of the full registry ──
const csvField = (v: string) => `"${v.replace(/"/g, '""')}"`

export async function exportUnitsCsv(): Promise<string> {
  await requireAdmin()
  const rows = await db
    .select({
      token: units.token,
      serial: units.serial,
      status: units.status,
      productName: products.name,
      sku: variants.sku,
    })
    .from(units)
    .leftJoin(variants, eq(variants.id, units.variantId))
    .leftJoin(products, eq(products.id, variants.productId))
    .orderBy(asc(units.status), desc(units.createdAt))

  const header = ['token', 'url', 'serial', 'status', 'product', 'sku']
  const lines = rows.map((r) =>
    [r.token, tagUrl(r.token), r.serial ?? '', r.status, r.productName ?? '', r.sku ?? '']
      .map((f) => csvField(String(f)))
      .join(',')
  )
  return [header.join(','), ...lines].join('\n')
}
