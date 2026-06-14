import { useState } from 'react'

/**
 * Single seam for "add to cart". There is no cart backend yet, so this logs and
 * flashes a transient confirmation (`justAdded`). When the real cart lands, only
 * `addToCart` changes — every CTA already goes through here.
 */
export function useCart() {
  const [justAdded, setJustAdded] = useState(false)

  function addToCart(sku: string) {
    // TODO: replace stub with real cart mutation.
    console.info('[cart stub] add to cart:', sku)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2500)
  }

  return { addToCart, justAdded }
}
