'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { formatEur } from '@/lib/format-price'
import styles from './CartModal.module.css'

/** A selected add-on for a configured line (price 0 = included). */
export type CartOption = { label: string; price: number; imageUrl: string }
/** A related product suggested for a specific line (e.g. the matching board bag). */
export type CartLinked = { id: string; name: string; imageUrl: string; addPrice: number }

export type CartLine = {
  id: string
  name: string
  /** Selected variant axes, e.g. ["Taille : 162 cm", "Couleur : Rouge"]. */
  attributes?: string[]
  imageUrl: string
  price: number
  oldPrice?: number
  qty: number
  /** Available stock at add-time — caps the quantity stepper. Undefined = uncapped. */
  maxQty?: number
  options?: CartOption[]
  linked?: CartLinked[]
}

type Props = {
  lines: CartLine[]
  locale: string
  onClose?: () => void
  onQty?: (id: string, delta: number) => void
  onRemove?: (id: string) => void
  onCheckout?: () => void
  checkingOut?: boolean
  checkoutError?: string
}

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 6h18M8 6V4h8v2m-9 0v13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6M10 11v6M14 11v6" />
  </svg>
)

export default function CartModal({
  lines,
  locale,
  onClose,
  onQty,
  onRemove,
  onCheckout,
  checkingOut,
  checkoutError,
}: Props) {
  const t = useTranslations('cart')
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0)

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label={t('title')}>
      <div className={styles.panel}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <button type="button" className={styles.close} onClick={onClose} aria-label={t('close')}>
            <CloseIcon />
          </button>
          <h2 className={styles.title}>{t('title')}</h2>
        </header>

        {/* ── Lines (scrollable) ── */}
        <div className={styles.body}>
          {lines.map((line) => (
            <article key={line.id} className={styles.line}>
              <div className={styles.media}>
                {line.imageUrl && (
                  <Image src={line.imageUrl} alt={line.name} fill sizes="120px" style={{ objectFit: 'contain' }} />
                )}
              </div>

              <div className={styles.content}>
                <div className={styles.row}>
                  <h3 className={styles.name}>{line.name}</h3>
                  <div className={styles.prices}>
                    {line.oldPrice != null && <span className={styles.old}>{formatEur(line.oldPrice, locale)}</span>}
                    <span className={styles.price}>{formatEur(line.price, locale)}</span>
                  </div>
                </div>

                {line.attributes?.map((attr, i) => (
                  <p key={i} className={styles.variant}>
                    {attr}
                  </p>
                ))}

                <div className={styles.actions}>
                  <div className={styles.stepper}>
                    <button type="button" onClick={() => onQty?.(line.id, -1)} aria-label={t('decrease')}>−</button>
                    <span>{line.qty}</span>
                    <button
                      type="button"
                      onClick={() => onQty?.(line.id, 1)}
                      disabled={line.maxQty != null && line.qty >= line.maxQty}
                      aria-label={t('increase')}
                    >
                      +
                    </button>
                  </div>
                  <button type="button" className={styles.remove} onClick={() => onRemove?.(line.id)} aria-label={t('remove')}>
                    <TrashIcon />
                  </button>
                </div>

                {/* Selected options (add-ons) */}
                {line.options && line.options.length > 0 && (
                  <ul className={styles.options}>
                    {line.options.map((opt, i) => (
                      <li key={i} className={styles.option}>
                        <div className={styles.optionMedia}>
                          {opt.imageUrl && (
                            <Image src={opt.imageUrl} alt={opt.label} fill sizes="44px" style={{ objectFit: 'contain' }} />
                          )}
                        </div>
                        <span className={styles.optionLabel}>{opt.label}</span>
                        <span className={styles.optionPrice}>
                          {opt.price > 0 ? `+ ${formatEur(opt.price, locale)}` : t('included')}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Linked products (e.g. matching board bag) */}
                {line.linked && line.linked.length > 0 && (
                  <ul className={styles.linked}>
                    {line.linked.map((l) => (
                      <li key={l.id} className={styles.linkedItem}>
                        <div className={styles.linkedMedia}>
                          {l.imageUrl && (
                            <Image src={l.imageUrl} alt={l.name} fill sizes="44px" style={{ objectFit: 'contain' }} />
                          )}
                        </div>
                        <span className={styles.linkedName}>{l.name}</span>
                        <span className={styles.linkedPrice}>+ {formatEur(l.addPrice, locale)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* ── Footer ── */}
        <footer className={styles.footer}>
          {checkoutError && <p className={styles.error}>{checkoutError}</p>}
          <button
            type="button"
            className={`u-cta u-cta--white-fill ${styles.checkout}`}
            onClick={onCheckout}
            disabled={checkingOut || lines.length === 0}
          >
            {checkingOut ? `${t('checkout')}…` : `${t('checkout')} · ${formatEur(total, locale)}`}
          </button>
          <p className={styles.note}>{t('note')}</p>
        </footer>
      </div>
    </div>
  )
}
