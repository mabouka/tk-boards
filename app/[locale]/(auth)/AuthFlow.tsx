'use client'

import { useActionState, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { login, signup, signInWithGoogle, signInWithFacebook, resendVerification } from './actions'
import PasswordField from './PasswordField'
import { AtIcon, GoogleIcon, FacebookIcon } from '@/components/auth/icons'
import { EMAIL_RE } from '@/lib/email-validation'
import styles from './auth.module.css'

type Step = 'email' | 'signin' | 'signup' | 'oauth'

export default function AuthFlow({
  flash,
  callbackUrl,
}: {
  flash?: 'verified' | 'reset'
  callbackUrl?: string
}) {
  const t = useTranslations('auth')
  const locale = useLocale()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState(false)
  const [emailError, setEmailError] = useState(false)
  const [providers, setProviders] = useState<string[]>([])

  const [loginState, loginAction, loginPending] = useActionState(login, null)
  const [signupState, signupAction, signupPending] = useActionState(signup, null)
  const [resendState, resendAction, resendPending] = useActionState(resendVerification, null)

  async function onContinue(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setEmailError(true)
      return
    }
    setChecking(true)
    setCheckError(false)
    try {
      const res = await fetch('/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      })
      if (!res.ok) {
        setCheckError(true)
        return
      }
      const data = await res.json()
      if (!data.exists) {
        setStep('signup')
      } else if (data.hasPassword) {
        setStep('signin')
      } else {
        // Account exists but has no password (signed up via Google/Facebook).
        setProviders(Array.isArray(data.providers) ? data.providers : [])
        setStep('oauth')
      }
    } catch {
      setCheckError(true)
    } finally {
      setChecking(false)
    }
  }

  const legal = t.rich('legal', {
    terms: (c) => <Link href={`/${locale}`}>{c}</Link>,
    privacy: (c) => <Link href={`/${locale}`}>{c}</Link>,
  })

  // ── STEP: email-first ──
  if (step === 'email') {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>

        <div className={styles.step}>
          {flash && (
            <p className={styles.notice}>
              {flash === 'verified' ? t('verified_notice') : t('reset_done')}
            </p>
          )}
          <div className={styles.social}>
            <form action={signInWithGoogle}>
              <input type="hidden" name="locale" value={locale} />
              <button className={`u-cta u-cta--white-outline ${styles.btnRow}`} type="submit">
                <GoogleIcon />
                {t('continue_google')}
              </button>
            </form>
            <form action={signInWithFacebook}>
              <input type="hidden" name="locale" value={locale} />
              <button className={`u-cta u-cta--white-outline ${styles.btnRow}`} type="submit">
                <FacebookIcon />
                {t('continue_facebook')}
              </button>
            </form>
          </div>

          <div className={styles.divider}>
            <span>{t('or')}</span>
          </div>

          <form className={styles.form} onSubmit={onContinue}>
            <p className={styles.formLabel}>{t('email_first_label')}</p>
            <label className={styles.inputWrap}>
              <AtIcon />
              <input
                className={styles.field}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t('email_placeholder')}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setEmailError(false)
                }}
                required
              />
            </label>
            {emailError && <p className={styles.fieldError}>{t('error_email')}</p>}
            {checkError && <p className={styles.fieldError}>{t('error_generic')}</p>}
            <div className={styles.actions}>
              <button
                className={`u-cta u-cta--white-fill ${styles.btnRow}`}
                type="submit"
                disabled={checking}
              >
                {checking ? t('checking') : t('continue')}
              </button>
            </div>
          </form>

          <p className={styles.legal}>{legal}</p>
        </div>
      </div>
    )
  }

  // ── STEP: returning user with no password (signed up via a social provider) ──
  if (step === 'oauth') {
    const showGoogle = providers.length === 0 || providers.includes('google')
    const showFacebook = providers.includes('facebook')
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>{t('welcome_back')}</h1>
        <div className={styles.step}>
          <button type="button" className={styles.changeEmail} onClick={() => setStep('email')}>
            ← {email}
          </button>
          <p className={styles.subtitle}>{t('oauth_only')}</p>
          <div className={styles.social}>
            {showGoogle && (
              <form action={signInWithGoogle}>
                <input type="hidden" name="locale" value={locale} />
                <button className={`u-cta u-cta--white-outline ${styles.btnRow}`} type="submit">
                  <GoogleIcon />
                  {t('continue_google')}
                </button>
              </form>
            )}
            {showFacebook && (
              <form action={signInWithFacebook}>
                <input type="hidden" name="locale" value={locale} />
                <button className={`u-cta u-cta--white-outline ${styles.btnRow}`} type="submit">
                  <FacebookIcon />
                  {t('continue_facebook')}
                </button>
              </form>
            )}
          </div>
          <Link href={`/${locale}/forgot-password`} className={styles.changeEmail}>
            {t('set_password_link')}
          </Link>
        </div>
      </div>
    )
  }

  // ── STEP: returning user (password only) ──
  if (step === 'signin') {
    const unverified = loginState?.error === 'unverified'
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>{t('welcome_back')}</h1>
        <div className={styles.step}>
          <button type="button" className={styles.changeEmail} onClick={() => setStep('email')}>
            ← {email}
          </button>
          <form className={styles.form} action={loginAction}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="email" value={email} />
            {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
            <PasswordField
              name="password"
              placeholder={t('password')}
              autoComplete="current-password"
              showLabel={t('show_password')}
              hideLabel={t('hide_password')}
            />
            {loginState?.error && (
              <p className={styles.error}>
                {loginState.error === 'unverified'
                  ? t('error_unverified')
                  : loginState.error === 'rate'
                    ? t('error_rate')
                    : t('error_invalid')}
              </p>
            )}
            <div className={styles.actions}>
              <button
                className={`u-cta u-cta--white-fill ${styles.btnRow}`}
                type="submit"
                disabled={loginPending}
              >
                {t('sign_in')}
              </button>
            </div>
          </form>

          {unverified &&
            (resendState?.notice === 'check-email' ? (
              <p className={styles.notice}>{t('check_email')}</p>
            ) : (
              <form action={resendAction}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="email" value={email} />
                {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
                <button type="submit" className={styles.changeEmail} disabled={resendPending}>
                  {t('resend_verification')}
                </button>
              </form>
            ))}

          <Link href={`/${locale}/forgot-password`} className={styles.changeEmail}>
            {t('forgot_password')}
          </Link>
        </div>
      </div>
    )
  }

  // ── STEP: sign-up succeeded → confirmation (replaces the form) ──
  if (signupState?.notice === 'check-email') {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>{t('check_email_title')}</h1>
        <div className={styles.step}>
          <p className={styles.subtitle}>{t('check_email')}</p>
          <button type="button" className={styles.changeEmail} onClick={() => setStep('email')}>
            ← {email}
          </button>
        </div>
      </div>
    )
  }

  // ── STEP: new user (first/last + password + confirm) ──
  return (
    <div className={styles.card}>
      <h1 className={styles.title}>{t('create_title')}</h1>
      <div className={styles.step}>
        <button type="button" className={styles.changeEmail} onClick={() => setStep('email')}>
          ← {email}
        </button>
        <form className={styles.form} action={signupAction}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="email" value={email} />
          {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
          <div className={styles.row2}>
            <input
              className={styles.field}
              name="first_name"
              type="text"
              placeholder={t('first_name')}
              autoComplete="given-name"
              required
            />
            <input
              className={styles.field}
              name="last_name"
              type="text"
              placeholder={t('last_name')}
              autoComplete="family-name"
              required
            />
          </div>
          <PasswordField
            name="password"
            placeholder={t('password_min')}
            autoComplete="new-password"
            minLength={8}
            showLabel={t('show_password')}
            hideLabel={t('hide_password')}
          />
          <PasswordField
            name="password2"
            placeholder={t('confirm_password')}
            autoComplete="new-password"
            minLength={8}
            showLabel={t('show_password')}
            hideLabel={t('hide_password')}
          />
          {signupState?.error && <p className={styles.error}>{t('error_signup')}</p>}
          <div className={styles.actions}>
            <button
              className={`u-cta u-cta--white-fill ${styles.btnRow}`}
              type="submit"
              disabled={signupPending}
            >
              {t('sign_up')}
            </button>
          </div>
        </form>
        <p className={styles.legal}>{legal}</p>
      </div>
    </div>
  )
}
