'use client'

import Script from 'next/script'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

/**
 * Cloudflare Turnstile widget. Drop it inside a form; the script injects a
 * `cf-turnstile-response` hidden input that the enclosing form submits, which the
 * server hands to `verifyTurnstile`.
 *
 * Renders nothing when no site key is configured — the server side mirrors that
 * (`verifyTurnstile` returns true with no secret), so a local checkout without
 * Cloudflare credentials still works. The pair has to move together: a secret set
 * without a site key means no token is ever produced and every submission is
 * refused.
 */
export default function TurnstileField() {
  if (!SITE_KEY) return null
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div className="cf-turnstile" data-sitekey={SITE_KEY} data-theme="dark" />
    </>
  )
}
