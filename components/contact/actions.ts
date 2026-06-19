'use server'

import { z } from 'zod'
import { getTranslations } from 'next-intl/server'
import { rateLimit } from '@/lib/rate-limit'
import { clientIp } from '@/lib/client-ip'
import { verifyTurnstile } from '@/lib/turnstile'
import { sendContactEmail } from '@/lib/email'
import { productLabel } from './products'
import { EMAIL_RE } from '@/lib/email-validation'

const LOCALES = ['fr', 'en', 'es']
type Field = 'firstName' | 'lastName' | 'email' | 'phone' | 'product' | 'message'

export type ContactState = {
  ok?: true
  /** Non-field error (throttling / captcha / delivery failure). */
  formError?: 'rate' | 'captcha' | 'send'
  /** Per-field validation messages. */
  fieldErrors?: Partial<Record<Field, string>>
  /** Echoed back so the form keeps what the user typed after an error. */
  values?: Partial<Record<Field, string>>
} | null

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Honeypot: a hidden field only bots fill — pretend success, send nothing.
  if (String(formData.get('website') ?? '').trim() !== '') return { ok: true }

  const values: Record<Field, string> = {
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    email: String(formData.get('email') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    product: String(formData.get('product') ?? ''),
    message: String(formData.get('message') ?? ''),
  }

  // Throttle by IP (5 submissions / 5 min).
  const ip = await clientIp()
  if (!(await rateLimit('contact-ip', ip, 5, 300))) return { formError: 'rate', values }

  // Cloudflare Turnstile (no-op when no secret is configured).
  const token = formData.get('cf-turnstile-response')
  if (!(await verifyTurnstile(typeof token === 'string' ? token : null, ip))) {
    return { formError: 'captcha', values }
  }

  // Localized validation messages — locale comes from a hidden form field.
  const rawLocale = String(formData.get('locale') ?? 'en')
  const locale = LOCALES.includes(rawLocale) ? rawLocale : 'en'
  const t = await getTranslations({ locale, namespace: 'contact' })
  const schema = z.object({
    firstName: z.string().trim().min(1, t('vFirstName')).max(100, t('vTooLong')),
    lastName: z.string().trim().min(1, t('vLastName')).max(100, t('vTooLong')),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, t('vEmailRequired'))
      .max(200, t('vTooLong'))
      .regex(EMAIL_RE, t('vEmailInvalid')),
    phone: z.string().trim().max(40, t('vTooLong')).optional().default(''),
    product: z.string().trim().max(60).optional().default(''),
    message: z.string().trim().min(1, t('vMessage')).max(5000, t('vMessageLong')),
  })

  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    const fieldErrors: Partial<Record<Field, string>> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string' && !fieldErrors[key as Field]) {
        fieldErrors[key as Field] = issue.message
      }
    }
    return { fieldErrors, values }
  }

  try {
    // Send the human label ("Wave Pro") rather than the raw code ("wave-pro").
    await sendContactEmail({ ...parsed.data, product: productLabel(parsed.data.product) })
  } catch {
    return { formError: 'send', values }
  }
  return { ok: true }
}
