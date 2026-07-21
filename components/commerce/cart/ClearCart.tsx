'use client'

import { useEffect } from 'react'
import { useCart } from './CartContext'

// Empties the cart once the order is confirmed (rendered on the success page).
export default function ClearCart() {
  const { clear } = useCart()
  useEffect(() => {
    clear()
  }, [clear])
  return null
}
