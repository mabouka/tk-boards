'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { updateProfile } from './informationsActions'
import modal from '@/app/[locale]/tk-id/[token]/tkid.module.css'

type Props = {
  locale: string
  firstName: string
  lastName: string
  phone: string
  triggerClassName: string
}

export default function ProfileModal({ locale, firstName, lastName, phone, triggerClassName }: Props) {
  const t = useTranslations('account')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState(false)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const res = await updateProfile(null, formData)
      if (res?.ok) {
        setError(false)
        setOpen(false)
      } else {
        setError(true)
      }
    })
  }

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
        {t('edit')}
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
              <h2 className={modal.modalTitle}>{t('identity')}</h2>
              <form action={onSubmit} className={modal.modalForm}>
                <input type="hidden" name="locale" value={locale} />
                <label className={modal.field}>
                  <span className={modal.fieldLabel}>
                    {t('first_name')} <span className="u-req">*</span>
                  </span>
                  <input name="firstName" required className={modal.input} defaultValue={firstName} autoComplete="given-name" />
                </label>
                <label className={modal.field}>
                  <span className={modal.fieldLabel}>
                    {t('last_name')} <span className="u-req">*</span>
                  </span>
                  <input name="lastName" required className={modal.input} defaultValue={lastName} autoComplete="family-name" />
                </label>
                <label className={modal.field}>
                  <span className={modal.fieldLabel}>
                    {t('phone')} <span className="u-req">*</span>
                  </span>
                  <input name="phone" type="tel" required className={modal.input} defaultValue={phone} autoComplete="tel" />
                </label>
                {error && <p className={modal.formError}>{t('save_error')}</p>}
                <div className={modal.modalActions}>
                  <button type="button" className={modal.cancel} onClick={() => setOpen(false)}>
                    {t('cancel')}
                  </button>
                  <button type="submit" className="u-cta u-cta--white-fill" disabled={pending}>
                    {t('save')}
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
