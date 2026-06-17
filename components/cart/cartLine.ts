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

  return {
    id: variant.sku,
    name,
    attributes,
    imageUrl,
    price: variant.salePrice ?? variant.price,
    oldPrice: variant.salePrice != null ? variant.price : undefined,
    qty: 1,
  }
}
