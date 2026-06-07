import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { requestReset } from '../actions'
import { AtIcon } from '@/components/auth/icons'
import styles from '../auth.module.css'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ForgotPasswordPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sent = (await searchParams).sent === '1'
  const t = await getTranslations('auth')

  if (sent) {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>{t('check_email_title')}</h1>
        <p className={styles.subtitle}>{t('reset_sent')}</p>
        <div className={styles.actions}>
          <Link className={`u-cta u-cta--white-outline ${styles.btnRow}`} href={`/${locale}/login`}>
            {t('back_to_signin')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>{t('reset_title')}</h1>
      <div className={styles.step}>
        <Link className={styles.changeEmail} href={`/${locale}/login`}>
          ← {t('back_to_signin')}
        </Link>
        <form className={styles.form} action={requestReset}>
          <input type="hidden" name="locale" value={locale} />
          <p className={styles.formLabel}>{t('reset_label')}</p>
          <label className={styles.inputWrap}>
            <AtIcon />
            <input
              className={styles.field}
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t('email_placeholder')}
              required
            />
          </label>
          <div className={styles.actions}>
            <button className={`u-cta u-cta--white-fill ${styles.btnRow}`} type="submit">
              {t('reset_send')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
