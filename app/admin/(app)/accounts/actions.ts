'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { users } from '@/db/schema'
import { requireAdmin } from '@/lib/require-admin'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export type RoleResult = { ok: true } | { ok: false; error: string }

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
