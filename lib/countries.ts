// Broad worldwide list of ISO 3166-1 alpha-2 codes we may ship to. Names are
// derived per-locale via Intl.DisplayNames so we don't maintain translations.
// Sanctioned / Stripe-unsupported destinations (CU, IR, KP, SY, RU) are omitted.
export const COUNTRY_CODES = [
  'AD', 'AE', 'AF', 'AG', 'AL', 'AM', 'AO', 'AR', 'AT', 'AU', 'AW', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BN', 'BO', 'BR', 'BS', 'BT', 'BW', 'BY', 'BZ',
  'CA', 'CD', 'CG', 'CH', 'CI', 'CL', 'CM', 'CN', 'CO', 'CR', 'CV', 'CY', 'CZ',
  'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ',
  'EC', 'EE', 'EG', 'ER', 'ES', 'ET',
  'FI', 'FJ', 'FR',
  'GA', 'GB', 'GD', 'GE', 'GH', 'GM', 'GN', 'GQ', 'GR', 'GT', 'GW', 'GY',
  'HK', 'HN', 'HR', 'HT', 'HU',
  'ID', 'IE', 'IL', 'IN', 'IQ', 'IS', 'IT',
  'JM', 'JO', 'JP',
  'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KR', 'KW', 'KZ',
  'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY',
  'MA', 'MC', 'MD', 'ME', 'MG', 'MK', 'ML', 'MM', 'MN', 'MR', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ',
  'NA', 'NE', 'NG', 'NI', 'NL', 'NO', 'NP', 'NZ',
  'OM',
  'PA', 'PE', 'PG', 'PH', 'PK', 'PL', 'PT', 'PY',
  'QA',
  'RO', 'RS', 'RW',
  'SA', 'SB', 'SC', 'SE', 'SG', 'SI', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'ST', 'SV', 'SZ',
  'TD', 'TG', 'TH', 'TJ', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TW', 'TZ',
  'UA', 'UG', 'US', 'UY', 'UZ',
  'VC', 'VE', 'VN', 'VU',
  'WS',
  'YE',
  'ZA', 'ZM', 'ZW',
] as const

const CODE_SET = new Set<string>(COUNTRY_CODES)

export function isCountryCode(code: string): boolean {
  return CODE_SET.has(code.toUpperCase())
}

/** Localised country name for an ISO2 code (falls back to the code itself). */
export function countryName(code: string, locale = 'fr'): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

/** All countries as { code, name }, sorted by localised name. */
export function countryOptions(locale = 'fr'): { code: string; name: string }[] {
  let dn: Intl.DisplayNames | null = null
  try {
    dn = new Intl.DisplayNames([locale], { type: 'region' })
  } catch {
    dn = null
  }
  return COUNTRY_CODES.map((code) => ({ code, name: dn?.of(code) ?? code })).sort((a, b) =>
    a.name.localeCompare(b.name, locale)
  )
}
