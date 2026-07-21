'use client'

import type { StorefrontProduct } from '@/lib/storefront/product'
import { formatEur } from '@/lib/format-price'
import { useCart } from '@/lib/use-cart'
import { lineFromVariant } from '@/components/commerce/cart/cartLine'
import { useBuyNow } from '@/components/commerce/cart/useBuyNow'
import { useVariantSelection } from './useVariantSelection'
import type { ConfiguratorLabels } from './Configurator'
import styles from './MiniConfigurator.module.css'

type Props = {
  product: StorefrontProduct
  locale: string
  labels: ConfiguratorLabels
  productName: string
  previewImage?: string | null
}

/**
 * Inline mini configurator: renders one pill row per axis directly on the
 * product page (no drawer), pre-selecting the first value of every axis so a
 * variant resolves immediately, and shows the resolved price + savings with an
 * add-to-cart button. Variant-resolution + availability cascade mirror the
 * drawer Configurator so behaviour stays consistent.
 */
export default function MiniConfigurator({ product, locale, labels, productName, previewImage }: Props) {
  const { selected, isAvailable, resolved, pick, canBuy, displayPrice, oldPrice } =
    useVariantSelection(product)
  const { addItem } = useCart()
  const { buyNow, pending, error } = useBuyNow(locale)
  const savings = oldPrice != null && displayPrice != null ? oldPrice - displayPrice : null

  function handleAdd() {
    if (resolved) addItem(lineFromVariant(product, resolved, selected, productName, previewImage ?? ''))
  }

  function handleBuy() {
    if (resolved) buyNow(resolved.sku)
  }

  return (
    <div className={styles.root}>
      <div className={styles.groups}>
        {product.attributes.map((attr) => (
          <div key={attr.code} className={styles.group}>
            <span className={styles.groupLabel}>{attr.name}</span>
            <div className={styles.values}>
              {attr.values.map((val) => {
                const isSelected = selected[attr.code] === val.code
                const available = isAvailable(attr.code, val.code)
                if (attr.inputType === 'swatch') {
                  return (
                    <button
                      key={val.code}
                      type="button"
                      className={`${styles.swatch} ${isSelected ? styles.swatchSelected : ''}`}
                      style={{ backgroundColor: val.swatchHex ?? 'transparent' }}
                      disabled={!available && !isSelected}
                      onClick={() => pick(attr.code, val.code)}
                      title={val.label}
                      aria-label={val.label}
                      aria-pressed={isSelected}
                    />
                  )
                }
                return (
                  <button
                    key={val.code}
                    type="button"
                    className={`${styles.value} ${isSelected ? styles.valueSelected : ''}`}
                    disabled={!available && !isSelected}
                    onClick={() => pick(attr.code, val.code)}
                    aria-pressed={isSelected}
                  >
                    {val.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {displayPrice != null && (
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatEur(displayPrice, locale)}</span>
          {oldPrice != null && (
            <span className={styles.priceOld}>{formatEur(oldPrice, locale)}</span>
          )}
          {savings != null && savings > 0 && (
            <span className={styles.savings}>− {savings.toLocaleString(locale, { maximumFractionDigits: 2 })}€</span>
          )}
        </div>
      )}

      <div className={styles.btnRow}>
        <button
          type="button"
          className="u-cta u-cta--white-fill"
          disabled={!canBuy || pending}
          onClick={handleBuy}
        >
          {labels.buy}
        </button>
        <button
          type="button"
          className="u-cta u-cta--white-outline"
          disabled={!canBuy}
          onClick={handleAdd}
        >
          {labels.cart}
        </button>
      </div>
      {error && <p className="u-buy-error">{error}</p>}
    </div>
  )
}
