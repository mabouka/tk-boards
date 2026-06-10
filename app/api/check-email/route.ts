import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users, accounts } from '@/db/schema'
import { rateLimit } from '@/lib/rate-limit'
import { clientIp } from '@/lib/client-ip'

/**
 * Email-first flow: does an account exist, and how does it sign in?
 * Returns whether it has a password and which OAuth providers are linked,
 * so the UI shows the password form or the right social button.
 */
export async function POST(request: Request) {
  let email = ''
  try {
    const body = await request.json()
    email = String(body?.email ?? '').trim().toLowerCase()
  } catch {
    // ignore
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ exists: false, hasPassword: false, providers: [] }, { status: 400 })
  }

  const ip = await clientIp()
  if (!(await rateLimit('check-email', ip, 30, 60))) {
    return NextResponse.json(
      { exists: false, hasPassword: false, providers: [], error: 'rate' },
      { status: 429 }
    )
  }

  const [u] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!u) {
    return NextResponse.json({ exists: false, hasPassword: false, providers: [] })
  }

  const linked = await db
    .select({ provider: accounts.provider })
    .from(accounts)
    .where(eq(accounts.userId, u.id))

  return NextResponse.json({
    exists: true,
    hasPassword: Boolean(u.passwordHash),
    providers: linked.map((a) => a.provider),
  })
}
