'use client'

import { useState } from 'react'
import type { StorefrontProduct } from '@/lib/storefront/product'
import { formatEur } from '@/lib/format-price'
import { useCart } from '@/lib/use-cart'
import Configurator, { type ConfiguratorLabels } from './Configurator'
import styles from './BuyCta.module.css'

type Props = {
  product: StorefrontProduct | null
  locale: string
  labels: ConfiguratorLabels
  previewImage?: string | null
}

export default function BuyCta({ product, locale, labels, previewImage }: Props) {
  const [open, setOpen] = useState(false)
  const { addToCart, justAdded } = useCart()

  // Board has a skuCode but no linked product in the admin yet → plain (stubbed) buttons, no price.
  if (!product) {
    return (
      <div className={styles.cta}>
        <div className={styles.btnRow}>
          <button type="button" className="u-cta u-cta--white-fill" onClick={() => addToCart('—')}>
            {labels.buy}
          </button>
          <button type="button" className="u-cta u-cta--white-outline" onClick={() => addToCart('—')}>
            {labels.cart}
          </button>
        </div>
        {justAdded && <p className={styles.note}>{labels.cartStub}</p>}
      </div>
    )
  }

  // Has option axes → single "Configure" that opens the drawer.
  if (product.hasVariants) {
    return (
      <div className={styles.cta}>
        {product.fromPrice != null && (
          <p className={styles.price}>
            <span className={styles.priceFrom}>{labels.from}</span>
            {formatEur(product.fromPrice, locale)}
          </p>
        )}
        <div className={styles.btnRow}>
          <button type="button" className="u-cta u-cta--white-fill" onClick={() => setOpen(true)}>
            {labels.configure}
          </button>
        </div>
        <Configurator
          product={product}
          locale={locale}
          labels={labels}
          previewImage={previewImage}
          open={open}
          onClose={() => setOpen(false)}
        />
      </div>
    )
  }

  // Unique product (one variant, no axes) → direct buy/cart.
  const variant = product.variants[0]
  const price = variant ? (variant.salePrice ?? variant.price) : null
  return (
    <div className={styles.cta}>
      {price != null && <p className={styles.price}>{formatEur(price, locale)}</p>}
      <div className={styles.btnRow}>
        <button
          type="button"
          className="u-cta u-cta--white-fill"
          disabled={!variant}
          onClick={() => variant && addToCart(variant.sku)}
        >
          {labels.buy}
        </button>
        <button
          type="button"
          className="u-cta u-cta--white-outline"
          disabled={!variant}
          onClick={() => variant && addToCart(variant.sku)}
        >
          {labels.cart}
        </button>
      </div>
      {justAdded && <p className={styles.note}>{labels.cartStub}</p>}
    </div>
  )
}
