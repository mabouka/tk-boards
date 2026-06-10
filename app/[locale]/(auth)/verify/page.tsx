import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { verifyEmail } from '../actions'
import styles from '../auth.module.css'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function VerifyPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations('auth')

  const token = typeof sp.token === 'string' ? sp.token : ''
  const expired = sp.expired === '1'
  const callbackUrl = typeof sp.callbackUrl === 'string' ? sp.callbackUrl : ''

  // Invalid / expired (also reached after a failed confirm).
  if (!token || expired) {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>{t('verify_fail_title')}</h1>
        <div className={styles.step}>
          <p className={styles.subtitle}>{t('verify_fail_text')}</p>
          <Link href={`/${locale}/login`} className={`u-cta u-cta--white-fill ${styles.btnRow}`}>
            {t('go_to_login')}
          </Link>
        </div>
      </div>
    )
  }

  // Confirmation happens via POST so mail link-scanners (which only GET) don't
  // consume the one-time token before the user clicks.
  return (
    <div className={styles.card}>
      <h1 className={styles.title}>{t('verify_confirm_title')}</h1>
      <div className={styles.step}>
        <p className={styles.subtitle}>{t('verify_confirm_text')}</p>
        <form className={styles.form} action={verifyEmail}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="token" value={token} />
          {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
          <div className={styles.actions}>
            <button className={`u-cta u-cta--white-fill ${styles.btnRow}`} type="submit">
              {t('verify_cta')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
