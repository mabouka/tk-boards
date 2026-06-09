'use server'

import { AuthError } from 'next-auth'
import { signIn } from '@/auth'

export type LoginState = { error?: string } | null

export async function adminLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').toLowerCase().trim()
  const password = String(formData.get('password') ?? '')
  try {
    await signIn('credentials', { email, password, redirectTo: '/admin' })
  } catch (error) {
    if (error instanceof AuthError) return { error: 'Identifiants invalides.' }
    throw error // re-throw the success redirect
  }
  return null
}

export async function adminGoogle() {
  await signIn('google', { redirectTo: '/admin' })
}
