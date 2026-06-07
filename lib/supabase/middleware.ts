import { createServerClient } from '@supabase/ssr'
import type { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Refreshes the Supabase auth token and writes the rotated cookies onto the
 * response that i18n routing already produced. Composed inside `proxy.ts`.
 *
 * Fail-safe: if the Supabase env vars are not set (e.g. before the project is
 * wired up), it returns the response untouched so the site keeps working.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return response

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // IMPORTANT: do not run other code between createServerClient and getUser().
  // getUser() revalidates the token server-side and triggers the refresh.
  await supabase.auth.getUser()

  return response
}
