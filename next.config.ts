import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  // Isolated build dir for E2E (so `next build` doesn't clobber a running dev server).
  distDir: process.env.NEXT_DIST_DIR || '.next',
  transpilePackages: ['sanity-plugin-media', 'filesize', 'copy-to-clipboard', 'lucide-react'],
  // Keep the optional node-postgres driver (E2E only) out of the bundle; it's
  // required lazily in db/index.ts when DB_DRIVER=pg.
  serverExternalPackages: ['pg'],
  images: {
    qualities: [75, 85, 90],
    // Global Sanity loader → every <Image> is served straight from the Sanity
    // CDN at the right size; no per-image loader prop needed (components stay
    // server components). See sanity/lib/imageLoader.ts.
    loader: 'custom',
    loaderFile: './sanity/lib/imageLoader.ts',
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
}

export default withNextIntl(nextConfig)
