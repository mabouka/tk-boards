import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Constant-time string comparison, for secrets arriving from a request.
 *
 * `===` on strings stops at the first differing byte, so how long the answer takes
 * leaks how much of a prefix the caller got right — enough, given many attempts, to
 * walk a secret out one character at a time.
 *
 * Both sides are hashed to a fixed 32 bytes before comparing. That is not for
 * secrecy: `timingSafeEqual` throws on length mismatch, and comparing raw inputs
 * would both crash on a short guess and leak the secret's length. Hashing makes
 * every comparison the same shape.
 */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (a == null || b == null) return false
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}
