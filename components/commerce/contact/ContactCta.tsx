'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { StorefrontProduct } from '@/lib/storefront/product'
import { formatEur } from '@/lib/format-price'
import { useEshop } from '@/components/commerce/eshop-context'
import ProductContactModal from './ProductContactModal'
import styles from '@/components/commerce/configurator/BuyCta.module.css'
import axisStyles from './ContactCta.module.css'

/**
 * The buy/cart/configure controls' stand-in when the shop is off (V1). Keeps the
 * price visible — the decision was contact-to-buy, not price-on-request — and
 * offers two ways to reach us: a contact form modal, and WhatsApp pre-filled with
 * the product name.
 */
export default function ContactCta({
  product,
  locale,
  productName,
}: {
  product: StorefrontProduct | null
  locale: string
  productName: string
}) {
  const t = useTranslations('boards')
  const { whatsapp } = useEshop()
  const [open, setOpen] = useState(false)

  // The lowest effective price, prefixed with "from" only when the variants span a
  // range — three sizes all at 150 € read "150 €", not "from 150 €".
  let price: number | null = null
  let isFrom = false
  if (product) {
    const prices = product.variants.map((v) => v.salePrice ?? v.price)
    if (prices.length > 0) {
      const min = Math.min(...prices)
      price = min
      isFrom = Math.max(...prices) !== min
    }
  }

  const waDigits = whatsapp?.replace(/\D/g, '') ?? ''
  const waHref = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(`${productName} — ${t('contact_title')}`)}`
    : null

  return (
    <div className={styles.cta}>
      {price != null && (
        <p className={styles.price}>
          {isFrom && <span className={styles.priceFrom}>{t('from_price')}</span>}
          {formatEur(price, locale)}
        </p>
      )}

      {/* Sizes / colours shown read-only: no picker in contact mode, but the visitor
          still needs to know the options exist before reaching out (e.g. the Board
          Bag's three sizes). */}
      {product && product.attributes.length > 0 && (
        <div className={axisStyles.axes}>
          {product.attributes.map((axis) => (
            <div key={axis.code} className={axisStyles.axis}>
              <span className={axisStyles.axisName}>{axis.name}</span>
              <span className={axisStyles.values}>
                {axis.values.map((v) => (
                  <span key={v.code} className={axisStyles.value}>
                    {v.label}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Labelled like the sizes above, so it's clear these buttons are the way to
          buy — the checkout being off, "buy" here means reach out. */}
      <div className={axisStyles.axis}>
        <span className={axisStyles.axisName}>{t('contact_buy_label')}</span>
        <div className={styles.btnRow}>
          <button type="button" className="u-cta u-cta--white-fill" onClick={() => setOpen(true)}>
            {t('contact_us')}
          </button>
          {waHref && (
            <a className="u-cta u-cta--whatsapp" href={waHref} target="_blank" rel="noopener noreferrer">
              {t('contact_whatsapp')}
            </a>
          )}
        </div>
      </div>
      {open && <ProductContactModal productName={productName} onClose={() => setOpen(false)} />}
    </div>
  )
}
