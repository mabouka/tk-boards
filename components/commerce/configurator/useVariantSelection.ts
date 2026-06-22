import { useMemo, useState } from 'react'
import type { StorefrontProduct, StorefrontVariant } from '@/lib/storefront/product'

type Options = {
  /**
   * Allow clicking the already-selected value to deselect it (drawer mode).
   * Inline mode keeps a value selected on every axis at all times.
   */
  allowDeselect?: boolean
}

/**
 * Variant-selection state + availability cascade shared by the drawer
 * `Configurator` and the inline `MiniConfigurator`.
 *
 * - Pre-selects a complete combo (preferring an in-stock variant) so a variant
 *   resolves on first render.
 * - `isAvailable` greys out a value unless an in-stock variant carries it while
 *   matching the current selection on every OTHER axis.
 * - `pick` sets the new value and keeps only prior selections still compatible
 *   with it (and, when `allowDeselect`, toggles a re-clicked value off).
 */
export function useVariantSelection(
  product: StorefrontProduct,
  { allowDeselect = false }: Options = {}
) {
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const base = product.variants.find((v) => v.stock > 0) ?? product.variants[0]
    const combo: Record<string, string> = {}
    for (const a of product.attributes) {
      combo[a.code] = base?.combo[a.code] ?? a.values[0]?.code ?? ''
    }
    return combo
  })

  const isAvailable = (attrCode: string, valueCode: string) =>
    product.variants.some(
      (v) =>
        v.stock > 0 &&
        v.combo[attrCode] === valueCode &&
        Object.entries(selected).every(([k, val]) => k === attrCode || v.combo[k] === val)
    )

  const resolved: StorefrontVariant | null = useMemo(() => {
    const complete = product.attributes.every((a) => selected[a.code])
    if (!complete) return null
    return (
      product.variants.find((v) =>
        product.attributes.every((a) => v.combo[a.code] === selected[a.code])
      ) ?? null
    )
  }, [product, selected])

  function pick(attrCode: string, valueCode: string) {
    setSelected((prev) => {
      if (prev[attrCode] === valueCode) {
        if (!allowDeselect) return prev
        const rest = { ...prev }
        delete rest[attrCode]
        return rest
      }
      // set, then keep only prior selections still compatible with the new pick
      const next: Record<string, string> = { [attrCode]: valueCode }
      for (const a of product.attributes) {
        if (a.code === attrCode) continue
        const val = prev[a.code]
        if (!val) continue
        const candidate = { ...next, [a.code]: val }
        const ok = product.variants.some(
          (v) => v.stock > 0 && Object.entries(candidate).every(([k, x]) => v.combo[k] === x)
        )
        if (ok) next[a.code] = val
      }
      return next
    })
  }

  const canBuy = Boolean(resolved && resolved.stock > 0)
  const displayPrice = resolved ? (resolved.salePrice ?? resolved.price) : product.fromPrice
  const oldPrice = resolved && resolved.salePrice != null ? resolved.price : null

  return { selected, isAvailable, resolved, pick, canBuy, displayPrice, oldPrice }
}
