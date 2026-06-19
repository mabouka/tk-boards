import { defineField, defineType } from 'sanity'
import { isUniqueSlugPerLanguage } from '../../lib/isUniqueSlugPerLanguage'

const TAG_STYLES = [
  { title: 'Cream (light fill)', value: 'cream' },
  { title: 'Dark (carbon fill)', value: 'dark' },
  { title: 'Amber (paulownia fill)', value: 'amber' },
  { title: 'Red', value: 'red' },
  { title: 'Outline light', value: 'outline-light' },
  { title: 'Outline muted', value: 'outline-muted' },
]

export const accessory = defineType({
  name: 'accessory',
  title: 'Accessory',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Basic', default: true },
    { name: 'presentation', title: 'Presentation' },
    { name: 'content', title: 'Content' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    // ── Basic ────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (r) => r.required(),
      group: 'basic',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', isUnique: isUniqueSlugPerLanguage },
      validation: (r) => r.required(),
      group: 'basic',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'accessoryCategory' }],
      description: 'Optional — used to group accessories (Fins, Boardbags…).',
      group: 'basic',
    }),
    defineField({
      name: 'skuCode',
      title: 'Model SKU code',
      type: 'string',
      description:
        'Short uppercase code linking this accessory to its storefront product/variants and the e-shop, e.g. TK-FIN-01. Optional — without it the page shows stub buy buttons. Keep it identical across languages.',
      group: 'basic',
      validation: (r) =>
        r.uppercase().regex(/^[A-Z0-9-]+$/, { name: 'uppercase letters, numbers and dashes' }),
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Used for the accessories listing, structured data, and as a gallery fallback.',
      group: 'basic',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (r) => r.required(),
        }),
      ],
    }),

    // ── Presentation ─────────────────────────────
    defineField({
      name: 'presentationTitle',
      title: 'Title',
      type: 'text',
      rows: 3,
      description: 'Big marketing headline — use line breaks to control wrapping. Falls back to the accessory title.',
      group: 'presentation',
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'array',
      of: [{ type: 'block', styles: [], lists: [], marks: { decorators: [{ title: 'Bold', value: 'strong' }], annotations: [] } }],
      description: 'Main description shown in the presentation.',
      group: 'presentation',
    }),
    defineField({
      name: 'presentationNumbers',
      title: 'Numbers',
      type: 'array',
      description: 'Key figures shown as large specs (max 4).',
      group: 'presentation',
      validation: (r) => r.max(4),
      of: [
        {
          type: 'object',
          preview: {
            select: { title: 'value', subtitle: 'label' },
            prepare: ({ title, subtitle }) => ({ title: title ?? '—', subtitle }),
          },
          fields: [
            defineField({ name: 'value', title: 'Value', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'unit', title: 'Unit', type: 'string', description: 'Optional — e.g. kg, mm, cm' }),
            defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.required() }),
          ],
        },
      ],
    }),
    defineField({
      name: 'presentationTags',
      title: 'Tags',
      type: 'array',
      group: 'presentation',
      of: [
        {
          type: 'object',
          preview: {
            select: { title: 'text', subtitle: 'style' },
            prepare: ({ title, subtitle }) => ({ title: title ?? '—', subtitle }),
          },
          fields: [
            defineField({ name: 'text', title: 'Text', type: 'string', validation: (r) => r.required() }),
            defineField({
              name: 'style',
              title: 'Style',
              type: 'string',
              options: { list: TAG_STYLES, layout: 'radio' },
              initialValue: 'outline-light',
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'specifications',
      title: 'Specifications',
      type: 'array',
      description: 'Name/value pairs (e.g. Material → Nylon) shown as a list in the presentation.',
      group: 'presentation',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', type: 'string', title: 'Name' }),
            defineField({ name: 'value', type: 'string', title: 'Value' }),
          ],
          preview: {
            select: { title: 'name', subtitle: 'value' },
          },
        },
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      description: 'Product images scrolling beside the info panel (first 3 are used).',
      group: 'presentation',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Alt Text', type: 'string', validation: (r) => r.required() }),
          ],
        },
      ],
    }),

    // ── Content ──────────────────────────────────
    defineField({
      name: 'sizes',
      title: 'Sizes',
      type: 'array',
      description: 'Optional — e.g. the different sizes available for boardbags.',
      group: 'content',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      description: 'Public price for structured data. Leave empty to omit.',
      validation: (r) => r.min(0).precision(2),
      group: 'content',
    }),
    defineField({
      name: 'originalPrice',
      title: 'Original Price',
      type: 'number',
      description: 'Optional — strike-through price when the item is discounted.',
      validation: (r) => r.min(0).precision(2),
      group: 'content',
    }),
    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      initialValue: 'EUR',
      options: {
        list: [
          { title: 'Euro (€)', value: 'EUR' },
          { title: 'US Dollar ($)', value: 'USD' },
          { title: 'British Pound (£)', value: 'GBP' },
        ],
        layout: 'radio',
      },
      group: 'content',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      group: 'content',
    }),

    // ── SEO ──────────────────────────────────────
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      description: 'Overrides the title in the browser tab and search results.',
      group: 'seo',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 3,
      description: 'Shown in search results and social previews.',
      group: 'seo',
    }),
    defineField({
      name: 'ogImage',
      title: 'Social Share Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Used for social media previews (recommended 1200×630). Falls back to the Main Image.',
      group: 'seo',
      fields: [
        defineField({ name: 'alt', title: 'Alt Text', type: 'string' }),
      ],
    }),

    // ── System ───────────────────────────────────
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
      validation: (r) => r.required(),
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      categoryName: 'category.name',
      media: 'mainImage',
    },
    prepare({ title, categoryName, media }) {
      const subtitle = Array.isArray(categoryName)
        ? (categoryName.find((n: { language: string; value: string }) => n.language === 'en')?.value ?? categoryName[0]?.value ?? '')
        : (categoryName ?? '')
      return { title, subtitle, media }
    },
  },
})
