'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { users, addresses } from '@/db/schema'
import { liveSession } from '@/lib/session'
import { signOut as authSignOut } from '@/auth'

const LOCALES = ['fr', 'en', 'es']
const loc = (v: FormDataEntryValue | null) => (LOCALES.includes(String(v)) ? String(v) : 'en')
const str = (v: FormDataEntryValue | null, max = 200) => String(v ?? '').trim().slice(0, max)
const revalidate = (locale: string) => revalidatePath(`/${locale}/account/informations`)

export type FormState = { ok?: boolean; error?: string } | null

// ── Identity ──
export async function updateProfile(_p: FormState, fd: FormData): Promise<FormState> {
  const locale = loc(fd.get('locale'))
  const sess = await liveSession()
  if (!sess) return { error: 'auth' }

  const firstName = str(fd.get('firstName'), 80)
  const lastName = str(fd.get('lastName'), 80)
  const phone = str(fd.get('phone'), 40)
  if (!firstName || !lastName || !phone) return { error: 'invalid' }

  await db
    .update(users)
    .set({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      phone,
    })
    .where(eq(users.id, sess.userId))
  revalidate(locale)
  return { ok: true }
}

// ── Password ──
export async function changePassword(_p: FormState, fd: FormData): Promise<FormState> {
  const sess = await liveSession()
  if (!sess) return { error: 'auth' }
  const current = String(fd.get('current') ?? '')
  const next = String(fd.get('next') ?? '')
  const confirm = String(fd.get('confirm') ?? '')
  if (next.length < 8 || next !== confirm) return { error: 'invalid' }

  const [u] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, sess.userId))
    .limit(1)
  if (!u?.passwordHash) return { error: 'nopassword' }
  if (!(await bcrypt.compare(current, u.passwordHash))) return { error: 'wrongcurrent' }

  await db.update(users).set({ passwordHash: await bcrypt.hash(next, 12) }).where(eq(users.id, sess.userId))
  return { ok: true }
}

// ── Addresses ──
function readAddress(fd: FormData) {
  return {
    label: str(fd.get('label'), 60) || null,
    line1: str(fd.get('line1'), 200),
    line2: str(fd.get('line2'), 200) || null,
    postalCode: str(fd.get('postalCode'), 20) || null,
    city: str(fd.get('city'), 120) || null,
    country: str(fd.get('country'), 120) || null,
    phone: str(fd.get('phone'), 40) || null,
  }
}

export async function addAddress(_p: FormState, fd: FormData): Promise<FormState> {
  const locale = loc(fd.get('locale'))
  const sess = await liveSession()
  if (!sess) return { error: 'auth' }
  const a = readAddress(fd)
  if (!a.line1 || !a.postalCode || !a.city || !a.country) return { error: 'invalid' }

  const existing = await db.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, sess.userId))
  const makeDefault = fd.get('isDefault') != null || existing.length === 0
  if (makeDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, sess.userId))
  }
  await db.insert(addresses).values({ userId: sess.userId, ...a, isDefault: makeDefault })
  revalidate(locale)
  return { ok: true }
}

export async function updateAddress(_p: FormState, fd: FormData): Promise<FormState> {
  const locale = loc(fd.get('locale'))
  const sess = await liveSession()
  if (!sess) return { error: 'auth' }
  const id = str(fd.get('id'), 60)
  const a = readAddress(fd)
  if (!id || !a.line1 || !a.postalCode || !a.city || !a.country) return { error: 'invalid' }
  await db.update(addresses).set(a).where(and(eq(addresses.id, id), eq(addresses.userId, sess.userId)))
  revalidate(locale)
  return { ok: true }
}

export async function deleteAddress(fd: FormData) {
  const locale = loc(fd.get('locale'))
  const sess = await liveSession()
  if (!sess) return
  const id = str(fd.get('id'), 60)
  if (id) await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, sess.userId)))
  revalidate(locale)
}

// ── GDPR: account deletion ──
// Deleting the user row cascades to accounts, sessions, addresses, registrations
// (→ claims) and transfers via the schema's onDelete: 'cascade'. The physical
// units stay; the registrations are freed. Then we sign the (now gone) user out.
export async function deleteAccount(fd: FormData) {
  const locale = loc(fd.get('locale'))
  const sess = await liveSession()
  if (!sess) return
  await db.delete(users).where(eq(users.id, sess.userId))
  await authSignOut({ redirectTo: `/${locale}` })
}

export async function setDefaultAddress(fd: FormData) {
  const locale = loc(fd.get('locale'))
  const sess = await liveSession()
  if (!sess) return
  const id = str(fd.get('id'), 60)
  if (id) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, sess.userId))
    await db
      .update(addresses)
      .set({ isDefault: true })
      .where(and(eq(addresses.id, id), eq(addresses.userId, sess.userId)))
  }
  revalidate(locale)
}
