import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'

// Exit preview: clear the draft-mode cookie and return to the given path (or home).
export async function GET(request: Request) {
  ;(await draftMode()).disable()
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug')
  // Same-origin path only: reject protocol-relative ("//evil.com") and "/\" → open redirect.
  const safe = slug && /^\/(?![/\\])/.test(slug) ? slug : '/'
  return NextResponse.redirect(new URL(safe, url.origin))
}
