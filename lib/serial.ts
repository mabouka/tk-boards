// Unit serial numbers, e.g. "SN-RKT-2026-0001": SN · model code · year · sequence.
// Pure helpers here; the sequence itself is read from the DB in the units action
// (highest suffix already issued for that model+year), mirroring order numbers.

/** Model code from a product's parent SKU: "TK-RKT" → "RKT", "TK-BAG-01" → "BAG01". */
export function modelCodeFromSku(productSku: string): string {
  const code = (productSku ?? '')
    .replace(/^TK-/i, '') // drop the brand prefix
    .replace(/[^a-z0-9]/gi, '') // keep only alphanumerics
    .toUpperCase()
  return code || 'TK' // fallback if the SKU had nothing usable
}

/** Serial prefix for a model + year: "SN-RKT-2026-". */
export function serialPrefix(productSku: string, year: number): string {
  return `SN-${modelCodeFromSku(productSku)}-${year}-`
}

/** Compose a full serial from its prefix and sequence: "SN-RKT-2026-0001".
 *  Padded to 4 digits but never truncated (a 5-digit run stays intact). */
export function formatSerial(prefix: string, seq: number): string {
  return `${prefix}${String(seq).padStart(4, '0')}`
}
