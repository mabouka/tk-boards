'use server'

import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { signIn } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { createEmailToken, consumeEmailToken, applyPasswordReset } from '@/lib/auth-tokens'
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'
import { clientIp } from '@/lib/client-ip'

const LOCALES = ['fr', 'en', 'es'] as const
type Locale = (typeof LOCALES)[number]
function safeLocale(value: FormDataEntryValue | null): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : 'en'
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export type AuthState = { error?: string; notice?: string } | null

// ── Email + password ────────────────────────────────────────────

// Only same-origin relative paths may be a post-login destination (no open redirect).
function safeCallback(raw: FormDataEntryValue | null, fallback: string): string {
  const v = typeof raw === 'string' ? raw : ''
  return /^\/(?![/\\])/.test(v) ? v : fallback
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = safeLocale(formData.get('locale'))
  const email = String(formData.get('email') ?? '').toLowerCase().trim()
  const password = String(formData.get('password') ?? '')
  const callbackUrl = safeCallback(formData.get('callbackUrl'), `/${locale}/account`)

  const ip = await clientIp()
  if (!(await rateLimit('login-ip', ip, 10, 60)) || !(await rateLimit('login-email', email, 5, 60))) {
    return { error: 'rate' }
  }

  // Block password accounts that haven't verified their email yet.
  const [u] = await db
    .select({ passwordHash: users.passwordHash, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  if (u?.passwordHash && !u.emailVerified) return { error: 'unverified' }

  try {
    await signIn('credentials', { email, password, redirectTo: callbackUrl })
  } catch (error) {
    if (error instanceof AuthError) return { error: 'invalid' }
    throw error // re-throw the redirect (success)
  }
  return null
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = safeLocale(formData.get('locale'))
  const email = String(formData.get('email') ?? '').toLowerCase().trim()
  const password = String(formData.get('password') ?? '')
  const password2 = String(formData.get('password2') ?? '')
  const firstName = String(formData.get('first_name') ?? '').trim()
  const lastName = String(formData.get('last_name') ?? '').trim()

  if (!EMAIL_RE.test(email) || password.length < 8 || password !== password2) {
    return { error: 'signup' }
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (existing) return { error: 'exists' }

  const passwordHash = await bcrypt.hash(password, 12)
  const [created] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      firstName: firstName || null,
      lastName: lastName || null,
      name: [firstName, lastName].filter(Boolean).join(' ') || null,
      locale,
    })
    .returning({ id: users.id })

  // No auto-login: send a verification email; the user verifies, then signs in.
  const token = await createEmailToken(created.id, 'verify', 24 * 60)
  await sendVerificationEmail({ to: email, locale, token })
  return { notice: 'check-email' }
}

// Re-send the verification email for an unverified password account.
export async function resendVerification(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = safeLocale(formData.get('locale'))
  const email = String(formData.get('email') ?? '').toLowerCase().trim()
  const ip = await clientIp()
  const allowed =
    (await rateLimit('resend-ip', ip, 5, 900)) && (await rateLimit('resend-email', email, 3, 900))
  if (allowed) {
    const [u] = await db
      .select({ id: users.id, passwordHash: users.passwordHash, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    if (u?.id && u.passwordHash && !u.emailVerified) {
      const token = await createEmailToken(u.id, 'verify', 24 * 60)
      await sendVerificationEmail({ to: email, locale, token })
    }
  }
  return { notice: 'check-email' }
}

// ── Password reset ──────────────────────────────────────────────

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = safeLocale(formData.get('locale'))
  const email = String(formData.get('email') ?? '').toLowerCase().trim()
  const ip = await clientIp()
  const allowed =
    (await rateLimit('forgot-ip', ip, 5, 900)) && (await rateLimit('forgot-email', email, 3, 900))
  if (allowed && EMAIL_RE.test(email)) {
    const [u] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    // Any existing account can set/reset a password here — including a
    // Google-only account that chooses to add password login.
    if (u?.id) {
      const token = await createEmailToken(u.id, 'reset', 60)
      await sendPasswordResetEmail({ to: email, locale, token })
    }
  }
  // Always report success to avoid leaking which emails have an account.
  return { notice: 'reset-sent' }
}

export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = safeLocale(formData.get('locale'))
  const token = String(formData.get('token') ?? '')
  const password = String(formData.get('password') ?? '')
  const password2 = String(formData.get('password2') ?? '')

  if (password.length < 8 || password !== password2) return { error: 'reset' }

  const userId = await consumeEmailToken(token, 'reset')
  if (!userId) return { error: 'reset-invalid' }

  const passwordHash = await bcrypt.hash(password, 12)
  await applyPasswordReset(db, userId, passwordHash)

  redirect(`/${locale}/login?reset=1`)
}

// ── OAuth ───────────────────────────────────────────────────────

export async function signInWithGoogle(formData: FormData) {
  const locale = safeLocale(formData.get('locale'))
  await signIn('google', { redirectTo: `/${locale}/account` })
}

export async function signInWithFacebook(formData: FormData) {
  const locale = safeLocale(formData.get('locale'))
  await signIn('facebook', { redirectTo: `/${locale}/account` })
}

// ── Email verification (confirmed via POST → scanner-safe) ──────

export async function verifyEmail(formData: FormData) {
  const locale = safeLocale(formData.get('locale'))
  const token = String(formData.get('token') ?? '')
  const userId = await consumeEmailToken(token, 'verify')
  if (!userId) redirect(`/${locale}/verify?expired=1`)
  await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, userId))
  redirect(`/${locale}/login?verified=1`)
}
