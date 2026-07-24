'use client'

import { useActionState, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { contactOwner } from './actions'
import styles from './tkid.module.css'

// Public "contact the owner" button on a registered (not-yet-lost) board. Lets
// a finder message the owner; the message is emailed to them and their address
// is never revealed (the finder only leaves their own reply-to).
export default function ContactOwnerModal({ locale, token }: { locale: string; token: string }) {
  const t = useTranslations('tkid')
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(contactOwner, null)

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button type="button" className="u-cta u-cta--white-fill" onClick={() => setOpen(true)}>
        {t('contact_owner')}
      </button>

      {open &&
        createPortal(
          <div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false)
            }}
          >
            <div className={styles.modal}>
              <h2 id="contact-modal-title" className={styles.modalTitle}>
                {t('contact_owner_title')}
              </h2>

              {state?.ok ? (
                <>
                  <p className={styles.modalText}>{t('contact_owner_sent')}</p>
                  <div className={styles.modalActions}>
                    <button type="button" className="u-cta u-cta--white-fill" onClick={() => setOpen(false)}>
                      {t('close')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className={styles.modalText}>{t('contact_owner_text')}</p>
                  <form action={action} className={styles.modalForm}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="token" value={token} />

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>
                        {t('lost_note_label')} <span className="u-req">*</span>
                      </span>
                      <textarea
                        name="message"
                        className={styles.textarea}
                        rows={3}
                        maxLength={2000}
                        placeholder={t('contact_owner_placeholder')}
                        required
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>
                        {t('lost_email_label')} <span className="u-req">*</span>
                      </span>
                      <input
                        name="email"
                        type="email"
                        className={styles.input}
                        placeholder={t('lost_email_placeholder')}
                        autoComplete="email"
                        required
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>{t('lost_phone_label')}</span>
                      <input
                        name="phone"
                        type="tel"
                        className={styles.input}
                        placeholder={t('lost_phone_placeholder')}
                        autoComplete="tel"
                      />
                    </label>

                    {state?.error && <p className={styles.formError}>{t('contact_owner_error')}</p>}

                    <div className={styles.modalActions}>
                      <button type="submit" className="u-cta u-cta--white-fill" disabled={pending}>
                        {t('contact_owner_send')}
                      </button>
                      <button type="button" className={styles.cancel} onClick={() => setOpen(false)}>
                        {t('cancel')}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
