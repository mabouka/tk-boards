import { z } from 'zod'

// ── Editor contract (shared by the product form + server actions) ──

const optTr = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || undefined)

export const optionValueSchema = z.object({
  code: z.string().trim().min(1),
  label: z.string().trim().min(1), // EN (primary)
  labelFr: optTr,
  labelEs: optTr,
  hex: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => v || null),
})

export const optionSchema = z.object({
  code: z.string().trim().min(1), // SIZE, COLOR
  name: z.string().trim().min(1), // EN (primary), e.g. "Size"
  nameFr: optTr,
  nameEs: optTr,
  inputType: z.enum(['swatch', 'select']),
  values: z.array(optionValueSchema).min(1),
})

export const editorVariantSchema = z.object({
  sku: z.string().trim().min(1),
  combo: z.record(z.string(), z.string()), // optionCode -> valueCode
  priceEur: z
    .string()
    .trim()
    .min(1, 'Prix requis')
    .refine((s) => !Number.isNaN(Number(s.replace(',', '.'))), 'Prix invalide')
    .transform((s) => s.replace(',', '.')),
  salePriceEur: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v ? v.replace(',', '.') : null)),
  // stock is NOT part of the product model — it's inventory, managed in /admin/stock.
  active: z.boolean(),
})

// Paid add-on (→ product_option).
export const addonSchema = z.object({
  name: z.string().trim().min(1),
  priceDelta: z
    .string()
    .trim()
    .min(1, 'Prix requis')
    .refine((s) => !Number.isNaN(Number(s.replace(',', '.'))), 'Prix invalide')
    .transform((s) => s.replace(',', '.')),
  sku: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => (v ? v.toUpperCase() : null)),
})

// Related product (→ product_link).
export const linkSchema = z.object({
  linkedProductId: z.string().trim().min(1),
  type: z.enum(['achat_conjoint', 'cross_sell', 'accessoire']),
})

export const productInputSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().trim().min(1, 'Nom requis'),
  sku: z
    .string()
    .trim()
    .min(1, 'SKU requis')
    .transform((s) => s.toUpperCase()),
  kind: z.enum(['board', 'accessory']),
  active: z.boolean(),
  miniConfigurator: z.boolean().default(false),
  options: z.array(optionSchema), // variant axes (→ product_attribute)
  variants: z.array(editorVariantSchema).min(1, 'Au moins une variante'),
  addons: z.array(addonSchema).default([]), // paid add-ons (→ product_option)
  links: z.array(linkSchema).default([]), // related products (→ product_link)
})

export type OptionValueInput = z.infer<typeof optionValueSchema>
export type OptionInput = z.infer<typeof optionSchema>
export type EditorVariant = z.infer<typeof editorVariantSchema>
export type AddonInput = z.infer<typeof addonSchema>
export type LinkInput = z.infer<typeof linkSchema>
export type LinkType = LinkInput['type']
export type ProductInput = z.infer<typeof productInputSchema>

// Read shape for the edit form: `kind` is required on save (ProductInput) but
// legacy products may still have a null kind, so loading one keeps it nullable.
export type ProductEditInput = Omit<ProductInput, 'kind'> & {
  kind: 'board' | 'accessory' | null
}
