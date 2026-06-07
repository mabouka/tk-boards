import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * Auth callback for:
 *  - Google OAuth (PKCE `code`)
 *  - Email sign-up confirmation (also a `code` via emailRedirectTo, or a
 *    `token_hash` + `type` if a custom confirm template is used)
 *
 * On success, redirects to `next` (a locale-prefixed path like /en/account).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/en/account'

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  // Anything else → back to login with an error flag.
  const loginPath = next.startsWith('/') ? `/${next.split('/')[1]}/login` : '/en/login'
  return NextResponse.redirect(`${origin}${loginPath}?error=auth`)
}
