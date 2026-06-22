'use client'

import { useState } from 'react'
import type { StorefrontProduct } from '@/lib/storefront/product'
import { formatEur } from '@/lib/format-price'
import { useCart } from '@/lib/use-cart'
import { lineFromVariant } from '@/components/commerce/cart/cartLine'
import Configurator, { type ConfiguratorLabels } from './Configurator'
import MiniConfigurator from './MiniConfigurator'
import styles from './BuyCta.module.css'

type Props = {
  product: StorefrontProduct | null
  locale: string
  labels: ConfiguratorLabels
  productName: string
  previewImage?: string | null
}

export default function BuyCta({ product, locale, labels, productName, previewImage }: Props) {
  const [open, setOpen] = useState(false)
  const { addItem } = useCart()

  // Board has a skuCode but no linked product in the admin yet → placeholder buttons.
  if (!product) {
    return (
      <div className={styles.cta}>
        <div className={styles.btnRow}>
          <button type="button" className="u-cta u-cta--white-fill">{labels.buy}</button>
          <button type="button" className="u-cta u-cta--white-outline">{labels.cart}</button>
        </div>
      </div>
    )
  }

  // Has option axes AND mini configurator enabled → configure ALL axes inline.
  if (product.hasVariants && product.miniConfigurator) {
    return (
      <div className={styles.cta}>
        <MiniConfigurator
          product={product}
          locale={locale}
          labels={labels}
          productName={productName}
          previewImage={previewImage}
        />
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
          productName={productName}
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
  const add = () => {
    if (variant) addItem(lineFromVariant(product, variant, variant.combo, productName, previewImage ?? ''))
  }
  return (
    <div className={styles.cta}>
      {price != null && <p className={styles.price}>{formatEur(price, locale)}</p>}
      <div className={styles.btnRow}>
        <button type="button" className="u-cta u-cta--white-fill" disabled={!variant} onClick={add}>
          {labels.buy}
        </button>
        <button type="button" className="u-cta u-cta--white-outline" disabled={!variant} onClick={add}>
          {labels.cart}
        </button>
      </div>
    </div>
  )
}
