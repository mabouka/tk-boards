// Shared admin formatters. Intl instances live at module level (one per process)
// instead of `new Intl…` on every call/render.

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' })

/** Localized medium date, or an em-dash for null/undefined. */
export const fmtDate = (d: Date | null | undefined): string => (d ? dateFmt.format(d) : '—')

/** Display name from first/last, falling back to the legacy `name`, then an em-dash. */
export const fullName = (
  firstName: string | null,
  lastName: string | null,
  name: string | null
): string => [firstName, lastName].filter(Boolean).join(' ') || name || '—'
