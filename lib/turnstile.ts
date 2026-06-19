const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Verify a Cloudflare Turnstile token server-side.
 * - No secret configured (e.g. local without env) → skip (returns true).
 * - Missing token while a secret IS set → block (false).
 * - Transient network error (fetch rejects) → fail-open (honeypot + rate-limit
 *   still protect).
 * - HTTP error (non-2xx) or unparseable body → block (false): don't let a bad
 *   siteverify response silently disable the captcha.
 */
export async function verifyTurnstile(token: string | null, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false

  try {
    const body = new URLSearchParams({ secret, response: token })
    if (ip) body.set('remoteip', ip)
    const res = await fetch(VERIFY_URL, { method: 'POST', body })
    if (!res.ok) return false
    const data = (await res.json().catch(() => null)) as { success?: boolean } | null
    return data?.success === true
  } catch {
    return true
  }
}
