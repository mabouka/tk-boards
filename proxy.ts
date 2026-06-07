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

export default function proxy(request: NextRequest) {
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

    // 2. Holders of a valid bypass cookie see the real, localized site.
    if (PREVIEW_SECRET && request.cookies.get(BYPASS_COOKIE)?.value === PREVIEW_SECRET) {
      return intlMiddleware(request)
    }

    // 3. Everyone else gets the holding page (matcher already excludes
    //    /studio, /api and assets).
    if (pathname !== '/construction') {
      return NextResponse.rewrite(new URL('/construction', request.url))
    }
    return NextResponse.next()
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!_next|studio|api|.*\\..*).*)'],
}
