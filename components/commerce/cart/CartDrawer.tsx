'use client'

import { useRouter } from 'next/navigation'
import CartModal from './CartModal'
import { useCart } from './CartContext'

/** Connects the cart context to the presentational <CartModal /> overlay. The
 *  "checkout" button leaves the drawer for the dedicated checkout page (country +
 *  shipping happen there before Stripe). */
export default function CartDrawer({ locale }: { locale: string }) {
  const { open, items, setOpen, setQty, removeItem } = useCart()
  const router = useRouter()

  if (!open) return null

  const onCheckout = () => {
    setOpen(false)
    router.push(`/${locale}/checkout`)
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
    />
  )
}
