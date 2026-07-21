'use server'

import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { units, registrations, users, variants, products } from '@/db/schema'
import { liveSession } from '@/lib/session'
import { EMAIL_RE } from '@/lib/email-validation'
import { rateLimit } from '@/lib/rate-limit'
import { clientIp } from '@/lib/client-ip'
import { sendFoundBoardEmail } from '@/lib/email'
import { getVariantAttributes } from '@/lib/tk-id'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { urlFor } from '@/sanity/lib/image'
import { boardImageBySkuQuery } from '@/sanity/lib/queries'

const LOCALES = ['fr', 'en', 'es']
const loc = (v: FormDataEntryValue | null) =>
  LOCALES.includes(String(v)) ? String(v) : 'en'

// Send unauthenticated tappers to login, then back to this tag (not /account).
const loginUrl = (locale: string, token: string) =>
  `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/tk-id/${token}`)}`

// Register a provisioned board to the current user (first-tap-wins).
export async function registerBoard(formData: FormData) {
  const locale = loc(formData.get('locale'))
  const token = String(formData.get('token') ?? '')
  if (!token) redirect(`/${locale}`)
  const s = await liveSession()
  if (!s) redirect(loginUrl(locale, token))

  const [u] = await db
    .select({ id: units.id, status: units.status, variantId: units.variantId })
    .from(units)
    .where(eq(units.token, token))
    .limit(1)

  if (u && u.variantId && u.status === 'provisioned') {
    try {
      // The partial unique index (one active reg per unit) enforces first-tap-wins.
      await db.insert(registrations).values({ userId: s.userId, unitId: u.id, status: 'active' })
      await db.update(units).set({ status: 'registered' }).where(eq(units.id, u.id))
    } catch {
      // Already registered by someone else — fall through and re-render the state.
    }
  }
  redirect(`/${locale}/tk-id/${token}`)
}

async function ownerGuard(token: string, userId: string) {
  const [u] = await db
    .select({ id: units.id })
    .from(units)
    .where(eq(units.token, token))
    .limit(1)
  if (!u) return null
  const [reg] = await db
    .select({ id: registrations.id, userId: registrations.userId })
    .from(registrations)
    .where(and(eq(registrations.unitId, u.id), eq(registrations.status, 'active')))
    .limit(1)
  return reg && reg.userId === userId ? u.id : null
}

export async function declareStolen(formData: FormData) {
  const locale = loc(formData.get('locale'))
  const token = String(formData.get('token') ?? '')
  const s = await liveSession()
  if (!s) redirect(loginUrl(locale, token))

  // Owner-provided public contact info for the lost/stolen page. Length-capped;
  // the email is only kept when it's well-formed (avoids a broken mailto: link).
  const note = String(formData.get('note') ?? '').trim().slice(0, 1000)
  const emailRaw = String(formData.get('email') ?? '').trim().slice(0, 200)
  const phone = String(formData.get('phone') ?? '').trim().slice(0, 40)
  const email = EMAIL_RE.test(emailRaw) ? emailRaw : ''

  const unitId = await ownerGuard(token, s.userId)
  if (unitId) {
    await db
      .update(units)
      .set({
        status: 'stolen',
        lostNote: note || null,
        lostEmail: email || null,
        lostPhone: phone || null,
      })
      .where(eq(units.id, unitId))
  }
  redirect(`/${locale}/tk-id/${token}`)
}

export type ContactState = { ok?: boolean; error?: string } | null

// Public "contact the owner" form on a registered (not-yet-lost) board: emails
// the finder's message to the owner. The owner's address is never exposed —
// the finder only supplies their own email as the reply-to.
export async function contactOwner(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const locale = loc(formData.get('locale'))
  const token = String(formData.get('token') ?? '')
  const message = String(formData.get('message') ?? '').trim().slice(0, 2000)
  const email = String(formData.get('email') ?? '').trim().slice(0, 200)
  const phone = String(formData.get('phone') ?? '').trim().slice(0, 40)

  if (!token || message.length < 2 || !EMAIL_RE.test(email)) return { error: 'invalid' }

  const ip = await clientIp()
  if (
    !(await rateLimit('tkid-contact-ip', ip, 3, 3600)) ||
    !(await rateLimit('tkid-contact-token', token, 5, 3600))
  ) {
    return { error: 'rate' }
  }

  const [row] = await db
    .select({
      status: units.status,
      serial: units.serial,
      variantId: units.variantId,
      ownerEmail: users.email,
      ownerLocale: users.locale,
      boardName: products.name,
      productSku: products.sku,
    })
    .from(units)
    .leftJoin(
      registrations,
      and(eq(registrations.unitId, units.id), eq(registrations.status, 'active'))
    )
    .leftJoin(users, eq(users.id, registrations.userId))
    .leftJoin(variants, eq(variants.id, units.variantId))
    .leftJoin(products, eq(products.id, variants.productId))
    .where(eq(units.token, token))
    .limit(1)

  // Any board with a reachable owner — registered or already reported lost/stolen
  // (tel/mail on the lost page are optional, so this stays the reliable channel).
  if (!row?.ownerEmail) return { error: 'unavailable' }

  // Board card for the email: photo (Sanity, by parent SKU) + variant axes
  // (color/size…), resolved in the owner's language.
  const emailLocale = row.ownerLocale || locale
  const [board, attributes] = await Promise.all([
    row.productSku
      ? client.fetch(boardImageBySkuQuery, { sku: row.productSku, locale: emailLocale }, sanityCache('board'))
      : Promise.resolve(null),
    row.variantId ? getVariantAttributes(row.variantId, emailLocale) : Promise.resolve([]),
  ])
  const photoUrl = board?.mainImage
    ? urlFor(board.mainImage).width(800).quality(80).auto('format').url()
    : null

  try {
    await sendFoundBoardEmail({
      to: row.ownerEmail,
      locale: emailLocale,
      boardName: row.boardName ?? null,
      serial: row.serial ?? null,
      photoUrl,
      attributes,
      token,
      message,
      finderEmail: email,
      finderPhone: phone || undefined,
    })
  } catch {
    return { error: 'send' }
  }
  return { ok: true }
}

export async function markRecovered(formData: FormData) {
  const locale = loc(formData.get('locale'))
  const token = String(formData.get('token') ?? '')
  const next = String(formData.get('next') ?? '')
  const s = await liveSession()
  if (!s) redirect(loginUrl(locale, token))

  const unitId = await ownerGuard(token, s.userId)
  if (unitId) {
    await db
      .update(units)
      .set({ status: 'registered', lostNote: null, lostEmail: null, lostPhone: null })
      .where(eq(units.id, unitId))
  }
  // Safe relative redirect (e.g. back to /account), else the TK-ID page.
  redirect(next && /^\/(?![/\\])/.test(next) ? next : `/${locale}/tk-id/${token}`)
}
