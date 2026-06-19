import type { StorefrontProduct, StorefrontVariant } from '@/lib/storefront/product'
import type { CartLine } from './CartModal'

/**
 * Build a cart line from a resolved variant + the selected combo. The variant
 * SKU is the line `id` (so re-adding the same variant bumps its qty), and the
 * selected axes become human-readable attributes ("Taille : 5'10\"", "Couleur : Rouge").
 */
export function lineFromVariant(
  product: StorefrontProduct,
  variant: StorefrontVariant,
  selected: Record<string, string>,
  name: string,
  imageUrl: string
): CartLine {
  const attributes = product.attributes
    .map((a) => {
      const val = a.values.find((v) => v.code === selected[a.code])
      return val ? `${a.name} : ${val.label}` : null
    })
    .filter((x): x is string => x !== null)

  // Variant SKU is the dedup key; fall back to a combo key when a variant has a
  // blank/missing SKU so distinct configurations don't collapse into one line.
  const comboKey = product.attributes.map((a) => `${a.code}:${selected[a.code] ?? ''}`).join('|')
  const id = variant.sku && variant.sku.trim() ? variant.sku : `${product.sku}|${comboKey}`

  return {
    id,
    name,
    attributes,
    imageUrl,
    price: variant.salePrice ?? variant.price,
    oldPrice: variant.salePrice != null ? variant.price : undefined,
    qty: 1,
    maxQty: variant.stock,
  }
}
