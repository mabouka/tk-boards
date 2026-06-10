'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { resetPassword } from './actions'
import PasswordField from './PasswordField'
import styles from './auth.module.css'

export default function ResetPasswordForm({ locale, token }: { locale: string; token: string }) {
  const t = useTranslations('auth')
  const [state, action, pending] = useActionState(resetPassword, null)

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>{t('new_password_title')}</h1>
      <p className={styles.subtitle}>{t('new_password_sub')}</p>

      <div className={styles.step}>
        <form className={styles.form} action={action}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="token" value={token} />
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
          {(state?.error === 'reset' || state?.error === 'reset-invalid') && (
            <p className={styles.error}>{t('error_reset')}</p>
          )}
          <div className={styles.actions}>
            <button
              className={`u-cta u-cta--white-fill ${styles.btnRow}`}
              type="submit"
              disabled={pending}
            >
              {pending ? t('checking') : t('update_password')}
            </button>
          </div>
        </form>

        <Link href={`/${locale}/login`} className={styles.changeEmail}>
          ← {t('back_to_signin')}
        </Link>
      </div>
    </div>
  )
}
