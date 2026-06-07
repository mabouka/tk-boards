// Global Next.js image loader → serves every <Image> straight from the Sanity
// CDN (no /_next/image), at the requested width, preserving the crop ratio that
// the component baked into the URL via urlFor(...).width(w).height(h).
//
// Wired in next.config.ts (images.loaderFile). Because it's global, components
// don't pass a per-image `loader` prop — so they can stay server components.

type LoaderParams = { src: string; width: number; quality?: number }

// Largest size we ever request from Sanity (matches deviceSizes cap).
const MAX_WIDTH = 1920

export default function sanityImageLoader({ src, width, quality }: LoaderParams): string {
  // Non-Sanity sources (if any) pass through untouched.
  if (!src.includes('cdn.sanity.io')) return src

  const w = Math.min(width, MAX_WIDTH)
  const url = new URL(src)
  const params = url.searchParams

  // If the component requested a crop (both w & h set), keep that aspect ratio
  // while resizing to the new width.
  const baseW = Number(params.get('w'))
  const baseH = Number(params.get('h'))
  if (baseW && baseH) {
    params.set('h', String(Math.round((w * baseH) / baseW)))
    params.set('fit', 'crop')
  }

  params.set('w', String(w))
  // Keep the quality the component asked for (prop > baked-in ?q= > default 75).
  // NB: Number(null) === 0, so guard the absent case explicitly (?? won't catch 0).
  const bakedQ = params.get('q')
  params.set('q', String(quality ?? (bakedQ ? Number(bakedQ) : 75)))
  params.set('auto', 'format')

  url.search = params.toString()
  return url.toString()
}
