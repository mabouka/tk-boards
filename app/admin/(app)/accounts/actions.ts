'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { users, addresses } from '@/db/schema'
import { requireAdmin } from '@/lib/require-admin'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const LOCALES = ['fr', 'en', 'es']

export type RoleResult = { ok: true } | { ok: false; error: string }
type Result = { ok: true } | { ok: false; error: string }

export type AddressInput = {
  company: string
  line1: string
  line2: string
  postalCode: string
  city: string
  country: string
  phone: string
  isDefault: boolean
}

export async function setRole(id: string, role: 'customer' | 'admin'): Promise<RoleResult> {
  const adminId = await requireAdmin()
  if (!id || (role !== 'customer' && role !== 'admin')) {
    return { ok: false, error: 'Requête invalide.' }
  }
  if (id === adminId && role !== 'admin') {
    return { ok: false, error: 'Tu ne peux pas te rétrograder toi-même.' }
  }
  await db.update(users).set({ role }).where(eq(users.id, id))
  revalidatePath('/admin/accounts')
  return { ok: true }
}

export type CreateState = { error?: string; ok?: string } | null

export async function createAccount(_prev: CreateState, formData: FormData): Promise<CreateState> {
  await requireAdmin()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const firstName = String(formData.get('first_name') ?? '').trim()
  const lastName = String(formData.get('last_name') ?? '').trim()
  const role = String(formData.get('role') ?? 'customer')
  const password = String(formData.get('password') ?? '')

  if (!EMAIL_RE.test(email)) return { error: 'Email invalide.' }
  if (role !== 'admin' && role !== 'customer') return { error: 'Rôle invalide.' }
  if (password.length < 8) return { error: 'Mot de passe : 8 caractères minimum.' }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  if (existing) return { error: 'Un compte existe déjà avec cet email.' }

  const passwordHash = await bcrypt.hash(password, 12)
  const name = [firstName, lastName].filter(Boolean).join(' ') || null

  await db.insert(users).values({
    email,
    firstName: firstName || null,
    lastName: lastName || null,
    name,
    passwordHash,
    role,
    onboarded: true,
    emailVerified: new Date(),
  })

  revalidatePath('/admin/accounts')
  return { ok: `Compte créé : ${email} (${role === 'admin' ? 'admin' : 'client'}).` }
}

// ── Account profile (admin edit) ──
export async function updateAccount(
  id: string,
  input: { firstName: string; lastName: string; phone: string; locale: string }
): Promise<Result> {
  await requireAdmin()
  if (!id) return { ok: false, error: 'Compte introuvable.' }
  const firstName = input.firstName.trim() || null
  const lastName = input.lastName.trim() || null
  const name = [firstName, lastName].filter(Boolean).join(' ') || null
  const phone = input.phone.trim() || null
  const locale = LOCALES.includes(input.locale) ? input.locale : 'fr'
  await db.update(users).set({ firstName, lastName, name, phone, locale }).where(eq(users.id, id))
  revalidatePath(`/admin/accounts/${id}`)
  return { ok: true }
}

// ── Addresses (admin CRUD) ──
function addressValues(input: AddressInput) {
  return {
    company: input.company.trim() || null,
    line1: input.line1.trim(),
    line2: input.line2.trim() || null,
    postalCode: input.postalCode.trim() || null,
    city: input.city.trim() || null,
    country: input.country.trim() || null,
    phone: input.phone.trim() || null,
    isDefault: input.isDefault,
  }
}

export async function addAddress(userId: string, input: AddressInput): Promise<Result> {
  await requireAdmin()
  const v = addressValues(input)
  if (!userId || !v.line1) return { ok: false, error: 'Adresse (ligne 1) requise.' }
  // Only one default per user.
  if (v.isDefault) await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId))
  await db.insert(addresses).values({ userId, ...v })
  revalidatePath(`/admin/accounts/${userId}`)
  return { ok: true }
}

export async function updateAddress(
  addressId: string,
  userId: string,
  input: AddressInput
): Promise<Result> {
  await requireAdmin()
  const v = addressValues(input)
  if (!addressId || !v.line1) return { ok: false, error: 'Adresse (ligne 1) requise.' }
  if (v.isDefault) await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId))
  await db
    .update(addresses)
    .set(v)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
  revalidatePath(`/admin/accounts/${userId}`)
  return { ok: true }
}

export async function deleteAddress(addressId: string, userId: string): Promise<Result> {
  await requireAdmin()
  if (!addressId) return { ok: false, error: 'Adresse introuvable.' }
  await db.delete(addresses).where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
  revalidatePath(`/admin/accounts/${userId}`)
  return { ok: true }
}

export async function setDefaultAddress(addressId: string, userId: string): Promise<Result> {
  await requireAdmin()
  if (!addressId || !userId) return { ok: false, error: 'Requête invalide.' }
  // Single atomic statement → exactly one default for this user, no race window.
  await db
    .update(addresses)
    .set({ isDefault: sql`${addresses.id} = ${addressId}` })
    .where(eq(addresses.userId, userId))
  revalidatePath(`/admin/accounts/${userId}`)
  return { ok: true }
}
