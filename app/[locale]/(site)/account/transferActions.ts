'use server'

import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { units, variants, products, registrations, transfers, users } from '@/db/schema'
import { liveSession } from '@/lib/session'
import { writeAtomically } from '@/lib/db-write'
import { EMAIL_RE } from '@/lib/email-validation'
import { rateLimit } from '@/lib/rate-limit'
import { createTransfer, getPendingTransfer } from '@/lib/transfers'
import { sendTransferEmail } from '@/lib/email'
import { getVariantAttributes } from '@/lib/tk-id'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { urlFor } from '@/sanity/lib/image'
import { boardImageBySkuQuery } from '@/sanity/lib/queries'

const LOCALES = ['fr', 'en', 'es']
const loc = (v: FormDataEntryValue | null) => (LOCALES.includes(String(v)) ? String(v) : 'en')

export type TransferState = { ok?: boolean; error?: string } | null

// The unit + its board fields, only if `userId` is its active owner.
async function ownedUnit(token: string, userId: string) {
  const [u] = await db
    .select({
      id: units.id,
      serial: units.serial,
      variantId: units.variantId,
      name: products.name,
      sku: products.sku,
    })
    .from(units)
    .leftJoin(variants, eq(variants.id, units.variantId))
    .leftJoin(products, eq(products.id, variants.productId))
    .where(eq(units.token, token))
    .limit(1)
  if (!u) return null
  const [reg] = await db
    .select({ userId: registrations.userId })
    .from(registrations)
    .where(and(eq(registrations.unitId, u.id), eq(registrations.status, 'active')))
    .limit(1)
  return reg && reg.userId === userId
    ? { unitId: u.id, boardName: u.name, serial: u.serial, sku: u.sku, variantId: u.variantId }
    : null
}

// Owner invites an email to receive a board. Emails a tokenised accept link.
export async function initiateTransfer(_prev: TransferState, formData: FormData): Promise<TransferState> {
  const locale = loc(formData.get('locale'))
  const token = String(formData.get('token') ?? '')
  const email = String(formData.get('email') ?? '').trim().toLowerCase().slice(0, 200)

  const s = await liveSession()
  if (!s) return { error: 'auth' }
  if (!EMAIL_RE.test(email)) return { error: 'invalid' }
  if (!(await rateLimit('transfer-user', s.userId, 10, 3600))) return { error: 'rate' }

  const owned = await ownedUnit(token, s.userId)
  if (!owned) return { error: 'notowner' }

  // Board card for the email: photo (Sanity, by parent SKU) + variant axes.
  const [board, attributes] = await Promise.all([
    owned.sku
      ? client.fetch(boardImageBySkuQuery, { sku: owned.sku, locale }, sanityCache('board'))
      : Promise.resolve(null),
    owned.variantId ? getVariantAttributes(owned.variantId, locale) : Promise.resolve([]),
  ])
  const photoUrl = board?.mainImage
    ? urlFor(board.mainImage).width(800).quality(80).auto('format').url()
    : null

  try {
    const raw = await createTransfer(owned.unitId, s.userId, email)
    await sendTransferEmail({
      to: email,
      locale,
      boardName: owned.boardName,
      serial: owned.serial,
      photoUrl,
      attributes,
      token: raw,
    })
  } catch {
    return { error: 'send' }
  }
  return { ok: true }
}

// Recipient accepts: the current active registration is retired and a new active
// one is created for them. Only the invited email (logged in) may accept.
export async function acceptTransfer(formData: FormData) {
  const locale = loc(formData.get('locale'))
  const rawToken = String(formData.get('token') ?? '')
  const back = `/${locale}/transfer?token=${encodeURIComponent(rawToken)}`

  const s = await liveSession()
  if (!s) redirect(`/${locale}/login?callbackUrl=${encodeURIComponent(back)}`)

  const transfer = await getPendingTransfer(rawToken)
  if (!transfer) redirect(`${back}&status=invalid`)

  const [me] = await db.select({ email: users.email }).from(users).where(eq(users.id, s.userId)).limit(1)
  if (!me || me.email.toLowerCase() !== transfer.toEmail) redirect(`${back}&status=wrongemail`)

  // The invite is only valid while its initiator is STILL the active owner —
  // otherwise a stale link (ownership changed since it was sent) could retire
  // whoever owns the board now.
  const [current] = await db
    .select({ userId: registrations.userId })
    .from(registrations)
    .where(and(eq(registrations.unitId, transfer.unitId), eq(registrations.status, 'active')))
    .limit(1)
  if (!current || current.userId !== transfer.fromUserId) redirect(`${back}&status=invalid`)

  // Retire the current owner's registration, register the board to the recipient,
  // close the transfer, and expire any other pending invite for this unit so a
  // former owner's outstanding link can never fire against the new owner.
  //
  // All four as one unit. Run sequentially, a failure after the first — a serverless
  // timeout, a deploy, a Neon hiccup — would leave the board with no active
  // registration at all: owned by nobody, so neither party could transfer it or
  // report it lost, and TK-ID would show it as unregistered.
  await writeAtomically(db, (tx) => [
    tx
      .update(registrations)
      .set({ status: 'transferred' })
      .where(and(eq(registrations.unitId, transfer.unitId), eq(registrations.status, 'active'))),
    tx.insert(registrations).values({ userId: s.userId, unitId: transfer.unitId, status: 'active' }),
    tx.update(transfers).set({ status: 'accepted' }).where(eq(transfers.id, transfer.id)),
    tx
      .update(transfers)
      .set({ status: 'expired' })
      .where(and(eq(transfers.unitId, transfer.unitId), eq(transfers.status, 'pending'))),
  ])

  redirect(`/${locale}/account?transfer=done`)
}
