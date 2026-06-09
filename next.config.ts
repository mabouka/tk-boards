import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  transpilePackages: ['sanity-plugin-media', 'filesize', 'copy-to-clipboard', 'lucide-react'],
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
