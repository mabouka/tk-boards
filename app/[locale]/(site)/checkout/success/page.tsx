import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { orders } from '@/db/schema'
import { stripe } from '@/lib/stripe'
import ClearCart from '@/components/commerce/cart/ClearCart'
import styles from '../../../tk-id/[token]/tkid.module.css'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ session_id?: string | string[] }>
}

export const metadata = { robots: { index: false, follow: false } }

export default async function CheckoutSuccessPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = await searchParams
  const sessionId = typeof sp.session_id === 'string' ? sp.session_id : ''
  const t = await getTranslations('checkout')
  if (!sessionId) redirect(`/${locale}`)

  let email = ''
  let total = ''
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') redirect(`/${locale}`)
    email = session.customer_details?.email ?? ''
    total = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(
      (session.amount_total ?? 0) / 100
    )
  } catch {
    redirect(`/${locale}`)
  }

  // The webhook may not have created the order yet (it runs async) — the number
  // is best-effort; the Stripe session already confirms the payment.
  const [order] = await db
    .select({ number: orders.number })
    .from(orders)
    .where(eq(orders.stripeSessionId, sessionId))
    .limit(1)

  return (
    <main className={styles.wrap}>
      <ClearCart />
      <div className={styles.card}>
        <p className={styles.eyebrow}>{t('success_eyebrow')}</p>
        <h1 className={styles.title}>{t('success_title')}</h1>
        <p className={styles.text}>{email ? t('success_text', { email }) : t('success_processing')}</p>

        <div className={styles.meta}>
          {order?.number && (
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>{t('order_label')}</span>
              <span className={`${styles.metaVal} ${styles.mono}`}>#{order.number}</span>
            </div>
          )}
          <div className={styles.metaRow}>
            <span className={styles.metaKey}>{t('total_label')}</span>
            <span className={styles.metaVal}>{total}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href={`/${locale}/account/orders`} className="u-cta u-cta--white-outline">
            {t('view_orders')}
          </Link>
          <Link href={`/${locale}/boards`} className="u-cta u-cta--white-fill">
            {t('back_shop')}
          </Link>
        </div>
      </div>
    </main>
  )
}
