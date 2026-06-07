import { getTranslations } from 'next-intl/server'
import { updatePassword } from '../actions'
import PasswordField from '../PasswordField'
import styles from '../auth.module.css'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ResetPasswordPage({ params, searchParams }: Props) {
  const { locale } = await params
  const hasError = (await searchParams).error === '1'
  const t = await getTranslations('auth')

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>{t('new_password_title')}</h1>
      <p className={styles.subtitle}>{t('new_password_sub')}</p>
      <form className={styles.form} action={updatePassword}>
        <input type="hidden" name="locale" value={locale} />
        <PasswordField
          name="password"
          placeholder={t('new_password')}
          autoComplete="new-password"
          minLength={8}
          showLabel={t('show_password')}
          hideLabel={t('hide_password')}
        />
        <PasswordField
          name="password2"
          placeholder={t('confirm_new_password')}
          autoComplete="new-password"
          minLength={8}
          showLabel={t('show_password')}
          hideLabel={t('hide_password')}
        />
        {hasError && <p className={styles.error}>{t('error_reset')}</p>}
        <div className={styles.actions}>
          <button className={`u-cta u-cta--white-fill ${styles.btnRow}`} type="submit">
            {t('update_password')}
          </button>
        </div>
      </form>
    </div>
  )
}
