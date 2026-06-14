// Euro price formatter, one Intl instance per locale (cached).
const formatters: Record<string, Intl.NumberFormat> = {}

export function formatEur(amount: number, locale: string): string {
  formatters[locale] ??= new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  })
  return formatters[locale].format(amount)
}
