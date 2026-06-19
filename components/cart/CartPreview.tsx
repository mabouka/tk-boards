'use client'

import { useState } from 'react'
import CartModal, { type CartLine } from './CartModal'

const MOCK_LINES: CartLine[] = [
  {
    id: '1',
    name: 'Phantom Pro',
    attributes: ['Taille : 157 cm'],
    imageUrl: '/samples/rocket.png',
    price: 1480,
    oldPrice: 1680,
    qty: 1,
  },
  {
    id: '2',
    name: 'Rocket',
    attributes: ['Taille : 162 cm', 'Couleur : Rouge'],
    imageUrl: '/samples/rocket.png',
    price: 1890,
    oldPrice: 1990,
    qty: 1,
    options: [
      { label: 'Ailerons carbone', price: 75, imageUrl: '/samples/rocket.png' },
      { label: 'Leash classique', price: 0, imageUrl: '/samples/rocket.png' },
    ],
    linked: [{ id: 'l1', name: 'Board bag Rocket', imageUrl: '/samples/rocket.png', addPrice: 120 }],
  },
]

export default function CartPreview({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false)
  const [lines, setLines] = useState<CartLine[]>(MOCK_LINES)

  const changeQty = (id: string, delta: number) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, qty: Math.max(1, l.qty + delta) } : l)))
  const remove = (id: string) => setLines((ls) => ls.filter((l) => l.id !== id))

  return (
    <>
      <button
        type="button"
        className="u-cta u-cta--white-outline"
        onClick={() => {
          setLines(MOCK_LINES)
          setOpen(true)
        }}
      >
        Ouvrir le panier
      </button>
      {open && (
        <CartModal
          lines={lines}
          locale={locale}
          onClose={() => setOpen(false)}
          onQty={changeQty}
          onRemove={remove}
        />
      )}
    </>
  )
}
