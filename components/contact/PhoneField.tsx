'use client'

import { useState } from 'react'
import { PhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'
import styles from './ContactPage.module.css'

/** International phone input (react-international-phone), themed for the TK form.
 *  `defaultCountry` is resolved server-side from the visitor's IP (see ContactPage). */
export default function PhoneField({ defaultCountry = 'fr' }: { defaultCountry?: string }) {
  const [phone, setPhone] = useState('')
  // "filled" once digits go beyond the dial code — drives the grey→white text.
  const [filled, setFilled] = useState(false)
  return (
    <PhoneInput
      defaultCountry={defaultCountry}
      value={phone}
      onChange={(value, meta) => {
        setPhone(value)
        const digits = value.replace(/\D/g, '')
        setFilled(digits.length > meta.country.dialCode.length)
      }}
      inputProps={{ id: 'contact-phone', name: 'phone' }}
      className={`${styles.phone}${filled ? ` ${styles.phoneFilled}` : ''}`}
    />
  )
}
