'use server'

import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { clientIp } from '@/lib/client-ip'
import { verifyTurnstile } from '@/lib/turnstile'
import { sendContactEmail } from '@/lib/email'
import { EMAIL_RE } from '@/lib/email-validation'

export type ProductContactState = {
  ok?: true
  error?: 'invalid' | 'rate' | 'captcha' | 'send'
  values?: { name?: string; email?: string; message?: string }
} | null

/**
 * The "contact us about this product" form shown in place of buy/cart when the
 * shop is off (V1). A leaner schema than the full contact page — one name field, no
 * phone — but the same hardened path: honeypot, IP rate limit, Turnstile, then the
 * same email the contact page sends. A separate action, rather than bending the
 * contact page's stricter first/last-name schema to fit one box.
 */
export async function submitProductContact(
  _prev: ProductContactState,
  formData: FormData
): Promise<ProductContactState> {
  // Honeypot: a filled hidden field means a bot. Answer OK so it learns nothing.
  if (String(formData.get('website') ?? '').trim() !== '') return { ok: true }

  const values = {
    name: String(formData.get('name') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim(),
    message: String(formData.get('message') ?? '').trim(),
  }
  const product = String(formData.get('product') ?? '').slice(0, 80)

  const ip = await clientIp()
  if (!(await rateLimit('product-contact-ip', ip, 5, 300))) return { error: 'rate', values }

  const token = formData.get('cf-turnstile-response')
  if (!(await verifyTurnstile(typeof token === 'string' ? token : null, ip))) {
    return { error: 'captcha', values }
  }

  const parsed = z
    .object({
      name: z.string().min(1).max(120),
      email: z.string().max(200).regex(EMAIL_RE),
      message: z.string().min(1).max(5000),
    })
    .safeParse(values)
  if (!parsed.success) return { error: 'invalid', values }

  try {
    await sendContactEmail({
      firstName: parsed.data.name,
      lastName: '', // one name box; the email template just prints them joined
      email: parsed.data.email,
      product,
      message: parsed.data.message,
    })
  } catch {
    return { error: 'send', values }
  }
  return { ok: true }
}
