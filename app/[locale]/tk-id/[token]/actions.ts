'use server'

import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { db } from '@/db'
import { units, registrations } from '@/db/schema'

const LOCALES = ['fr', 'en', 'es']
const loc = (v: FormDataEntryValue | null) =>
  LOCALES.includes(String(v)) ? String(v) : 'en'

// Register a provisioned board to the current user (first-tap-wins).
export async function registerBoard(formData: FormData) {
  const locale = loc(formData.get('locale'))
  const token = String(formData.get('token') ?? '')
  const session = await auth()
  if (!session?.user?.id) redirect(`/${locale}/login`)
  if (!token) redirect(`/${locale}`)

  const [u] = await db
    .select({ id: units.id, status: units.status, variantId: units.variantId })
    .from(units)
    .where(eq(units.token, token))
    .limit(1)

  if (u && u.variantId && u.status === 'provisioned') {
    try {
      // The partial unique index (one active reg per unit) enforces first-tap-wins.
      await db.insert(registrations).values({ userId: session.user.id, unitId: u.id, status: 'active' })
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
  const session = await auth()
  if (!session?.user?.id) redirect(`/${locale}/login`)

  const unitId = await ownerGuard(token, session.user.id)
  if (unitId) await db.update(units).set({ status: 'stolen' }).where(eq(units.id, unitId))
  redirect(`/${locale}/tk-id/${token}`)
}

export async function markRecovered(formData: FormData) {
  const locale = loc(formData.get('locale'))
  const token = String(formData.get('token') ?? '')
  const session = await auth()
  if (!session?.user?.id) redirect(`/${locale}/login`)

  const unitId = await ownerGuard(token, session.user.id)
  if (unitId) await db.update(units).set({ status: 'registered' }).where(eq(units.id, unitId))
  redirect(`/${locale}/tk-id/${token}`)
}
