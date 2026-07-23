import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { sanityCache } from '@/sanity/lib/fetch'
import { productImagesBySkuQuery } from '@/sanity/lib/queries'
import type { SanityImageSource } from '@sanity/image-url'

/** Retina-sized box the picture is scaled to fit inside. Deliberately not cropped:
 *  a board is long and narrow, and a square crop of one shows nothing but colour. */
const THUMB_PX = 160

/**
 * Product picture URLs, keyed by product SKU (`order_line.product_sku`, which is
 * the Sanity `skuCode`).
 *
 * Resolved at render time rather than frozen onto the line: the photo is
 * illustrative, not part of the record of the sale, and looking it up live means
 * a re-shoot shows everywhere without a migration. The trade-off is that a
 * product deleted from Sanity loses its thumbnail on past orders — callers must
 * handle a missing entry, which is why the line text stands on its own.
 *
 * Which translation of a product supplies the picture is decided by the query, not
 * here — the same rule the TK-ID board photo uses (sanity/lib/queries.ts).
 *
 * No alt text: every call site prints the product name right beside the picture,
 * so an alt would just be announced twice.
 */
export async function productThumbnails(
  productSkus: string[],
  locale: string
): Promise<Map<string, string>> {
  const wanted = [...new Set(productSkus.filter(Boolean))]
  if (wanted.length === 0) return new Map()

  let docs: Awaited<ReturnType<typeof fetchDocs>>
  try {
    docs = await fetchDocs(wanted, locale)
  } catch {
    return new Map() // decorative: never take an order page down over a picture
  }
  return firstPerSku(docs)
}

type ImageDoc = { skuCode: string | null; mainImage?: { asset?: unknown } | null }

/** One URL per SKU. The query returns the reader's language first, so the first row
 *  for a SKU is the one to keep; later rows are that SKU's other translations. */
export function firstPerSku(docs: ImageDoc[]): Map<string, string> {
  const out = new Map<string, string>()
  for (const doc of docs) {
    const sku = doc.skuCode
    if (!sku || out.has(sku) || !doc.mainImage?.asset) continue
    out.set(
      sku,
      urlFor(doc.mainImage as SanityImageSource)
        .width(THUMB_PX)
        .height(THUMB_PX)
        .fit('max')
        .auto('format')
        .url()
    )
  }
  return out
}

const fetchDocs = (skus: string[], locale: string) =>
  client.fetch(productImagesBySkuQuery, { skus, locale }, sanityCache('board', 'accessory'))
