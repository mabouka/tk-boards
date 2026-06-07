'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const LOCALES = ['fr', 'en', 'es'] as const
type Locale = (typeof LOCALES)[number]

function safeLocale(value: FormDataEntryValue | null): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : 'en'
}

export type AuthState = { error?: string; notice?: string } | null

/** Absolute origin of the current request (works in dev and prod). */
async function getOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

// ── Email + password ────────────────────────────────────────────

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = safeLocale(formData.get('locale'))
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: 'invalid' }
  redirect(`/${locale}/account`)
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = safeLocale(formData.get('locale'))
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const password2 = String(formData.get('password2') ?? '')
  const firstName = String(formData.get('first_name') ?? '').trim()
  const lastName = String(formData.get('last_name') ?? '').trim()

  if (password.length < 8 || password !== password2) {
    return { error: 'signup' }
  }

  const origin = await getOrigin()
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: [firstName, lastName].filter(Boolean).join(' '),
        locale,
      },
      emailRedirectTo: `${origin}/api/auth/callback?next=/${locale}/account`,
    },
  })

  if (error) return { error: 'signup' }
  // Email confirmation OFF → session exists → straight into the (gated) account.
  if (data.session) redirect(`/${locale}/account`)
  // Email confirmation ON → ask the user to confirm first.
  return { notice: 'check-email' }
}

// ── OAuth ───────────────────────────────────────────────────────

async function oauth(provider: 'google' | 'facebook', locale: Locale) {
  const origin = await getOrigin()
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/api/auth/callback?next=/${locale}/account` },
  })
  if (error || !data?.url) redirect(`/${locale}/login?error=${provider}`)
  redirect(data.url)
}

export async function signInWithGoogle(formData: FormData) {
  await oauth('google', safeLocale(formData.get('locale')))
}

export async function signInWithFacebook(formData: FormData) {
  await oauth('facebook', safeLocale(formData.get('locale')))
}

// ── Password reset ──────────────────────────────────────────────

export async function requestReset(formData: FormData) {
  const locale = safeLocale(formData.get('locale'))
  const email = String(formData.get('email') ?? '')
  const origin = await getOrigin()

  const supabase = await createClient()
  // Always redirect to the "sent" state, even on error, to avoid leaking
  // which emails exist.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/auth/callback?next=/${locale}/reset-password`,
  })

  redirect(`/${locale}/forgot-password?sent=1`)
}

export async function updatePassword(formData: FormData) {
  const locale = safeLocale(formData.get('locale'))
  const password = String(formData.get('password') ?? '')
  const password2 = String(formData.get('password2') ?? '')

  if (password.length < 8 || password !== password2) {
    redirect(`/${locale}/reset-password?error=1`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) redirect(`/${locale}/reset-password?error=1`)
  redirect(`/${locale}/account`)
}

// ── Onboarding (default delivery address + phone) ───────────────

export async function saveOnboarding(formData: FormData) {
  const locale = safeLocale(formData.get('locale'))
  const line1 = String(formData.get('line1') ?? '').trim()
  const line2 = String(formData.get('line2') ?? '').trim()
  const postal = String(formData.get('postal_code') ?? '').trim()
  const city = String(formData.get('city') ?? '').trim()
  const country = String(formData.get('country') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  if (line1) {
    await supabase.from('addresses').insert({
      user_id: user.id,
      line1,
      line2: line2 || null,
      postal_code: postal || null,
      city: city || null,
      country: country || null,
      phone: phone || null,
      is_default: true,
    })
  }

  await supabase
    .from('profiles')
    .update({ phone: phone || null, onboarded: true })
    .eq('id', user.id)

  redirect(`/${locale}/account`)
}

export async function skipOnboarding(formData: FormData) {
  const locale = safeLocale(formData.get('locale'))
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('profiles').update({ onboarded: true }).eq('id', user.id)
  }
  redirect(`/${locale}/account`)
}
