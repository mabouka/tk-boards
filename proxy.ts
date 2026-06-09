import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

// Flip to false (or remove) to take the site live.
const UNDER_CONSTRUCTION = process.env.NODE_ENV === 'production'

// Staff bypass: visit /preview?key=<PREVIEW_SECRET> once to drop a cookie that
// reveals the real site while everyone else still sees the holding page.
const PREVIEW_SECRET = process.env.PREVIEW_SECRET
const BYPASS_COOKIE = 'preview-bypass'

export default async function proxy(request: NextRequest) {
  if (UNDER_CONSTRUCTION) {
    const { pathname, searchParams } = request.nextUrl

    // 1. Unlock: /preview?key=<secret> sets the bypass cookie, then redirects home.
    if (pathname === '/preview' && PREVIEW_SECRET && searchParams.get('key') === PREVIEW_SECRET) {
      const res = NextResponse.redirect(new URL('/', request.url))
      res.cookies.set(BYPASS_COOKIE, PREVIEW_SECRET, {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
      return res
    }

    // 2. Without a valid bypass cookie, everyone gets the holding page
    //    (matcher already excludes /studio, /api and assets).
    const bypassed =
      PREVIEW_SECRET && request.cookies.get(BYPASS_COOKIE)?.value === PREVIEW_SECRET
    if (!bypassed) {
      if (pathname !== '/construction') {
        return NextResponse.rewrite(new URL('/construction', request.url))
      }
      return NextResponse.next()
    }
    // 3. Bypassed → fall through to the normal (live) handling below.
  }

  // i18n routing (Auth.js uses JWT cookies — no middleware session refresh needed).
  return intlMiddleware(request)
}

export const config = {
  // /admin is excluded: it runs on its own (no i18n, no holding-page rewrite)
  // and is gated by NextAuth instead.
  matcher: ['/((?!_next|studio|api|admin|.*\\..*).*)'],
}
