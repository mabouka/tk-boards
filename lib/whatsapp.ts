/**
 * Build a wa.me link from a stored WhatsApp value (a phone number or a full URL,
 * per Sanity contactSettings), or null when there's no usable number.
 *
 * The stored value gets normalised to digits — `+32 499…`, `0032 499…` and
 * `https://wa.me/32499…` all reduce to the same string — so both the contact page
 * and the product contact CTA agree on one rule rather than each stripping digits
 * their own way.
 *
 * Pass `text` to pre-fill the message (it's URL-encoded here).
 */
export function waLink(whatsapp: string | null | undefined, text?: string): string | null {
  const digits = whatsapp?.replace(/\D/g, '') ?? ''
  if (!digits) return null
  const query = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${digits}${query}`
}
