/**
 * Pragmatic email shape check — stricter than HTML5 `type="email"` (which
 * accepts "a@b"): requires one `@`, a dotted domain, a 2+ char TLD, and no
 * whitespace. Not RFC-complete. Shared by the contact, auth, and admin flows.
 */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
