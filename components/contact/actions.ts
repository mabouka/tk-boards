'use server'

import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { clientIp } from '@/lib/client-ip'
import { verifyTurnstile } from '@/lib/turnstile'
import { sendContactEmail } from '@/lib/email'
import { productLabel } from './products'
import { EMAIL_RE } from '@/lib/email-validation'

const ContactSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.').max(100, 'Too long.'),
  lastName: z.string().trim().min(1, 'Last name is required.').max(100, 'Too long.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required.')
    .max(200, 'Too long.')
    .regex(EMAIL_RE, 'Enter a valid email address.'),
  phone: z.string().trim().max(40, 'Too long.').optional().default(''),
  product: z.string().trim().max(60).optional().default(''),
  message: z
    .string()
    .trim()
    .min(1, 'Please write a short message.')
    .max(5000, 'Message is too long (5000 characters max).'),
})

type Field = keyof z.infer<typeof ContactSchema>

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

  const parsed = ContactSchema.safeParse(values)
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
