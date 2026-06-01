import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

// Flip to false (or remove) to take the site live.
const UNDER_CONSTRUCTION = true;
export default function proxy(request: NextRequest) {
  if (UNDER_CONSTRUCTION) {
    // Serve the holding page for every public route, but keep the page itself
    // reachable (and let the matcher already exclude /studio, /api and assets).
    if (request.nextUrl.pathname !== '/construction') {
      return NextResponse.rewrite(new URL('/construction', request.url))
    }
    return NextResponse.next()
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!_next|studio|api|.*\\..*).*)'],
}
