'use client'

import { useActionState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLocale, useTranslations } from 'next-intl'
import TurnstileField from '@/components/auth/TurnstileField'
import { submitProductContact, type ProductContactState } from './actions'
import styles from './ProductContactModal.module.css'

/**
 * Lean "contact us about this product" modal, shown from the storefront when the
 * shop is off. One name box, email, message — the product name rides along in a
 * hidden field so the email says which board it's about. Same hardened server path
 * as the contact page (honeypot + rate limit + Turnstile).
 */
export default function ProductContactModal({
  productName,
  onClose,
}: {
  productName: string
  onClose: () => void
}) {
  const t = useTranslations('boards')
  const locale = useLocale()
  const [state, action, pending] = useActionState<ProductContactState, FormData>(
    submitProductContact,
    null
  )

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const errorMessage = state?.error
    ? t(
        state.error === 'rate'
          ? 'contact_err_rate'
          : state.error === 'captcha'
            ? 'contact_err_captcha'
            : state.error === 'send'
              ? 'contact_err_send'
              : 'contact_err_invalid'
      )
    : null

  // Portalled to <body>: the product section is GSAP-transformed, and a transformed
  // ancestor makes position:fixed resolve against that ancestor instead of the
  // viewport — which trapped the overlay inside the section. Safe without a mount
  // guard: this only renders after a click, never during SSR.
  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.head}>
          <h2 className={styles.title}>{t('contact_title')}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label={t('close')}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {state?.ok ? (
          <p className={styles.success} role="status">
            {t('contact_sent')}
          </p>
        ) : (
          <>
            <p className={styles.intro}>{t('contact_intro')}</p>
            <form className={styles.form} action={action}>
              <input type="hidden" name="product" value={productName} />
              <input type="hidden" name="locale" value={locale} />
              <input
                type="text"
                name="website"
                className={styles.honeypot}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <label className={styles.label}>
                {t('contact_name')}
                <input
                  name="name"
                  className={styles.input}
                  required
                  defaultValue={state?.values?.name ?? ''}
                />
              </label>
              <label className={styles.label}>
                {t('contact_email')}
                <input
                  name="email"
                  type="email"
                  className={styles.input}
                  required
                  defaultValue={state?.values?.email ?? ''}
                />
              </label>
              <label className={styles.label}>
                {t('contact_message')}
                <textarea
                  name="message"
                  className={styles.textarea}
                  required
                  defaultValue={state?.values?.message ?? ''}
                />
              </label>

              <TurnstileField />
              {errorMessage && <p className={styles.error}>{errorMessage}</p>}

              <button
                type="submit"
                className={`u-cta u-cta--white-fill ${styles.submit}`}
                disabled={pending}
              >
                {pending ? t('contact_sending') : t('contact_send')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
