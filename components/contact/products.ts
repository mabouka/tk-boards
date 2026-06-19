/** Product options for the contact form's "What product?" select.
 *  Shared so the server action can map the submitted code back to a human label
 *  for the notification email (instead of sending the raw code). */
export const PRODUCTS = [
  { value: 'rocket', label: 'Rocket' },
  { value: 'wave-pro', label: 'Wave Pro' },
  { value: 'tk-02', label: 'TK 02' },
  { value: 'tk-03', label: 'TK 03' },
  { value: 'other', label: 'Another product / not sure yet' },
] as const

/** Resolve a submitted product code to its label; echoes the raw value if unknown. */
export function productLabel(value: string): string {
  return PRODUCTS.find((p) => p.value === value)?.label ?? value
}
