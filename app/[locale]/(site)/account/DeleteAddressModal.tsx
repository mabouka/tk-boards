'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { deleteAddress } from './informationsActions'
import modal from '@/app/[locale]/tk-id/[token]/tkid.module.css'

type Props = {
  locale: string
  id: string
  label: string
  triggerClassName: string
}

export default function DeleteAddressModal({ locale, id, label, triggerClassName }: Props) {
  const t = useTranslations('account')
  const [open, setOpen] = useState(false)

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
        {t('delete')}
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
              <h2 className={modal.modalTitle}>{t('delete_address_title')}</h2>
              <p className={modal.modalText}>{t('delete_address_text', { label })}</p>
              <form action={deleteAddress} className={modal.modalActions}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="id" value={id} />
                <button type="button" className={modal.cancel} onClick={() => setOpen(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="u-cta u-cta--red-fill">
                  {t('delete')}
                </button>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
