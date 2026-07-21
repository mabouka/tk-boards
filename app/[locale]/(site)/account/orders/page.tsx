import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { liveSession } from '@/lib/session'
import { getUserOrders } from '@/lib/orders'
import { formatEur } from '@/lib/format-price'
import { ORDER_STATUS_CLASS } from './status'
import styles from '../account.module.css'

type Props = { params: Promise<{ locale: string }> }

export default async function MyOrdersPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('account')
  const session = await liveSession()
  const orders = await getUserOrders(session?.userId ?? '')

  if (orders.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{t('orders_empty')}</p>
      </div>
    )
  }

  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className={styles.orderList}>
      {orders.map((o) => (
        <Link key={o.number} href={`/${locale}/account/orders/${o.number}`} className={styles.orderRow}>
          <div className={styles.orderMain}>
            <span className={`${styles.orderNumber} ${styles.mono}`}>#{o.number}</span>
            <span className={styles.orderSub}>
              {fmtDate(o.createdAt)} · {t('order_items', { count: o.itemCount })}
            </span>
          </div>
          <span className={`${styles.statusBadge} ${ORDER_STATUS_CLASS[o.status] ?? styles.stMuted}`}>
            {t(`order_status_${o.status}`)}
          </span>
          <span className={styles.orderTotal}>{formatEur(Number(o.totalEur), locale)}</span>
        </Link>
      ))}
    </div>
  )
}
