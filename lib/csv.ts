// CSV helpers with spreadsheet formula-injection protection.
//
// A cell whose text starts with = + - @ (or a control char) is executed as a
// formula by Excel / Google Sheets when the file is opened, so those cells are
// prefixed with an apostrophe before being quoted and escaped.

export function csvField(value: unknown): string {
  const s = String(value ?? '')
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
}

/** Build a CSV document from a header row and data rows; every cell is escaped. */
export function buildCsv(
  header: string[],
  rows: readonly (readonly (string | number | null | undefined)[])[]
): string {
  const head = header.map(csvField).join(',')
  const body = rows.map((r) => r.map(csvField).join(','))
  return [head, ...body].join('\n')
}
