'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

/** "Buy now": skip the cart and go straight to the checkout page for a single
 *  item (sku carried in the URL). Shipping now needs a destination, so checkout
 *  happens on our page before Stripe — errors surface there, not here. */
export function useBuyNow(locale: string) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const error: string | undefined = undefined

  const buyNow = (sku: string, qty = 1) => {
    if (!sku) return
    const q = qty > 1 ? `${sku}:${qty}` : sku
    startTransition(() => router.push(`/${locale}/checkout?buy=${encodeURIComponent(q)}`))
  }

  return { buyNow, pending, error }
}
