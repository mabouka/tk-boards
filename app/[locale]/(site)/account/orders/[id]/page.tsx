import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { liveSession } from '@/lib/session'
import { getUserOrder } from '@/lib/orders'
import { productThumbnails } from '@/lib/product-images'
import { countryLabel } from '@/lib/countries'
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
  const thumbs = await productThumbnails(lines.map((l) => l.productSku), locale)
  const eur = (v: string) => formatEur(Number(v), locale)
  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
  const shipTo = [
    order.shipName,
    order.shipLine1,
    order.shipLine2,
    [order.shipPostalCode, order.shipCity].filter(Boolean).join(' '),
    countryLabel(order.shipCountry, locale),
  ].filter(Boolean) as string[]

  return (
    <div className={styles.orderDetail}>
      <Link href={`/${locale}/account/orders`} className={styles.orderBack}>
        ← {t('orders_back')}
      </Link>

      <div className={styles.orderHead}>
        <div>
          <h2 className={styles.orderNumber}>{t('order_heading', { number: order.number })}</h2>
          <p className={styles.orderSub}>{fmtDate(order.createdAt)}</p>
        </div>
        <span className={`${styles.statusBadge} ${ORDER_STATUS_CLASS[order.status] ?? styles.stMuted}`}>
          {t(`order_status_${order.status}`)}
        </span>
      </div>

      <div className={styles.orderGrid}>
        <section className={styles.infoCard}>
          <div className={styles.infoCardHead}>
            <h3 className={styles.infoCardTitle}>{t('order_summary')}</h3>
          </div>
          <ul className={styles.orderLines}>
            {lines.map((l, i) => {
              const thumb = thumbs.get(l.productSku)
              return (
                <li key={i} className={styles.orderLine}>
                  {/* Empty when the product has left the catalogue — the box holds the
                      alignment so a line without a picture doesn't shift left. */}
                  <span className={styles.orderLineMedia}>
                    {thumb && <Image src={thumb} alt="" fill sizes="48px" style={{ objectFit: 'contain' }} />}
                  </span>
                  <span className={styles.orderLineBody}>
                    <span>
                      {l.qty}× {l.productName}
                    </span>
                    {l.variantLabel && <span className={styles.orderLineVariant}>{l.variantLabel}</span>}
                  </span>
                  <span className={styles.mono}>{eur((Number(l.unitPriceEur) * l.qty).toFixed(2))}</span>
                </li>
              )
            })}
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

        <div className={styles.orderAside}>
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
          </section>

          {order.trackingNumber && (
            <section className={styles.infoCard}>
              <div className={styles.infoCardHead}>
                <h3 className={styles.infoCardTitle}>{t('order_carrier')}</h3>
              </div>
              {order.carrier && <p className={styles.trackCarrier}>{order.carrier}</p>}
              <p className={styles.trackLabel}>{t('order_tracking_number')}</p>
              {order.trackingUrl ? (
                <a
                  href={order.trackingUrl}
                  className={styles.trackNumber}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {order.trackingNumber}
                </a>
              ) : (
                <span className={styles.trackNumber}>{order.trackingNumber}</span>
              )}
            </section>
          )}

          {canInvoice && (
            <section className={styles.infoCard}>
              <div className={styles.infoCardHead}>
                <h3 className={styles.infoCardTitle}>{t('order_invoice')}</h3>
              </div>
              <p className={styles.addrBody}>{t('order_invoice_note')}</p>
              <a
                href={`/${locale}/account/orders/${encodeURIComponent(order.number)}/invoice`}
                className="u-card-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('order_invoice_download')}
              </a>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
