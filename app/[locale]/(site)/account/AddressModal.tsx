'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { addAddress, updateAddress } from './informationsActions'
import modal from '@/app/[locale]/tk-id/[token]/tkid.module.css'

export type Address = {
  id: string
  label: string | null
  line1: string
  line2: string | null
  postalCode: string | null
  city: string | null
  country: string | null
  phone: string | null
}

export default function AddressModal({
  locale,
  address,
  triggerClassName,
}: {
  locale: string
  address?: Address
  triggerClassName: string
}) {
  const t = useTranslations('account')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState(false)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const res = await (address ? updateAddress : addAddress)(null, formData)
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
        {address ? t('edit') : t('add_address')}
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
              <h2 className={modal.modalTitle}>{address ? t('edit_address') : t('add_address')}</h2>
              <form action={onSubmit} className={modal.modalForm}>
                <input type="hidden" name="locale" value={locale} />
                {address && <input type="hidden" name="id" value={address.id} />}

                <label className={modal.field}>
                  <span className={modal.fieldLabel}>{t('address_label')}</span>
                  <input name="label" className={modal.input} defaultValue={address?.label ?? ''} placeholder={t('address_label_ph')} />
                </label>
                <label className={modal.field}>
                  <span className={modal.fieldLabel}>
                    {t('address_line1')} <span className="u-req">*</span>
                  </span>
                  <input name="line1" required className={modal.input} defaultValue={address?.line1 ?? ''} autoComplete="address-line1" />
                </label>
                <label className={modal.field}>
                  <span className={modal.fieldLabel}>{t('address_line2')}</span>
                  <input name="line2" className={modal.input} defaultValue={address?.line2 ?? ''} autoComplete="address-line2" />
                </label>
                <label className={modal.field}>
                  <span className={modal.fieldLabel}>
                    {t('address_postal')} <span className="u-req">*</span>
                  </span>
                  <input name="postalCode" required className={modal.input} defaultValue={address?.postalCode ?? ''} autoComplete="postal-code" />
                </label>
                <label className={modal.field}>
                  <span className={modal.fieldLabel}>
                    {t('address_city')} <span className="u-req">*</span>
                  </span>
                  <input name="city" required className={modal.input} defaultValue={address?.city ?? ''} autoComplete="address-level2" />
                </label>
                <label className={modal.field}>
                  <span className={modal.fieldLabel}>
                    {t('address_country')} <span className="u-req">*</span>
                  </span>
                  <input name="country" required className={modal.input} defaultValue={address?.country ?? ''} autoComplete="country-name" />
                </label>
                <label className={modal.field}>
                  <span className={modal.fieldLabel}>{t('phone')}</span>
                  <input name="phone" type="tel" className={modal.input} defaultValue={address?.phone ?? ''} autoComplete="tel" />
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
