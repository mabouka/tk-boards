'use client'

import { useMemo, useState } from 'react'
import type { StorefrontProduct, StorefrontVariant } from '@/lib/storefront/product'
import { formatEur } from '@/lib/format-price'
import { useCart } from '@/lib/use-cart'
import { lineFromVariant } from '@/components/cart/cartLine'
import type { ConfiguratorLabels } from './Configurator'
import styles from './MiniConfigurator.module.css'

type Props = {
  product: StorefrontProduct
  locale: string
  labels: ConfiguratorLabels
  productName: string
  previewImage?: string | null
}

/**
 * Inline mini configurator: renders one pill row per axis directly on the
 * product page (no drawer), pre-selecting the first value of every axis so a
 * variant resolves immediately, and shows the resolved price + savings with an
 * add-to-cart button. Variant-resolution + availability cascade mirror the
 * drawer Configurator so behaviour stays consistent.
 */
export default function MiniConfigurator({ product, locale, labels, productName, previewImage }: Props) {
  // Default to the first value of EVERY axis so a variant resolves on first
  // render. Prefer a fully in-stock combo when one exists.
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const inStock = product.variants.find((v) => v.stock > 0)
    const base = inStock ?? product.variants[0]
    const combo: Record<string, string> = {}
    for (const a of product.attributes) {
      combo[a.code] = base?.combo[a.code] ?? a.values[0]?.code ?? ''
    }
    return combo
  })
  const { addItem } = useCart()

  // A value is selectable iff an active, in-stock variant carries it while
  // matching the current selection on every OTHER axis (cascade / grey-out).
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
      if (prev[attrCode] === valueCode) return prev // already selected — no toggle-off in inline mode
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
  const savings = oldPrice != null && displayPrice != null ? oldPrice - displayPrice : null

  function handleAdd() {
    if (resolved) addItem(lineFromVariant(product, resolved, selected, productName, previewImage ?? ''))
  }

  return (
    <div className={styles.root}>
      <div className={styles.groups}>
        {product.attributes.map((attr) => (
          <div key={attr.code} className={styles.group}>
            <span className={styles.groupLabel}>{attr.name}</span>
            <div className={styles.values}>
              {attr.values.map((val) => {
                const isSelected = selected[attr.code] === val.code
                const available = isAvailable(attr.code, val.code)
                if (attr.inputType === 'swatch') {
                  return (
                    <button
                      key={val.code}
                      type="button"
                      className={`${styles.swatch} ${isSelected ? styles.swatchSelected : ''}`}
                      style={{ backgroundColor: val.swatchHex ?? 'transparent' }}
                      disabled={!available && !isSelected}
                      onClick={() => pick(attr.code, val.code)}
                      title={val.label}
                      aria-label={val.label}
                      aria-pressed={isSelected}
                    />
                  )
                }
                return (
                  <button
                    key={val.code}
                    type="button"
                    className={`${styles.value} ${isSelected ? styles.valueSelected : ''}`}
                    disabled={!available && !isSelected}
                    onClick={() => pick(attr.code, val.code)}
                    aria-pressed={isSelected}
                  >
                    {val.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {displayPrice != null && (
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatEur(displayPrice, locale)}</span>
          {oldPrice != null && (
            <span className={styles.priceOld}>{formatEur(oldPrice, locale)}</span>
          )}
          {savings != null && savings > 0 && (
            <span className={styles.savings}>− {savings.toLocaleString(locale, { maximumFractionDigits: 2 })}€</span>
          )}
        </div>
      )}

      <div className={styles.btnRow}>
        <button
          type="button"
          className="u-cta u-cta--white-fill"
          disabled={!canBuy}
          onClick={handleAdd}
        >
          {labels.buy}
        </button>
        <button
          type="button"
          className="u-cta u-cta--white-outline"
          disabled={!canBuy}
          onClick={handleAdd}
        >
          {labels.cart}
        </button>
      </div>
    </div>
  )
}
