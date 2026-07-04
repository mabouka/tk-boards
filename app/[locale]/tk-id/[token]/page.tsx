import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/auth'
import { getUnitByToken, getVariantAttributes } from '@/lib/tk-id'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { urlFor } from '@/sanity/lib/image'
import { boardImageBySkuQuery } from '@/sanity/lib/queries'
import Halos, { type Halo } from '@/components/ui/halo/Halos'
import { registerBoard, markRecovered } from './actions'
import LostReportModal from './LostReportModal'
import ContactOwnerModal from './ContactOwnerModal'
import styles from './tkid.module.css'

type Props = { params: Promise<{ locale: string; token: string }> }

export const metadata = { robots: { index: false, follow: false } }

// Two background glows, anchored to opposite corners of the page.
const WRAP_HALOS: Halo[] = [
  { rgb: '225, 225, 255', opacity: 0.29, w: '67vw', h: '64vh', spread: '1%', anchor: 'top-left' },
  { rgb: '225, 225, 255', opacity: 0.29, w: '67vw', h: '64vh', spread: '1%', anchor: 'bottom-right' },
]

function PhoneIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.98.36 1.94.7 2.86a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.92.34 1.88.57 2.86.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.wrap}>
      <Halos halos={WRAP_HALOS} />
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

  // Board photo (Sanity, by parent SKU) + the variant's attribute values
  // (color, size, …) — both depend on the unit, so fetch them in parallel.
  const [board, variantAttrs] = await Promise.all([
    tk?.productSku
      ? client.fetch(boardImageBySkuQuery, { sku: tk.productSku, locale }, sanityCache('board'))
      : Promise.resolve(null),
    tk?.variantId ? getVariantAttributes(tk.variantId, locale) : Promise.resolve([]),
  ])
  const photoUrl = board?.mainImage
    ? urlFor(board.mainImage).width(900).quality(85).auto('format').url()
    : null
  const photoAr = board?.aspectRatio && board.aspectRatio > 0 ? board.aspectRatio : 1

  const metaTable = tk?.productName ? (
    <div className={styles.meta}>
      <p className={styles.metaTitle}>{tk.productName}</p>

      {tk.serial && (
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>{t('serial_label')}</span>
          <span className={`${styles.metaVal} ${styles.mono}`}>{tk.serial}</span>
        </div>
      )}

      {variantAttrs.map((a, i) => (
        <div key={i} className={styles.metaRow}>
          <span className={styles.metaKey}>{a.name}</span>
          <span className={styles.metaVal}>
            {a.swatchHex && (
              <span
                className={styles.swatch}
                style={{ background: a.swatchHex }}
                aria-hidden="true"
              />
            )}
            {a.value}
          </span>
        </div>
      ))}



    </div>
  ) : null

  // Photo above the model/serial — shown wherever a board is known.
  // `lost` overlays a red "LOST" rubber stamp on the photo (lost/stolen state).
  const renderMeta = (lost = false) =>
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
            {lost && (
              <span className={styles.stamp} aria-hidden="true">
                {t('stolen_stamp')}
              </span>
            )}
          </figure>
        )}
        {metaTable}
      </>
    ) : null
  const meta = renderMeta()

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

  // 3. Reported lost/stolen — anti-theft alert (everyone). DB status stays 'stolen'.
  if (tk.status === 'stolen') {
    return (
      <Card>
        <h1 className={`${styles.title} ${styles.titleDanger}`}>{t('stolen_title')}</h1>
        <p className={styles.text}>{t('stolen_text')}</p>
        {renderMeta(true)}
        {tk.lostNote && <p className={styles.lostNote}>{tk.lostNote}</p>}
        {(tk.lostPhone || tk.lostEmail) && (
          <div className={styles.contactRow}>
            {tk.lostPhone && (
              <a
                href={`tel:${tk.lostPhone.replace(/[^\d+]/g, '')}`}
                className={styles.contactBtn}
                aria-label={t('call_owner')}
              >
                <PhoneIcon />
              </a>
            )}
            {tk.lostEmail && (
              <a
                href={`mailto:${tk.lostEmail}`}
                className={styles.contactBtn}
                aria-label={t('email_owner')}
              >
                <MailIcon />
              </a>
            )}
          </div>
        )}
        {isOwner ? (
          <div className={styles.actions}>
            <form action={markRecovered}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="token" value={token} />
              <button className="u-cta u-cta--red-outline" type="submit">
                {t('mark_recovered')}
              </button>
            </form>
          </div>
        ) : (
          // tel/mail are optional, so always keep a reliable way to reach the owner.
          <div className={styles.actions}>
            <ContactOwnerModal locale={locale} token={token} />
          </div>
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
            <LostReportModal locale={locale} token={token} />
          </div>
        </Card>
      )
    }
    return (
      <Card>
        <h1 className={styles.title}>{t('protected_title')}</h1>
        <p className={styles.text}>{t('protected_text')}</p>
        {meta}
        <div className={styles.actions}>
          <ContactOwnerModal locale={locale} token={token} />
          {!userId && (
            <>
              <p className={styles.ownerPrompt}>{t('protected_owner_prompt')}</p>
              <Link
                href={`/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/tk-id/${token}`)}`}
                className="u-cta u-cta--white-outline"
              >
                {t('login_cta')}
              </Link>
            </>
          )}
        </div>
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
          <Link
            href={`/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/tk-id/${token}`)}`}
            className="u-cta u-cta--white-fill"
          >
            {t('login_cta')}
          </Link>
        )}
      </div>
    </Card>
  )
}
