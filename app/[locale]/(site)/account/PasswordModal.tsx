'use client'

import { useActionState, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { changePassword } from './informationsActions'
import modal from '@/app/[locale]/tk-id/[token]/tkid.module.css'

export default function PasswordModal({
  locale,
  triggerClassName,
}: {
  locale: string
  triggerClassName: string
}) {
  const t = useTranslations('account')
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(changePassword, null)

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
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {t('change')}
      </button>

      {open &&
        createPortal(
          <div
            className={modal.overlay}
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false)
            }}
          >
            <div className={modal.modal}>
              <h2 className={modal.modalTitle}>{t('change_password')}</h2>

              {state?.ok ? (
                <>
                  <p className={modal.modalText}>{t('password_changed')}</p>
                  <div className={modal.modalActions}>
                    <button type="button" className="u-cta u-cta--white-fill" onClick={() => setOpen(false)}>
                      {t('close')}
                    </button>
                  </div>
                </>
              ) : (
                <form action={action} className={modal.modalForm}>
                  <input type="hidden" name="locale" value={locale} />
                  <label className={modal.field}>
                    <span className={modal.fieldLabel}>
                      {t('current_password')} <span className="u-req">*</span>
                    </span>
                    <input name="current" type="password" required className={modal.input} autoComplete="current-password" />
                  </label>
                  <label className={modal.field}>
                    <span className={modal.fieldLabel}>
                      {t('new_password')} <span className="u-req">*</span>
                    </span>
                    <input name="next" type="password" required minLength={8} className={modal.input} autoComplete="new-password" />
                  </label>
                  <label className={modal.field}>
                    <span className={modal.fieldLabel}>
                      {t('confirm_password')} <span className="u-req">*</span>
                    </span>
                    <input name="confirm" type="password" required minLength={8} className={modal.input} autoComplete="new-password" />
                  </label>
                  {state?.error && (
                    <p className={modal.formError}>
                      {state.error === 'wrongcurrent'
                        ? t('wrong_current_password')
                        : state.error === 'nopassword'
                          ? t('no_password_account')
                          : t('password_invalid')}
                    </p>
                  )}
                  <div className={modal.modalActions}>
                    <button type="button" className={modal.cancel} onClick={() => setOpen(false)}>
                      {t('cancel')}
                    </button>
                    <button type="submit" className="u-cta u-cta--white-fill" disabled={pending}>
                      {t('save')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
