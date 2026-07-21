'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import CartModal from './CartModal'
import { useCart } from './CartContext'
import { createCheckoutSession } from '@/app/[locale]/(site)/checkout/actions'

/** Connects the cart context to the presentational <CartModal /> overlay. */
export default function CartDrawer({ locale }: { locale: string }) {
  const { open, items, setOpen, setQty, removeItem } = useCart()
  const t = useTranslations('cart')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  if (!open) return null

  const onCheckout = () => {
    setError(undefined)
    startTransition(async () => {
      const res = await createCheckoutSession(
        items.map((l) => ({ sku: l.id, qty: l.qty })),
        locale
      )
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

  return (
    <CartModal
      lines={items}
      locale={locale}
      onClose={() => setOpen(false)}
      onQty={(id, delta) => {
        const line = items.find((l) => l.id === id)
        if (!line) return
        const next = line.qty + delta
        if (next < 1) removeItem(id)
        else setQty(id, next)
      }}
      onRemove={removeItem}
      onCheckout={onCheckout}
      checkingOut={pending}
      checkoutError={error}
    />
  )
}
