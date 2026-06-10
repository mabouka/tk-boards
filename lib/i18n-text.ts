// Helpers for jsonb i18n text columns: { en, fr?, es? } with English as the
// primary (default) locale. Framework-free + DB-free so they can be unit-tested
// and shared between server actions (write) and read mappers.

export type I18nText = Record<string, string>

/** Build an i18n jsonb object — English is primary; fr/es added only when present. */
export function i18n(en: string, fr?: string, es?: string): I18nText {
  const o: I18nText = { en }
  if (fr) o.fr = fr
  if (es) o.es = es
  return o
}

/** Read one locale from a jsonb i18n value (safe on null/unknown). */
export const part = (j: unknown, key: string): string => (j as I18nText | null)?.[key] ?? ''

/** Read the primary (en) value, falling back to a default when absent. */
export const primary = (j: unknown, fallback: string) => part(j, 'en') || fallback
