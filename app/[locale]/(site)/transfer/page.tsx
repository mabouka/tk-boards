import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { liveSession } from '@/lib/session'
import { getPendingTransfer } from '@/lib/transfers'
import { getVariantAttributes } from '@/lib/tk-id'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { urlFor } from '@/sanity/lib/image'
import { boardImageBySkuQuery } from '@/sanity/lib/queries'
import { acceptTransfer } from '../account/transferActions'
import styles from '../../tk-id/[token]/tkid.module.css'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>
}

export const metadata = { robots: { index: false, follow: false } }

export default async function TransferPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = await searchParams
  const rawToken = typeof sp.token === 'string' ? sp.token : ''
  const status = typeof sp.status === 'string' ? sp.status : undefined
  const [t, tk] = await Promise.all([getTranslations('account'), getTranslations('tkid')])

  // Members only — bounce to login and come back to this exact accept link.
  const s = await liveSession()
  if (!s) {
    redirect(`/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/transfer?token=${rawToken}`)}`)
  }

  const transfer = await getPendingTransfer(rawToken)
  const [me] = await db.select({ email: users.email }).from(users).where(eq(users.id, s.userId)).limit(1)

  const invalid = !transfer || status === 'invalid'
  const wrongEmail =
    !invalid && (status === 'wrongemail' || (me?.email?.toLowerCase() ?? '') !== transfer!.toEmail)

  // Board card (photo + variant axes) — only when we'll show the accept UI.
  let photoUrl: string | null = null
  let photoAr = 1
  let attributes: Awaited<ReturnType<typeof getVariantAttributes>> = []
  if (transfer && !invalid && !wrongEmail) {
    const [board, attrs] = await Promise.all([
      transfer.sku
        ? client.fetch(boardImageBySkuQuery, { sku: transfer.sku, locale }, sanityCache('board'))
        : Promise.resolve(null),
      transfer.variantId ? getVariantAttributes(transfer.variantId, locale) : Promise.resolve([]),
    ])
    photoUrl = board?.mainImage
      ? urlFor(board.mainImage).width(900).quality(85).auto('format').url()
      : null
    photoAr = board?.aspectRatio && board.aspectRatio > 0 ? board.aspectRatio : 1
    attributes = attrs
  }

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>TK ID</p>
        <h1 className={styles.title}>{t('transfer_accept_title')}</h1>

        {invalid ? (
          <>
            <p className={styles.text}>{t('transfer_invalid')}</p>
            <div className={styles.actions}>
              <Link href={`/${locale}/account`} className="u-cta u-cta--white-outline">
                {t('tab_boards')}
              </Link>
            </div>
          </>
        ) : wrongEmail ? (
          <p className={styles.text}>{t('transfer_wrongemail')}</p>
        ) : (
          <>
            {photoUrl && (
              <figure className={styles.photo}>
                <Image
                  src={photoUrl}
                  alt={transfer!.boardName ?? ''}
                  width={900}
                  height={Math.round(900 / photoAr)}
                  sizes="(max-width: 520px) 88vw, 420px"
                  priority
                />
              </figure>
            )}
            <div className={styles.meta}>
              {transfer!.boardName && <p className={styles.metaTitle}>{transfer!.boardName}</p>}
              {transfer!.serial && (
                <div className={styles.metaRow}>
                  <span className={styles.metaKey}>{tk('serial_label')}</span>
                  <span className={`${styles.metaVal} ${styles.mono}`}>{transfer!.serial}</span>
                </div>
              )}
              {attributes.map((a, i) => (
                <div key={i} className={styles.metaRow}>
                  <span className={styles.metaKey}>{a.name}</span>
                  <span className={styles.metaVal}>
                    {a.swatchHex && (
                      <span className={styles.swatch} style={{ background: a.swatchHex }} aria-hidden="true" />
                    )}
                    {a.value}
                  </span>
                </div>
              ))}
            </div>

            <p className={styles.text}>{t('transfer_accept_text')}</p>
            <form action={acceptTransfer}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="token" value={rawToken} />
              <div className={styles.actions}>
                <button type="submit" className="u-cta u-cta--white-fill">
                  {t('transfer_accept_cta')}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
