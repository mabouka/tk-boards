// Euro price formatter, one Intl instance per locale+precision (cached).
const formatters: Record<string, Intl.NumberFormat> = {}

export function formatEur(amount: number, locale: string): string {
  // Round to cents first so float drift (e.g. 49.999999) doesn't mis-detect a
  // whole amount, and clamp non-finite values so a bad price never renders "NaN €".
  const safe = Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0
  // Uniform "140 €" / "1 480 €" site-wide: localized number + a spaced "€" suffix,
  // with cents only when needed (140 € vs 140,50 €).
  const fractionDigits = Number.isInteger(safe) ? 0 : 2
  const key = `${locale}:${fractionDigits}`
  formatters[key] ??= new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
  return `${formatters[key].format(safe)} €`
}
