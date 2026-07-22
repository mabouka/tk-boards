'use client'

import { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import type { StorefrontProduct } from '@/lib/storefront/product'
import { formatEur } from '@/lib/format-price'
import { useDrawer } from '@/lib/use-drawer'
import { useCart } from '@/lib/use-cart'
import { lineFromVariant } from '@/components/commerce/cart/cartLine'
import { useBuyNow } from '@/components/commerce/cart/useBuyNow'
import { useVariantSelection } from './useVariantSelection'
import styles from './Configurator.module.css'

export type ConfiguratorLabels = {
  buy: string
  cart: string
  configure: string
  from: string
  close: string
}

type Props = {
  product: StorefrontProduct
  locale: string
  labels: ConfiguratorLabels
  productName: string
  previewImage?: string | null
  open: boolean
  onClose: () => void
}

export default function Configurator({
  product,
  locale,
  labels,
  productName,
  previewImage,
  open,
  onClose,
}: Props) {
  const { selected, isAvailable, resolved, pick, canBuy, displayPrice, oldPrice } =
    useVariantSelection(product, { allowDeselect: true })
  const { addItem } = useCart()
  const { buyNow, pending } = useBuyNow(locale)
  // Portal target only exists on the client — false during SSR/hydration, true
  // after, without a setState-in-effect.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  useDrawer(open, onClose)

  function handleAdd() {
    if (!resolved) return
    addItem(lineFromVariant(product, resolved, selected, productName, previewImage ?? ''))
    onClose()
  }

  function handleBuy() {
    if (resolved) buyNow(resolved.sku)
  }

  if (!mounted) return null

  return createPortal(
    <>
      <div
        className={`${styles.backdrop} ${open ? styles.backdropOpen : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {previewImage && (
        <div className={`${styles.preview} ${open ? styles.previewOpen : ''}`} aria-hidden="true">
          {open && (
            <div className={styles.previewFrame}>
              <Image
                src={previewImage}
                alt=""
                fill
                sizes="(max-width: 768px) 0px, 800px"
                style={{ objectFit: 'contain' }}
              />
            </div>
          )}
        </div>
      )}
      <aside
        className={`${styles.panel} ${open ? styles.panelOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={labels.configure}
        aria-hidden={!open}
      >
        <div className={styles.header}>
          <span className={styles.title}>{labels.configure}</span>
          <button type="button" className={styles.close} onClick={onClose} aria-label={labels.close}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

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

        <div className={styles.footer}>
          {displayPrice != null && (
            <p className={styles.price}>
              {!resolved && <span className={styles.priceFrom}>{labels.from}</span>}
              {formatEur(displayPrice, locale)}
              {oldPrice != null && <span className={styles.priceOld}>{formatEur(oldPrice, locale)}</span>}
            </p>
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
        </div>
      </aside>
    </>,
    document.body
  )
}
