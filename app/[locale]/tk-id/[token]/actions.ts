'use server'

import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { db } from '@/db'
import { units, registrations, users } from '@/db/schema'

const LOCALES = ['fr', 'en', 'es']
const loc = (v: FormDataEntryValue | null) =>
  LOCALES.includes(String(v)) ? String(v) : 'en'

// Send unauthenticated tappers to login, then back to this tag (not /account).
const loginUrl = (locale: string, token: string) =>
  `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/tk-id/${token}`)}`

// Current user id, but only if the session is still live: a password reset /
// logout-everywhere bumps tokenVersion and must invalidate older JWTs here too.
async function liveUserId(): Promise<string | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const [u] = await db
    .select({ tokenVersion: users.tokenVersion })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)
  if (!u || (u.tokenVersion ?? 0) !== (session.user.tokenVersion ?? 0)) return null
  return session.user.id
}

// Register a provisioned board to the current user (first-tap-wins).
export async function registerBoard(formData: FormData) {
  const locale = loc(formData.get('locale'))
  const token = String(formData.get('token') ?? '')
  if (!token) redirect(`/${locale}`)
  const userId = await liveUserId()
  if (!userId) redirect(loginUrl(locale, token))

  const [u] = await db
    .select({ id: units.id, status: units.status, variantId: units.variantId })
    .from(units)
    .where(eq(units.token, token))
    .limit(1)

  if (u && u.variantId && u.status === 'provisioned') {
    try {
      // The partial unique index (one active reg per unit) enforces first-tap-wins.
      await db.insert(registrations).values({ userId, unitId: u.id, status: 'active' })
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
  const userId = await liveUserId()
  if (!userId) redirect(loginUrl(locale, token))

  const unitId = await ownerGuard(token, userId)
  if (unitId) await db.update(units).set({ status: 'stolen' }).where(eq(units.id, unitId))
  redirect(`/${locale}/tk-id/${token}`)
}

export async function markRecovered(formData: FormData) {
  const locale = loc(formData.get('locale'))
  const token = String(formData.get('token') ?? '')
  const userId = await liveUserId()
  if (!userId) redirect(loginUrl(locale, token))

  const unitId = await ownerGuard(token, userId)
  if (unitId) await db.update(units).set({ status: 'registered' }).where(eq(units.id, unitId))
  redirect(`/${locale}/tk-id/${token}`)
}
