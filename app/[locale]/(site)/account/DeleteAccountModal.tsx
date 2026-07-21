'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { deleteAccount } from './informationsActions'
import modal from '@/app/[locale]/tk-id/[token]/tkid.module.css'

type Props = {
  locale: string
  confirmWord: string
  triggerClassName: string
}

export default function DeleteAccountModal({ locale, confirmWord, triggerClassName }: Props) {
  const t = useTranslations('account')
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const armed = typed.trim().toUpperCase() === confirmWord.toUpperCase()

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
      <button
        type="button"
        className={triggerClassName}
        onClick={() => {
          setTyped('')
          setOpen(true)
        }}
      >
        {t('delete_account')}
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
              <h2 className={modal.modalTitle}>{t('delete_account_title')}</h2>
              <p className={modal.modalText}>{t('delete_account_text')}</p>
              <form action={deleteAccount} className={modal.modalForm}>
                <input type="hidden" name="locale" value={locale} />
                <label className={modal.field}>
                  <span className={modal.fieldLabel}>{t('delete_confirm_label', { word: confirmWord })}</span>
                  <input
                    className={modal.input}
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    autoComplete="off"
                    autoCapitalize="characters"
                  />
                </label>
                <div className={modal.modalActions}>
                  <button type="button" className={modal.cancel} onClick={() => setOpen(false)}>
                    {t('cancel')}
                  </button>
                  <button type="submit" className="u-cta u-cta--red-fill" disabled={!armed}>
                    {t('delete_confirm_cta')}
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
