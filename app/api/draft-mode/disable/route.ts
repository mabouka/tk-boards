import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'

// Exit preview: clear the draft-mode cookie and return to the given path (or home).
export async function GET(request: Request) {
  ;(await draftMode()).disable()
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug')
  return NextResponse.redirect(new URL(slug && slug.startsWith('/') ? slug : '/', url.origin))
}
