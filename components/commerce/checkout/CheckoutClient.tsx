'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCart } from '@/components/commerce/cart/CartContext'
import {
  getCheckoutQuote,
  getSavedAddress,
  createCheckoutSession,
  type CheckoutQuote,
} from '@/app/[locale]/(site)/checkout/actions'
import { countryName } from '@/lib/countries'
import { formatEur } from '@/lib/format-price'
import styles from './Checkout.module.css'

type Addr = { name: string; line1: string; line2: string; postalCode: string; city: string; phone: string }
const EMPTY_ADDR: Addr = { name: '', line1: '', line2: '', postalCode: '', city: '', phone: '' }

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
  const [addr, setAddr] = useState<Addr>(EMPTY_ADDR)
  const [paying, startPay] = useTransition()
  const [payError, setPayError] = useState<string>()

  useEffect(() => {
    let alive = true
    getCheckoutQuote(items).then((q) => {
      if (!alive) return
      setQuote(q)
      setPayError(undefined)
      if (q.ok) {
        // Drop a selection the new cart can no longer ship to, otherwise the totals
        // would render without its shipping while the pay button stayed enabled.
        setCountry((c) =>
          q.quotes.length === 1 ? q.quotes[0].country : q.quotes.some((x) => x.country === c) ? c : ''
        )
      }
      setLoading(false)
    })
    return () => {
      alive = false
    }
    // items is a fresh array each render; itemsKey captures its content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey])

  // Prefill from the signed-in buyer's saved address (once).
  useEffect(() => {
    let alive = true
    getSavedAddress().then((a) => {
      if (alive && a) setAddr({ name: a.name, line1: a.line1, line2: a.line2, postalCode: a.postalCode, city: a.city, phone: a.phone })
    })
    return () => {
      alive = false
    }
  }, [])

  const eur = (n: number) => formatEur(n, locale)
  const setField = (k: keyof Addr, v: string) => setAddr((a) => ({ ...a, [k]: v }))

  const countryOpts = useMemo(() => {
    if (!quote?.ok) return []
    return quote.quotes
      .map((q) => ({ code: q.country, name: countryName(q.country, locale), shippingEur: q.shippingEur }))
      .sort((a, b) => a.name.localeCompare(b.name, locale))
  }, [quote, locale])

  const addrComplete =
    Boolean(country) &&
    addr.name.trim() !== '' &&
    addr.line1.trim() !== '' &&
    addr.postalCode.trim() !== '' &&
    addr.city.trim() !== ''

  function pay() {
    if (!addrComplete) return
    setPayError(undefined)
    startPay(async () => {
      const res = await createCheckoutSession(items, locale, { ...addr, country })
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
                : res.error === 'address'
                  ? 'err_address'
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

  const selected = quote.quotes.find((q) => q.country === country)
  const shipping = selected?.shippingEur
  const total = quote.subtotalEur + (shipping ?? 0)
  // Server-computed, per rate — identical to the figure the order will store.
  const vatIncl = selected?.vatEur ?? quote.goodsVatEur
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
          <h2 className={styles.cardTitle}>{t('addr_title')}</h2>
          {noShipping ? (
            <p className={styles.muted}>{t('no_shipping')}</p>
          ) : (
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>{t('country_label')}</label>
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
              <div className={styles.field}>
                <label className={styles.label}>{t('addr_name')}</label>
                <input className={styles.input} value={addr.name} onChange={(e) => setField('name', e.target.value)} autoComplete="name" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t('addr_line1')}</label>
                <input className={styles.input} value={addr.line1} onChange={(e) => setField('line1', e.target.value)} autoComplete="address-line1" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t('addr_line2')}</label>
                <input className={styles.input} value={addr.line2} onChange={(e) => setField('line2', e.target.value)} autoComplete="address-line2" />
              </div>
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label className={styles.label}>{t('addr_postal')}</label>
                  <input className={styles.input} value={addr.postalCode} onChange={(e) => setField('postalCode', e.target.value)} autoComplete="postal-code" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>{t('addr_city')}</label>
                  <input className={styles.input} value={addr.city} onChange={(e) => setField('city', e.target.value)} autoComplete="address-level2" />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t('addr_phone')}</label>
                <input className={styles.input} value={addr.phone} onChange={(e) => setField('phone', e.target.value)} autoComplete="tel" />
              </div>
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
            <div className={styles.vatRow}>
              <span>{t('vat_incl')}</span>
              <span>{eur(vatIncl)}</span>
            </div>
          </div>
        </section>

        <div>
          {payError && <p className={styles.error}>{payError}</p>}
          <button
            type="button"
            className={`u-cta u-cta--white-fill ${styles.pay}`}
            onClick={pay}
            disabled={paying || noShipping || !addrComplete}
          >
            {paying ? `${t('pay')}…` : t('pay')}
          </button>
        </div>
      </div>
    </div>
  )
}
