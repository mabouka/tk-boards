'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import type { StorefrontProduct, StorefrontVariant } from '@/lib/storefront/product'
import { formatEur } from '@/lib/format-price'
import { useDrawer } from '@/lib/use-drawer'
import { useCart } from '@/lib/use-cart'
import { lineFromVariant } from '@/components/cart/cartLine'
import styles from './Configurator.module.css'

export type ConfiguratorLabels = {
  buy: string
  cart: string
  configure: string
  from: string
  cartStub: string
  close: string
}

type Props = {
  product: StorefrontProduct
  locale: string
  labels: ConfiguratorLabels
  productName: string
  previewImage?: string | null
  open: boolean
  onClose: () => void
}

export default function Configurator({
  product,
  locale,
  labels,
  productName,
  previewImage,
  open,
  onClose,
}: Props) {
  // Pre-select the first available (in-stock) variant's combo by default.
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const first = product.variants.find((v) => v.stock > 0) ?? product.variants[0]
    return first ? { ...first.combo } : {}
  })
  const { addItem } = useCart()
  // Portal target only exists on the client — false during SSR/hydration, true
  // after, without a setState-in-effect.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  useDrawer(open, onClose)

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
      // toggle off
      if (prev[attrCode] === valueCode) {
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

  function handleAdd() {
    if (!resolved) return
    addItem(lineFromVariant(product, resolved, selected, productName, previewImage ?? ''))
    onClose()
  }

  if (!mounted) return null

  return createPortal(
    <>
      <div
        className={`${styles.backdrop} ${open ? styles.backdropOpen : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {previewImage && (
        <div className={`${styles.preview} ${open ? styles.previewOpen : ''}`} aria-hidden="true">
          {open && (
            <div className={styles.previewFrame}>
              <Image
                src={previewImage}
                alt=""
                fill
                sizes="(max-width: 768px) 0px, 800px"
                style={{ objectFit: 'contain' }}
              />
            </div>
          )}
        </div>
      )}
      <aside
        className={`${styles.panel} ${open ? styles.panelOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={labels.configure}
        aria-hidden={!open}
      >
        <div className={styles.header}>
          <span className={styles.title}>{labels.configure}</span>
          <button type="button" className={styles.close} onClick={onClose} aria-label={labels.close}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

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

        <div className={styles.footer}>
          {displayPrice != null && (
            <p className={styles.price}>
              {!resolved && <span className={styles.priceFrom}>{labels.from}</span>}
              {formatEur(displayPrice, locale)}
              {oldPrice != null && <span className={styles.priceOld}>{formatEur(oldPrice, locale)}</span>}
            </p>
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
      </aside>
    </>,
    document.body
  )
}
