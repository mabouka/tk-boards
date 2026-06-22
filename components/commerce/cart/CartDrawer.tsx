'use client'

import CartModal from './CartModal'
import { useCart } from './CartContext'

/** Connects the cart context to the presentational <CartModal /> overlay. */
export default function CartDrawer({ locale }: { locale: string }) {
  const { open, items, setOpen, setQty, removeItem } = useCart()

  if (!open) return null

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
    />
  )
}
