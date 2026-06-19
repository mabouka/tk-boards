'use client'

import { useActionState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Script from 'next/script'
import { submitContact, type ContactState } from './actions'
import { PRODUCTS } from './products'
import PhoneField from './PhoneField'
import styles from './ContactPage.module.css'

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

const FORM_ERROR_KEY = { rate: 'errorRate', captcha: 'errorCaptcha', send: 'errorSend' } as const

export default function ContactForm({ phoneCountry }: { phoneCountry: string }) {
  const t = useTranslations('contact')
  const locale = useLocale()
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContact, null)

  if (state?.ok) {
    return (
      <p className={styles.success} role="status">
        {t('success')}
      </p>
    )
  }

  const fe = state?.fieldErrors ?? {}
  const v = state?.values ?? {}

  return (
    <form className={styles.form} action={action}>
      {/* Locale → server (localized validation messages) */}
      <input type="hidden" name="locale" value={locale} />
      {/* Anti-spam honeypot (hidden from real users). */}
      <input
        type="text"
        name="website"
        className={styles.honeypot}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {state?.formError && (
        <p className={styles.error} role="alert">
          {t(FORM_ERROR_KEY[state.formError])}
        </p>
      )}

      <div className={styles.row2}>
        <div className={styles.field}>
          <label htmlFor="contact-first" className={styles.label}>
            {t('firstName')}
          </label>
          <input
            id="contact-first"
            name="firstName"
            type="text"
            autoComplete="given-name"
            placeholder={t('firstName')}
            className={styles.input}
            defaultValue={v.firstName}
            aria-invalid={!!fe.firstName}
            aria-describedby={fe.firstName ? 'err-first' : undefined}
            required
          />
          {fe.firstName && (
            <p id="err-first" className={styles.fieldError}>
              {fe.firstName}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="contact-last" className={styles.label}>
            {t('lastName')}
          </label>
          <input
            id="contact-last"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder={t('lastName')}
            className={styles.input}
            defaultValue={v.lastName}
            aria-invalid={!!fe.lastName}
            aria-describedby={fe.lastName ? 'err-last' : undefined}
            required
          />
          {fe.lastName && (
            <p id="err-last" className={styles.fieldError}>
              {fe.lastName}
            </p>
          )}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-email" className={styles.label}>
          {t('email')}
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t('email')}
          className={styles.input}
          defaultValue={v.email}
          aria-invalid={!!fe.email}
          aria-describedby={fe.email ? 'err-email' : undefined}
          required
        />
        {fe.email && (
          <p id="err-email" className={styles.fieldError}>
            {fe.email}
          </p>
        )}
      </div>

      <div className={`${styles.field} ${styles.fieldPhone}`}>
        <label htmlFor="contact-phone" className={styles.label}>
          {t('phone')}
        </label>
        <PhoneField defaultCountry={phoneCountry} />
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-product" className={styles.label}>
          {t('product')}
        </label>
        <div className={styles.selectWrap}>
          <select
            id="contact-product"
            name="product"
            defaultValue={v.product ?? ''}
            className={styles.select}
          >
            <option value="" disabled>
              {t('productPrompt')}
            </option>
            {PRODUCTS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.value === 'other' ? t('productOther') : p.label}
              </option>
            ))}
          </select>
          <span className={styles.selectChevron} aria-hidden="true" />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-message" className={styles.label}>
          {t('message')}
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          placeholder={t('message')}
          className={styles.textarea}
          defaultValue={v.message}
          aria-invalid={!!fe.message}
          aria-describedby={fe.message ? 'err-message' : undefined}
          required
        />
        {fe.message && (
          <p id="err-message" className={styles.fieldError}>
            {fe.message}
          </p>
        )}
      </div>

      {TURNSTILE_SITE_KEY && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="afterInteractive"
          />
          <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-theme="dark" />
        </>
      )}

      <button type="submit" className={`u-cta u-cta--white-fill ${styles.submit}`} disabled={pending}>
        {pending ? t('sending') : t('send')}
      </button>
    </form>
  )
}
