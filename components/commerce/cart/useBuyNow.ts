'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { createCheckoutSession } from '@/app/[locale]/(site)/checkout/actions'

/** "Buy now": skip the cart and go straight to a one-item Stripe Checkout. */
export function useBuyNow(locale: string) {
  const t = useTranslations('cart')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  const buyNow = (sku: string, qty = 1) => {
    if (!sku) return
    setError(undefined)
    startTransition(async () => {
      const res = await createCheckoutSession([{ sku, qty }], locale)
      if (res.url) {
        window.location.href = res.url
        return
      }
      setError(
        t(
          res.error === 'stock'
            ? 'checkout_err_stock'
            : res.error === 'unavailable'
              ? 'checkout_err_unavailable'
              : 'checkout_err_generic'
        )
      )
    })
  }

  return { buyNow, pending, error }
}
