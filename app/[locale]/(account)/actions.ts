'use server'

import { signOut as authSignOut } from '@/auth'

const LOCALES = ['fr', 'en', 'es'] as const

export async function signOut(formData: FormData) {
  const raw = String(formData.get('locale') ?? '')
  const locale = (LOCALES as readonly string[]).includes(raw) ? raw : 'en'
  await authSignOut({ redirectTo: `/${locale}/login` })
}
