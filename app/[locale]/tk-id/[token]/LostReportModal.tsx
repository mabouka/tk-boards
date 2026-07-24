'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { declareStolen } from './actions'
import styles from './tkid.module.css'

// Owner-only: opens a modal to collect a public message + contact (email/phone)
// then submits `declareStolen`, which flips the board to lost/stolen and stores
// the report for the public page.
export default function LostReportModal({ locale, token }: { locale: string; token: string }) {
  const t = useTranslations('tkid')
  const [open, setOpen] = useState(false)

  // Lock body scroll + close on Escape while the modal is open.
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
      <button type="button" className="u-cta u-cta--red-outline" onClick={() => setOpen(true)}>
        {t('declare_stolen')}
      </button>

      {open &&
        createPortal(
          <div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lost-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false)
            }}
          >
            <div className={styles.modal}>
              <h2 id="lost-modal-title" className={styles.modalTitle}>
                {t('lost_modal_title')}
              </h2>
              <p className={styles.modalText}>{t('lost_modal_text')}</p>

              <form action={declareStolen} className={styles.modalForm}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="token" value={token} />

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>
                    {t('lost_note_label')} <span className="u-req">*</span>
                  </span>
                  <textarea
                    name="note"
                    className={styles.textarea}
                    rows={3}
                    maxLength={1000}
                    placeholder={t('lost_note_placeholder')}
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{t('lost_email_label')}</span>
                  <input
                    name="email"
                    type="email"
                    className={styles.input}
                    placeholder={t('lost_email_placeholder')}
                    autoComplete="email"
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

                <div className={styles.modalActions}>
                  <button type="submit" className="u-cta u-cta--red-fill">
                    {t('declare_stolen')}
                  </button>
                  <button type="button" className={styles.cancel} onClick={() => setOpen(false)}>
                    {t('cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
