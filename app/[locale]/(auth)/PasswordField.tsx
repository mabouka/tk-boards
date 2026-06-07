'use client'

import { useState } from 'react'
import { LockIcon, EyeIcon, EyeOffIcon } from '@/components/auth/icons'
import styles from './auth.module.css'

type Props = {
  name: string
  placeholder: string
  autoComplete?: string
  minLength?: number
  showLabel: string
  hideLabel: string
}

export default function PasswordField({
  name,
  placeholder,
  autoComplete = 'current-password',
  minLength,
  showLabel,
  hideLabel,
}: Props) {
  const [show, setShow] = useState(false)

  return (
    <label className={styles.inputWrap}>
      <LockIcon />
      <input
        className={styles.field}
        name={name}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        required
      />
      <button
        type="button"
        className={`${styles.eyeBtn} ${show ? styles.on : ''}`}
        aria-label={show ? hideLabel : showLabel}
        onClick={() => setShow((s) => !s)}
      >
        <EyeIcon className={styles.icOn} />
        <EyeOffIcon className={styles.icOff} />
      </button>
    </label>
  )
}
