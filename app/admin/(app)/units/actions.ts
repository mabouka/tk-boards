'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/db'
import { units, variants, products, productAttributes, productAttributeValues, variantValues } from '@/db/schema'
import { requireAdmin } from '@/lib/require-admin'
import { csvField } from '@/lib/csv'
import { serialPrefix, formatSerial } from '@/lib/serial'
import { buildSpecs, type UnitSpecs } from '@/lib/unit-specs'
import { localized } from '@/lib/i18n-text'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const tagUrl = (token: string) => `${BASE}/tk-id/${token}`
const newToken = () => randomBytes(12).toString('base64url') // ~16 chars, URL-safe, unguessable

/** The variant's product kind + parent SKU (for the board check and serial model). */
async function variantInfo(variantId: string): Promise<{ kind: string | null; sku: string } | null> {
  const [v] = await db
    .select({ kind: products.kind, sku: products.sku })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(eq(variants.id, variantId))
    .limit(1)
  return v ?? null
}

/** Next serial for a product's model + current year, from the highest suffix
 *  already issued (not a row count — gaps would reuse a number). The unique index
 *  on unit.serial is the concurrency backstop; the caller retries on collision. */
async function nextSerial(productSku: string): Promise<string> {
  const prefix = serialPrefix(productSku, new Date().getFullYear())
  const [row] = await db
    .select({ last: sql<number | null>`max(cast(substring(${units.serial} from '[0-9]+$') as integer))` })
    .from(units)
    .where(sql`${units.serial} like ${`${prefix}%`}`)
  const seq = Number(row?.last ?? 0)
  return formatSerial(prefix, (Number.isFinite(seq) ? seq : 0) + 1)
}

const isDupSerial = (e: unknown) => e instanceof Error && /unique|duplicate/i.test(e.message)

/** Physical snapshot of a variant's axes (stable codes + FR labels — the admin is
 *  FR-only), stored on the unit at assignment so it outlives catalogue changes. */
async function variantSpecs(productSku: string, variantId: string): Promise<UnitSpecs> {
  const rows = await db
    .select({
      code: productAttributes.code,
      name: productAttributes.nameI18n,
      value: productAttributeValues.code,
      label: productAttributeValues.labelI18n,
    })
    .from(variantValues)
    .innerJoin(productAttributes, eq(productAttributes.id, variantValues.attributeId))
    .innerJoin(productAttributeValues, eq(productAttributeValues.id, variantValues.valueId))
    .where(eq(variantValues.variantId, variantId))
  return buildSpecs(
    productSku,
    rows.map((r) => ({
      code: r.code,
      name: localized(r.name, 'fr', r.code),
      value: r.value,
      label: localized(r.label, 'fr', r.value),
    }))
  )
}

// ── Mode 1: mint a batch of tokens (status = minted) ──
export type BatchResult =
  | { ok: true; units: { token: string; url: string }[] }
  | { ok: false; error: string }

export async function generateBatch(quantity: number): Promise<BatchResult> {
  await requireAdmin()
  const n = Math.trunc(Number(quantity))
  if (!Number.isFinite(n) || n < 1) return { ok: false, error: 'Quantité invalide.' }
  const qty = Math.min(500, n)

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
  if (!input.variantId) return { ok: false, error: 'Variante requise.' }
  const info = await variantInfo(input.variantId)
  if (info?.kind !== 'board') return { ok: false, error: 'Variante non-board.' }
  const specs = await variantSpecs(info.sku, input.variantId)

  // Blank serial → auto-generate "SN-<model>-<year>-<seq>". Retry on a concurrent
  // collision (the unique index rejects the duplicate); a manual serial never retries.
  const manual = input.serial?.trim()
  for (let attempt = 0; attempt < 5; attempt++) {
    const serial = manual || (await nextSerial(info.sku))
    try {
      if (input.tokenMode === 'existing') {
        if (!input.existingUnitId) return { ok: false, error: 'Token manquant.' }
        await db
          .update(units)
          .set({ variantId: input.variantId, serial, specs, status: 'provisioned' })
          .where(eq(units.id, input.existingUnitId))
      } else {
        await db
          .insert(units)
          .values({ token: newToken(), variantId: input.variantId, serial, specs, status: 'provisioned' })
      }
      revalidatePath('/admin/units')
      return { ok: true }
    } catch (e) {
      if (isDupSerial(e)) {
        if (manual) return { ok: false, error: 'Cette série est déjà utilisée.' }
        continue // auto-generated serial collided — recompute and retry
      }
      return { ok: false, error: 'Échec de l’enregistrement.' }
    }
  }
  return { ok: false, error: 'Génération de série épuisée, réessaie.' }
}

// Assign or edit a unit's board variant + serial. A minted tag becomes provisioned
// on its first assignment; an already-assigned/registered unit keeps its status.
export async function updateUnit(
  unitId: string,
  variantId: string,
  serial: string
): Promise<AssignResult> {
  await requireAdmin()
  if (!unitId || !variantId) return { ok: false, error: 'Variante requise.' }
  const info = await variantInfo(variantId)
  if (info?.kind !== 'board') return { ok: false, error: 'Variante non-board.' }

  const [u] = await db.select({ status: units.status }).from(units).where(eq(units.id, unitId)).limit(1)
  if (!u) return { ok: false, error: 'Unité introuvable.' }
  const status = u.status === 'minted' ? 'provisioned' : u.status
  const specs = await variantSpecs(info.sku, variantId)

  // Blank serial → auto-generate (e.g. assigning a minted tag). Same retry as addUnit.
  const manual = serial?.trim()
  for (let attempt = 0; attempt < 5; attempt++) {
    const s = manual || (await nextSerial(info.sku))
    try {
      await db.update(units).set({ variantId, serial: s, specs, status }).where(eq(units.id, unitId))
      revalidatePath('/admin/units')
      return { ok: true }
    } catch (e) {
      if (isDupSerial(e)) {
        if (manual) return { ok: false, error: 'Cette série est déjà utilisée.' }
        continue
      }
      return { ok: false, error: 'Échec de l’enregistrement.' }
    }
  }
  return { ok: false, error: 'Génération de série épuisée, réessaie.' }
}

// ── Delete units (single or bulk) ──
// Irreversible. The FK onDelete rules cascade the delete to each unit's
// registrations, claims and transfers — so deleting a *registered* unit also
// removes the owner's board and its history. Admin-only.
export type DeleteResult = { ok: true; count: number } | { ok: false; error: string }

export async function deleteUnits(ids: string[]): Promise<DeleteResult> {
  await requireAdmin()
  const unique = [...new Set((ids ?? []).filter((id): id is string => typeof id === 'string' && id.length > 0))]
  if (unique.length === 0) return { ok: false, error: 'Aucune unité sélectionnée.' }

  try {
    const deleted = await db.delete(units).where(inArray(units.id, unique)).returning({ id: units.id })
    revalidatePath('/admin/units')
    return { ok: true, count: deleted.length }
  } catch {
    return { ok: false, error: 'Échec de la suppression.' }
  }
}

// ── One-time backfill: snapshot specs for units assigned before this shipped ──
// Fills only NULL specs, from each unit's current variant axes, so it's safe to
// run again. New assignments already capture specs in addUnit/updateUnit.
export type BackfillResult = { ok: true; updated: number } | { ok: false; error: string }

export async function backfillUnitSpecs(): Promise<BackfillResult> {
  await requireAdmin()
  const rows = await db
    .select({ id: units.id, variantId: units.variantId, sku: products.sku })
    .from(units)
    .innerJoin(variants, eq(variants.id, units.variantId))
    .innerJoin(products, eq(products.id, variants.productId))
    .where(sql`${units.specs} is null`)

  let updated = 0
  for (const r of rows) {
    if (!r.variantId) continue
    const specs = await variantSpecs(r.sku, r.variantId)
    await db.update(units).set({ specs }).where(eq(units.id, r.id))
    updated++
  }
  revalidatePath('/admin/units')
  return { ok: true, updated }
}

// ── CSV export of the full registry ──
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
