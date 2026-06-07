import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Email-first flow: does an account already exist for this email?
 * Runs server-side with the service-role key (the SQL function is not
 * callable by anon/authenticated). Returns { exists: boolean }.
 */
export async function POST(request: Request) {
  let email = ''
  try {
    const body = await request.json()
    email = String(body?.email ?? '').trim()
  } catch {
    // ignore
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ exists: false }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('email_exists', { p_email: email })

  if (error) {
    return NextResponse.json({ exists: false, error: true }, { status: 500 })
  }

  return NextResponse.json({ exists: Boolean(data) })
}
