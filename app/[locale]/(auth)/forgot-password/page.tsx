'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { requestPasswordReset } from '../actions'
import { AtIcon } from '@/components/auth/icons'
import styles from '../auth.module.css'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const [state, action, pending] = useActionState(requestPasswordReset, null)
  const sent = state?.notice === 'reset-sent'

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>{sent ? t('check_email_title') : t('reset_title')}</h1>
      <p className={styles.subtitle}>{sent ? t('reset_sent') : t('reset_label')}</p>

      <div className={styles.step}>
        {!sent && (
          <form className={styles.form} action={action}>
            <input type="hidden" name="locale" value={locale} />
            <label className={styles.inputWrap}>
              <AtIcon />
              <input
                className={styles.field}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t('email_placeholder')}
                required
              />
            </label>
            <div className={styles.actions}>
              <button
                className={`u-cta u-cta--white-fill ${styles.btnRow}`}
                type="submit"
                disabled={pending}
              >
                {pending ? t('checking') : t('reset_send')}
              </button>
            </div>
          </form>
        )}

        <Link href={`/${locale}/login`} className={styles.changeEmail}>
          ← {t('back_to_signin')}
        </Link>
      </div>
    </div>
  )
}
