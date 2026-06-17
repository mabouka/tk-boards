// Euro price formatter, one Intl instance per locale+precision (cached).
const formatters: Record<string, Intl.NumberFormat> = {}

export function formatEur(amount: number, locale: string): string {
  // Uniform "140 €" / "1 480 €" site-wide: localized number + a spaced "€" suffix
  // (no locale-specific symbol placement), with cents only when needed (140 € vs 140,50 €).
  const fractionDigits = Number.isInteger(amount) ? 0 : 2
  const key = `${locale}:${fractionDigits}`
  formatters[key] ??= new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
  return `${formatters[key].format(amount)} €`
}
