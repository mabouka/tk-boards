'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCart } from '@/components/commerce/cart/CartContext'
import {
  getCheckoutQuote,
  createCheckoutSession,
  type CheckoutQuote,
} from '@/app/[locale]/(site)/checkout/actions'
import { countryName } from '@/lib/countries'
import { formatEur } from '@/lib/format-price'
import styles from './Checkout.module.css'

export default function CheckoutClient({ locale, buy }: { locale: string; buy: string | null }) {
  const t = useTranslations('checkout')
  const { items: cartItems } = useCart()

  // "Buy now" carries a single item in the URL (sku or sku:qty); otherwise the
  // cart drives the checkout.
  const items = useMemo(() => {
    if (buy) {
      const [sku, q] = buy.split(':')
      if (!sku) return []
      return [{ sku, qty: Math.max(1, Math.floor(Number(q) || 1)) }]
    }
    return cartItems.map((l) => ({ sku: l.id, qty: l.qty }))
  }, [buy, cartItems])
  const itemsKey = useMemo(() => items.map((i) => `${i.sku}:${i.qty}`).join(','), [items])

  const [quote, setQuote] = useState<CheckoutQuote | null>(null)
  const [loading, setLoading] = useState(true)
  const [country, setCountry] = useState('')
  const [paying, startPay] = useTransition()
  const [payError, setPayError] = useState<string>()

  useEffect(() => {
    let alive = true
    getCheckoutQuote(items).then((q) => {
      if (!alive) return
      setQuote(q)
      setPayError(undefined)
      if (q.ok && q.quotes.length === 1) setCountry(q.quotes[0].country) // preselect the only option
      setLoading(false)
    })
    return () => {
      alive = false
    }
    // items is a fresh array each render; itemsKey captures its content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey])

  const eur = (n: number) => formatEur(n, locale)

  const countryOpts = useMemo(() => {
    if (!quote?.ok) return []
    return quote.quotes
      .map((q) => ({ code: q.country, name: countryName(q.country, locale), shippingEur: q.shippingEur }))
      .sort((a, b) => a.name.localeCompare(b.name, locale))
  }, [quote, locale])

  function pay() {
    if (!country) return
    setPayError(undefined)
    startPay(async () => {
      const res = await createCheckoutSession(items, locale, country)
      if (res.url) {
        window.location.href = res.url
        return
      }
      setPayError(
        t(
          res.error === 'stock'
            ? 'err_stock'
            : res.error === 'unavailable'
              ? 'err_unavailable'
              : res.error === 'shipping_country'
                ? 'err_country'
                : 'err_generic'
        )
      )
    })
  }

  // ── Empty / unavailable / loading states ──
  if (loading) {
    return (
      <div className={styles.wrap}>
        <h1 className={styles.title}>{t('heading')}</h1>
        <p className={styles.muted}>{t('loading')}</p>
      </div>
    )
  }

  if (!quote || !quote.ok) {
    const msg = quote && quote.error === 'unavailable' ? t('err_unavailable') : t('empty')
    return (
      <div className={styles.wrap}>
        <h1 className={styles.title}>{t('heading')}</h1>
        <p className={styles.muted}>{msg}</p>
        <Link href={`/${locale}`} className={`u-cta u-cta--white-outline ${styles.emptyCta}`}>
          {t('empty_cta')}
        </Link>
      </div>
    )
  }

  const shipping = quote.quotes.find((q) => q.country === country)?.shippingEur
  const total = quote.subtotalEur + (shipping ?? 0)
  const noShipping = quote.quotes.length === 0

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>{t('heading')}</h1>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>{t('items')}</h2>
          {quote.lines.map((l) => (
            <div key={l.sku} className={styles.line}>
              <span>
                <span className={styles.lineQty}>{l.qty}×</span>
                {l.name}
              </span>
              <span className={styles.linePrice}>{eur(l.unitPriceEur * l.qty)}</span>
            </div>
          ))}
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>{t('country_label')}</h2>
          {noShipping ? (
            <p className={styles.muted}>{t('no_shipping')}</p>
          ) : (
            <div className={styles.field}>
              <select
                className={styles.select}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                aria-label={t('country_label')}
              >
                <option value="">{t('country_ph')}</option>
                {countryOpts.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} — {eur(c.shippingEur)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        <section className={styles.card}>
          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span>{t('subtotal')}</span>
              <span>{eur(quote.subtotalEur)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>{t('shipping')}</span>
              <span>{shipping == null ? '—' : eur(shipping)}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grand}`}>
              <span>{t('total')}</span>
              <span>{eur(total)}</span>
            </div>
          </div>
          <p className={styles.taxNote}>{t('tax_note')}</p>
        </section>

        <div>
          {payError && <p className={styles.error}>{payError}</p>}
          <button
            type="button"
            className={`u-cta u-cta--white-fill ${styles.pay}`}
            onClick={pay}
            disabled={paying || noShipping || !country}
          >
            {paying ? `${t('pay')}…` : t('pay')}
          </button>
        </div>
      </div>
    </div>
  )
}
