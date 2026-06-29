import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/auth'
import { getUnitByToken } from '@/lib/tk-id'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { urlFor } from '@/sanity/lib/image'
import { boardImageBySkuQuery } from '@/sanity/lib/queries'
import { registerBoard, declareStolen, markRecovered } from './actions'
import styles from './tkid.module.css'

type Props = { params: Promise<{ locale: string; token: string }> }

export const metadata = { robots: { index: false, follow: false } }

function Card({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>TK ID</p>
        {children}
      </div>
    </main>
  )
}

export default async function TkIdPage({ params }: Props) {
  const { locale, token } = await params
  const t = await getTranslations('tkid')
  const [tk, session] = await Promise.all([getUnitByToken(token), auth()])
  const userId = session?.user?.id ?? null

  // Board photo from Sanity, matched by the parent SKU (board.skuCode).
  const board = tk?.productSku
    ? await client.fetch(boardImageBySkuQuery, { sku: tk.productSku, locale }, sanityCache('board'))
    : null
  const photoUrl = board?.mainImage
    ? urlFor(board.mainImage).width(900).quality(85).auto('format').url()
    : null
  const photoAr = board?.aspectRatio && board.aspectRatio > 0 ? board.aspectRatio : 1

  const metaTable = tk?.productName ? (
    <div className={styles.meta}>
      <p className={styles.metaTitle}>{tk.productName}</p>
      <div className={styles.metaRow}>
        <span className={styles.metaKey}>{t('model_label')}</span>
        <span className={styles.metaVal}>{tk.productName}</span>
      </div>
      {tk.serial && (
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>{t('serial_label')}</span>
          <span className={`${styles.metaVal} ${styles.mono}`}>{tk.serial}</span>
        </div>
      )}
    </div>
  ) : null

  // Photo above the model/serial — shown wherever a board is known.
  const meta =
    photoUrl || metaTable ? (
      <>
        {photoUrl && (
          <figure className={styles.photo}>
            <Image
              src={photoUrl}
              alt={tk?.productName ?? ''}
              width={900}
              height={Math.round(900 / photoAr)}
              sizes="(max-width: 520px) 88vw, 420px"
              priority
            />
          </figure>
        )}
        {metaTable}
      </>
    ) : null

  const home = (
    <Link href={`/${locale}`} className="u-cta u-cta--white-outline">
      {t('back_home')}
    </Link>
  )

  // 1. Unknown token
  if (!tk) {
    return (
      <Card>
        <h1 className={styles.title}>{t('invalid_title')}</h1>
        <p className={styles.text}>{t('invalid_text')}</p>
        <div className={styles.actions}>
          {home}
        </div>
      </Card>
    )
  }

  // 2. Token not assigned to a board yet
  if (!tk.variantId) {
    return (
      <Card>
        <h1 className={styles.title}>{t('inactive_title')}</h1>
        <p className={styles.text}>{t('inactive_text')}</p>
        <div className={styles.actions}>
          {home}
        </div>
      </Card>
    )
  }

  const isOwner = Boolean(userId && tk.ownerUserId === userId)

  // 3. Reported stolen — anti-theft alert (everyone)
  if (tk.status === 'stolen') {
    return (
      <Card>
        <div className={styles.alert}>{t('stolen_title')}</div>
        <p className={styles.text}>{t('stolen_text')}</p>
        {meta}
        {isOwner ? (
          <form action={markRecovered}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="token" value={token} />
            <button className={styles.danger} type="submit">
              {t('mark_recovered')}
            </button>
          </form>
        ) : (
          <p className={styles.note}>{t('stolen_found')}</p>
        )}
      </Card>
    )
  }

  // 4. Registered
  if (tk.status === 'registered') {
    if (isOwner) {
      return (
        <Card>
          <h1 className={styles.title}>{t('owner_title')}</h1>
          <p className={styles.text}>{t('owner_text')}</p>
          {meta}
          <div className={styles.actions}>
            <Link href={`/${locale}/account`} className="u-cta u-cta--white-fill">
              {t('account_cta')}
            </Link>
            <form action={declareStolen}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="token" value={token} />
              <button className={styles.danger} type="submit">
                {t('declare_stolen')}
              </button>
            </form>
          </div>
        </Card>
      )
    }
    return (
      <Card>
        <h1 className={styles.title}>{t('protected_title')}</h1>
        <p className={styles.text}>{t('protected_text')}</p>
        {meta}
      </Card>
    )
  }

  // 5. Provisioned → register (first tap)
  return (
    <Card>
      <h1 className={styles.title}>{t('register_title')}</h1>
      <p className={styles.text}>{userId ? t('register_text') : t('login_prompt')}</p>
      {meta}
      <div className={styles.actions}>
        {userId ? (
          <form action={registerBoard}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="token" value={token} />
            <button className="u-cta u-cta--white-fill" type="submit">
              {t('register_cta')}
            </button>
          </form>
        ) : (
          <Link href={`/${locale}/login`} className="u-cta u-cta--white-fill">
            {t('login_cta')}
          </Link>
        )}
      </div>
    </Card>
  )
}
