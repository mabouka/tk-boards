'use client'

import { useActionState, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { initiateTransfer } from './transferActions'
import modal from '@/app/[locale]/tk-id/[token]/tkid.module.css'

export default function TransferModal({ locale, token }: { locale: string; token: string }) {
  const t = useTranslations('account')
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(initiateTransfer, null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button type="button" className="u-cta u-cta--white-outline" onClick={() => setOpen(true)}>
        {t('transfer_board')}
      </button>

      {open &&
        createPortal(
          <div
            className={modal.overlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="transfer-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false)
            }}
          >
            <div className={modal.modal}>
              <h2 id="transfer-modal-title" className={modal.modalTitle}>
                {t('transfer_title')}
              </h2>

              {state?.ok ? (
                <>
                  <p className={modal.modalText}>{t('transfer_sent')}</p>
                  <div className={modal.modalActions}>
                    <button type="button" className="u-cta u-cta--white-fill" onClick={() => setOpen(false)}>
                      {t('close')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className={modal.modalText}>{t('transfer_text')}</p>
                  <form action={action} className={modal.modalForm}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="token" value={token} />
                    <label className={modal.field}>
                      <span className={modal.fieldLabel}>
                        {t('transfer_email_label')} <span className="u-req">*</span>
                      </span>
                      <input
                        name="email"
                        type="email"
                        required
                        className={modal.input}
                        placeholder={t('transfer_email_ph')}
                        autoComplete="off"
                      />
                    </label>
                    {state?.error && <p className={modal.formError}>{t('transfer_error')}</p>}
                    <div className={modal.modalActions}>
                      <button type="submit" className="u-cta u-cta--white-fill" disabled={pending}>
                        {t('transfer_send')}
                      </button>
                      <button type="button" className={modal.cancel} onClick={() => setOpen(false)}>
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
