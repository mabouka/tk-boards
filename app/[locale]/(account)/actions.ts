'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const LOCALES = ['fr', 'en', 'es'] as const
type Locale = (typeof LOCALES)[number]

export async function signOut(formData: FormData) {
  const raw = formData.get('locale')
  const locale: Locale = LOCALES.includes(raw as Locale) ? (raw as Locale) : 'en'

  const supabase = await createClient()
  await supabase.auth.signOut()

  redirect(`/${locale}/login`)
}
