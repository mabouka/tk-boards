import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { liveSession } from '@/lib/session'
import { getUserOrder } from '@/lib/orders'
import { invoicingConfigured } from '@/lib/invoice'
import { formatEur } from '@/lib/format-price'
import { ORDER_STATUS_CLASS } from '../status'
import styles from '../../account.module.css'

type Props = { params: Promise<{ locale: string; id: string }> }

export default async function OrderDetailPage({ params }: Props) {
  const { locale, id } = await params
  const t = await getTranslations('account')
  const session = await liveSession()
  const data = await getUserOrder(session?.userId ?? '', decodeURIComponent(id))
  if (!data) notFound()
  const { order, lines } = data

  const canInvoice = order.paymentStatus === 'paid' && (await invoicingConfigured())
  const eur = (v: string) => formatEur(Number(v), locale)
  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
  const shipTo = [
    order.shipName,
    order.shipLine1,
    order.shipLine2,
    [order.shipPostalCode, order.shipCity].filter(Boolean).join(' '),
    order.shipCountry,
  ].filter(Boolean) as string[]

  return (
    <div className={styles.orderDetail}>
      <Link href={`/${locale}/account/orders`} className={styles.orderBack}>
        ← {t('orders_back')}
      </Link>

      <div className={styles.orderHead}>
        <div>
          <h2 className={`${styles.orderNumber} ${styles.mono}`}>#{order.number}</h2>
          <p className={styles.orderSub}>{fmtDate(order.createdAt)}</p>
        </div>
        <span className={`${styles.statusBadge} ${ORDER_STATUS_CLASS[order.status] ?? styles.stMuted}`}>
          {t(`order_status_${order.status}`)}
        </span>
      </div>

      {canInvoice && (
        <a
          href={`/${locale}/account/orders/${encodeURIComponent(order.number)}/invoice`}
          className="u-card-btn"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('order_invoice')}
        </a>
      )}

      <section className={styles.infoCard}>
        <div className={styles.infoCardHead}>
          <h3 className={styles.infoCardTitle}>{t('order_summary')}</h3>
        </div>
        <ul className={styles.orderLines}>
          {lines.map((l, i) => (
            <li key={i} className={styles.orderLine}>
              <span>
                {l.qty}× {l.productName}
                {l.variantLabel ? ` — ${l.variantLabel}` : ''}
              </span>
              <span className={styles.mono}>{eur((Number(l.unitPriceEur) * l.qty).toFixed(2))}</span>
            </li>
          ))}
        </ul>
        <div className={styles.orderTotals}>
          <div className={styles.orderTotalRow}>
            <span>{t('order_subtotal')}</span>
            <span>{eur(order.subtotalEur)}</span>
          </div>
          <div className={styles.orderTotalRow}>
            <span>{t('order_shipping')}</span>
            <span>{eur(order.shippingEur)}</span>
          </div>
          <div className={`${styles.orderTotalRow} ${styles.orderTotalStrong}`}>
            <span>{t('order_total')}</span>
            <span>{eur(order.totalEur)}</span>
          </div>
          <div className={styles.orderTotalRow}>
            <span>{t('order_vat_incl')}</span>
            <span>{eur(order.taxEur)}</span>
          </div>
        </div>
      </section>

      <section className={styles.infoCard}>
        <div className={styles.infoCardHead}>
          <h3 className={styles.infoCardTitle}>{t('order_ship_to')}</h3>
        </div>
        <p className={styles.addrBody}>
          {shipTo.map((l, i) => (
            <span key={i}>
              {l}
              <br />
            </span>
          ))}
        </p>
        {order.trackingNumber && (
          <p className={styles.orderTracking}>
            {t('order_tracking')} ·{' '}
            {order.trackingUrl ? (
              <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                {[order.carrier, order.trackingNumber].filter(Boolean).join(' ')}
              </a>
            ) : (
              [order.carrier, order.trackingNumber].filter(Boolean).join(' ')
            )}
          </p>
        )}
      </section>
    </div>
  )
}
